import type { Pool } from "pg";
import { z, type ZodTypeAny } from "zod";
import type { AppConfig } from "./config";
import {
  countRuns,
  createAccountWithSession,
  createSession,
  findAccountByNameKey,
  findSession,
  getSave,
  insertRun,
  listBestRuns,
  ping,
  revokeSession,
  touchLogin,
  upsertSave
} from "./repository";
import { DUMMY_PIN_HASH, hashPin, normalizeName, verifyPin } from "./security";
import type { AccountPublic } from "./types";
import {
  createAccountSchema,
  emptySave,
  firstIssue,
  loginSchema,
  runSchema,
  updateSaveSchema
} from "./validation";

/* =========================================================
   Núcleo da API do Kennedito.

   Toda a regra de negócio mora aqui, para que os dois
   transportes compartilhem exatamente o mesmo comportamento:

   - back/src/app.ts      → Express 5 (Render / Node comum)
   - back/src/function.ts → Fetch API (Neon Functions)

   Cada função devolve { status, body } e nunca toca em
   req/res: quem chama decide como responder.
   ========================================================= */

export interface AuthContext {
  account: AccountPublic;
  tokenHash: string;
}

export interface CoreResponse {
  status: number;
  body?: unknown;
}

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly retryAfterSeconds?: number;

  constructor(status: number, message: string, code = "request_error", retryAfterSeconds?: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

/* ---------------- limite de requisições ---------------- */

export interface LimitVerdict {
  allowed: boolean;
  retryAfterSeconds: number;
}

export interface RateLimiter {
  check(key: string): LimitVerdict;
}

export function createRateLimiter(max: number, windowMs: number): RateLimiter {
  const buckets = new Map<string, { count: number; resetAt: number }>();
  return {
    check(key: string): LimitVerdict {
      const now = Date.now();
      let bucket = buckets.get(key);
      if (!bucket || bucket.resetAt <= now) {
        if (buckets.size > 5000) {
          for (const [bucketKey, value] of buckets) {
            if (value.resetAt <= now) buckets.delete(bucketKey);
          }
        }
        bucket = { count: 0, resetAt: now + windowMs };
        buckets.set(key, bucket);
      }
      if (bucket.count >= max) {
        return {
          allowed: false,
          retryAfterSeconds: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000))
        };
      }
      bucket.count += 1;
      return { allowed: true, retryAfterSeconds: 0 };
    }
  };
}

/* ---------------- contexto ---------------- */

export interface LoginFailure {
  count: number;
  firstAt: number;
  blockedUntil: number;
}

export interface CoreContext {
  pool: Pool;
  config: AppConfig;
  loginFailures: Map<string, LoginFailure>;
  limiters: {
    auth: RateLimiter;
    save: RateLimiter;
    run: RateLimiter;
  };
}

export function createCoreContext(pool: Pool, config: AppConfig): CoreContext {
  return {
    pool,
    config,
    loginFailures: new Map<string, LoginFailure>(),
    limiters: {
      auth: createRateLimiter(20, 60_000),
      save: createRateLimiter(180, 60_000),
      run: createRateLimiter(30, 60_000)
    }
  };
}

const MAX_LOGIN_FAILURES = 8;
const LOGIN_FAILURE_WINDOW_MS = 15 * 60 * 1000;
const LOGIN_BLOCK_MS = 15 * 60 * 1000;

/* ---------------- auxiliares ---------------- */

export function parseBody<S extends ZodTypeAny>(schema: S, raw: unknown): z.output<S> {
  const result = schema.safeParse(raw);
  if (!result.success) {
    throw new ApiError(400, firstIssue(result.error), "invalid_payload");
  }
  return result.data;
}

export function enforceLimit(
  ctx: CoreContext,
  bucket: keyof CoreContext["limiters"],
  key: string
): void {
  const verdict = ctx.limiters[bucket].check(key);
  if (!verdict.allowed) {
    throw new ApiError(
      429,
      "Muitas tentativas. Aguarde um pouco e tente de novo.",
      "rate_limited",
      verdict.retryAfterSeconds
    );
  }
}

export function bearerToken(header: string | null | undefined): string | null {
  const value = String(header || "");
  const match = /^Bearer\s+(.+)$/i.exec(value);
  return match ? match[1].trim() : null;
}

export async function authenticate(ctx: CoreContext, token: string | null): Promise<AuthContext> {
  if (!token) {
    throw new ApiError(401, "Sessão ausente. Entre novamente.", "unauthorized");
  }
  const session = await findSession(ctx.pool, token);
  if (!session) {
    throw new ApiError(401, "Sessão expirada. Entre novamente.", "unauthorized");
  }
  return session;
}

function loginFailureKey(ip: string, nameKey: string): string {
  return `${ip}|${nameKey}`;
}

function recordLoginFailure(
  failures: Map<string, LoginFailure>,
  failureKey: string,
  now: number
): void {
  const failure = failures.get(failureKey);
  if (!failure || now - failure.firstAt > LOGIN_FAILURE_WINDOW_MS) {
    failures.set(failureKey, { count: 1, firstAt: now, blockedUntil: 0 });
    return;
  }
  failure.count += 1;
  if (failure.count >= MAX_LOGIN_FAILURES) {
    failure.blockedUntil = now + LOGIN_BLOCK_MS;
    failure.count = 0;
    failure.firstAt = now;
  }
}

/* ---------------- rotas ---------------- */

export async function health(ctx: CoreContext): Promise<CoreResponse> {
  try {
    await ping(ctx.pool);
    return {
      status: 200,
      body: {
        ok: true,
        service: "kennedito-api",
        database: "ok",
        time: new Date().toISOString()
      }
    };
  } catch {
    throw new ApiError(503, "Banco de dados indisponível.", "database_unavailable");
  }
}

export async function serviceInfo(): Promise<CoreResponse> {
  return {
    status: 200,
    body: { service: "kennedito-api", status: "ok", docs: "/api/health" }
  };
}

export async function createAccount(ctx: CoreContext, raw: unknown, ip: string): Promise<CoreResponse> {
  enforceLimit(ctx, "auth", ip);
  const body = parseBody(createAccountSchema, raw);

  const nameKey = normalizeName(body.name);
  const existing = await findAccountByNameKey(ctx.pool, nameKey);
  if (existing) {
    throw new ApiError(
      409,
      "Já existe uma conta com esse nome. Use a aba ENTRAR.",
      "account_exists"
    );
  }

  const pinHash = await hashPin(body.pin, ctx.config.bcryptRounds);
  const created = await createAccountWithSession(ctx.pool, {
    name: body.name,
    nameKey,
    pinHash,
    save: body.save || emptySave(),
    sessionDays: ctx.config.sessionDays
  });

  return {
    status: 201,
    body: {
      token: created.token,
      account: created.account,
      save: created.save
    }
  };
}

export async function login(ctx: CoreContext, raw: unknown, ip: string): Promise<CoreResponse> {
  enforceLimit(ctx, "auth", ip);
  const body = parseBody(loginSchema, raw);

  const nameKey = normalizeName(body.name);
  const failureKey = loginFailureKey(ip, nameKey);
  const now = Date.now();
  const failure = ctx.loginFailures.get(failureKey);
  if (failure && failure.blockedUntil > now) {
    const minutes = Math.ceil((failure.blockedUntil - now) / 60000);
    throw new ApiError(
      429,
      `Muitas tentativas para este nome. Tente novamente em ${minutes} minuto(s).`,
      "login_blocked"
    );
  }

  const account = await findAccountByNameKey(ctx.pool, nameKey);
  if (!account) {
    // verifica um hash falso para não revelar quais nomes existem pelo tempo
    await verifyPin(body.pin, DUMMY_PIN_HASH);
    recordLoginFailure(ctx.loginFailures, failureKey, now);
    throw new ApiError(401, "Nome ou chave de acesso incorretos.", "invalid_credentials");
  }

  const valid = await verifyPin(body.pin, account.pin_hash);
  if (!valid) {
    recordLoginFailure(ctx.loginFailures, failureKey, now);
    throw new ApiError(401, "Nome ou chave de acesso incorretos.", "invalid_credentials");
  }

  ctx.loginFailures.delete(failureKey);
  await touchLogin(ctx.pool, account.id);
  const session = await createSession(ctx.pool, account.id, ctx.config.sessionDays);
  const stored = await getSave(ctx.pool, account.id);
  return {
    status: 200,
    body: {
      token: session.token,
      account: {
        id: account.id,
        name: account.name,
        createdAt: new Date(account.created_at).toISOString(),
        lastLoginAt: new Date().toISOString()
      },
      save: stored.save,
      saveUpdatedAt: stored.updatedAt
    }
  };
}

export async function logout(ctx: CoreContext, token: string | null): Promise<CoreResponse> {
  const auth = await authenticate(ctx, token);
  await revokeSession(ctx.pool, auth.tokenHash);
  return { status: 204 };
}

export async function me(ctx: CoreContext, token: string | null): Promise<CoreResponse> {
  const auth = await authenticate(ctx, token);
  const stored = await getSave(ctx.pool, auth.account.id);
  return {
    status: 200,
    body: { account: auth.account, save: stored.save, saveUpdatedAt: stored.updatedAt }
  };
}

export async function getSaveRoute(ctx: CoreContext, token: string | null): Promise<CoreResponse> {
  const auth = await authenticate(ctx, token);
  const stored = await getSave(ctx.pool, auth.account.id);
  return { status: 200, body: { save: stored.save, updatedAt: stored.updatedAt } };
}

export async function putSave(
  ctx: CoreContext,
  token: string | null,
  raw: unknown,
  ip: string
): Promise<CoreResponse> {
  enforceLimit(ctx, "save", ip);
  const body = parseBody(updateSaveSchema, raw);
  const auth = await authenticate(ctx, token);
  const stored = await upsertSave(ctx.pool, auth.account.id, body.save);
  return { status: 200, body: { save: stored.save, updatedAt: stored.updatedAt } };
}

export async function leaderboard(ctx: CoreContext, limitRaw: unknown): Promise<CoreResponse> {
  const raw = Number(limitRaw);
  const limit = Number.isFinite(raw) && raw > 0 ? Math.min(50, Math.floor(raw)) : 10;
  const rows = await listBestRuns(ctx.pool, limit);
  const total = await countRuns(ctx.pool);
  return {
    status: 200,
    body: {
      entries: rows.map((row, index) => ({
        rank: index + 1,
        name: row.name,
        timeMs: row.timeMs,
        deaths: row.deaths,
        difficulty: row.difficulty
      })),
      total
    }
  };
}

export async function submitRun(
  ctx: CoreContext,
  token: string | null,
  raw: unknown,
  ip: string
): Promise<CoreResponse> {
  enforceLimit(ctx, "run", ip);
  const body = parseBody(runSchema, raw);
  const auth = await authenticate(ctx, token);
  const run = await insertRun(ctx.pool, auth.account.id, body);
  return {
    status: 201,
    body: {
      ok: true,
      run: {
        id: run.id,
        timeMs: Number(run.time_ms),
        deaths: run.deaths,
        kills: run.kills,
        bosses: run.bosses,
        lore: run.lore,
        difficulty: body.difficulty,
        completedAt: new Date(run.completed_at).toISOString()
      }
    }
  };
}
