import { Pool } from "pg";
import { loadConfig, type AppConfig } from "./config";
import { ensureSchema } from "./db";
import {
  ApiError,
  bearerToken,
  createAccount,
  createCoreContext,
  getSaveRoute,
  health,
  leaderboard,
  login,
  logout,
  me,
  putSave,
  serviceInfo,
  submitRun,
  type CoreContext
} from "./core";

/* =========================================================
   API do Kennedito como Function do Neon (Fetch API).

   O mesmo núcleo (core.ts) roda no Express (back/src/app.ts);
   aqui só traduzimos Request/Response. Assim o Render e a
   Function do Neon respondem exatamente igual.

   O DATABASE_URL é injetado pelo Neon no branch.
   ========================================================= */

let contextPromise: Promise<CoreContext> | null = null;

function getContext(): Promise<CoreContext> {
  if (!contextPromise) {
    contextPromise = (async () => {
      const config: AppConfig = loadConfig();
      const pool = new Pool({
        connectionString: config.databaseUrl,
        ssl: config.databaseSsl ? { rejectUnauthorized: false } : undefined,
        max: 5,
        idleTimeoutMillis: 30_000,
        connectionTimeoutMillis: 10_000
      });
      pool.on("error", (error) => {
        console.error("[db] erro inesperado no pool do Postgres:", error);
      });
      // o schema é conferido no boot: coluna nova entra sozinha no deploy
      if (config.autoMigrate) {
        try {
          await ensureSchema(pool);
        } catch (error) {
          console.error("[api] falha ao conferir o schema:", error);
        }
      }
      return createCoreContext(pool, config);
    })();
  }
  return contextPromise;
}

function corsHeaders(request: Request, config: AppConfig): Record<string, string> {
  const origin = request.headers.get("origin");
  const headers: Record<string, string> = {
    Vary: "Origin",
    "Access-Control-Allow-Methods": "GET, POST, PUT, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400"
  };
  if (!origin) return headers;
  if (config.corsOrigins.includes("*") || config.corsOrigins.includes(origin)) {
    headers["Access-Control-Allow-Origin"] = origin;
  }
  return headers;
}

function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  return request.headers.get("x-real-ip") || "unknown";
}

async function readJson(request: Request): Promise<unknown> {
  const text = await request.text();
  if (!text) return undefined;
  try {
    return JSON.parse(text);
  } catch {
    throw new ApiError(400, "JSON inválido no corpo da requisição.", "invalid_json");
  }
}

function jsonResponse(
  status: number,
  body: unknown,
  extraHeaders: Record<string, string>
): Response {
  const headers: Record<string, string> = {
    "content-type": "application/json; charset=utf-8",
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "no-referrer",
    "Cache-Control": "no-store",
    ...extraHeaders
  };
  if (status === 204 || body === undefined) {
    return new Response(null, { status, headers });
  }
  return new Response(JSON.stringify(body), { status, headers });
}

/* O handler recebe o contexto pronto: em produção vem do Neon,
   nos testes vem do pg-mem. */
export function createHandler(ctx: CoreContext) {
  const config = ctx.config;

  return {
    async fetch(request: Request): Promise<Response> {
      const extra = corsHeaders(request, config);

      if (request.method === "OPTIONS") {
        return new Response(null, { status: 204, headers: extra });
      }

      const url = new URL(request.url);
      const path = url.pathname.replace(/\/+$/, "") || "/";
      const method = request.method.toUpperCase();

      try {
        const token = bearerToken(request.headers.get("authorization"));
        const ip = clientIp(request);

        if (method === "GET" && path === "/") {
          const out = await serviceInfo();
          return jsonResponse(out.status, out.body, extra);
        }
        if (method === "GET" && (path === "/health" || path === "/api/health")) {
          const out = await health(ctx);
          return jsonResponse(out.status, out.body, extra);
        }
        if (method === "POST" && path === "/api/accounts") {
          const out = await createAccount(ctx, await readJson(request), ip);
          return jsonResponse(out.status, out.body, extra);
        }
        if (method === "POST" && path === "/api/accounts/login") {
          const out = await login(ctx, await readJson(request), ip);
          return jsonResponse(out.status, out.body, extra);
        }
        if (method === "POST" && path === "/api/accounts/logout") {
          const out = await logout(ctx, token);
          return jsonResponse(out.status, out.body, extra);
        }
        if (method === "GET" && path === "/api/me") {
          const out = await me(ctx, token);
          return jsonResponse(out.status, out.body, extra);
        }
        if (method === "GET" && path === "/api/me/save") {
          const out = await getSaveRoute(ctx, token);
          return jsonResponse(out.status, out.body, extra);
        }
        if (method === "PUT" && path === "/api/me/save") {
          const out = await putSave(ctx, token, await readJson(request), ip);
          return jsonResponse(out.status, out.body, extra);
        }
        if (method === "GET" && path === "/api/leaderboard") {
          const out = await leaderboard(ctx, url.searchParams.get("limit"));
          return jsonResponse(out.status, out.body, extra);
        }
        if (method === "POST" && path === "/api/runs") {
          const out = await submitRun(ctx, token, await readJson(request), ip);
          return jsonResponse(out.status, out.body, extra);
        }

        return jsonResponse(
          404,
          { error: { code: "not_found", message: "Rota não encontrada." } },
          extra
        );
      } catch (error) {
        if (error instanceof ApiError) {
          const headers = { ...extra };
          if (error.retryAfterSeconds) {
            headers["Retry-After"] = String(error.retryAfterSeconds);
          }
          return jsonResponse(
            error.status,
            { error: { code: error.code, message: error.message } },
            headers
          );
        }
        console.error("[api] erro não tratado:", error);
        return jsonResponse(
          500,
          { error: { code: "internal_error", message: "Erro interno do servidor." } },
          extra
        );
      }
    }
  };
}

export default {
  async fetch(request: Request): Promise<Response> {
    try {
      const ctx = await getContext();
      return await createHandler(ctx).fetch(request);
    } catch (error) {
      console.error("[api] falha ao iniciar a Function:", error);
      return jsonResponse(
        503,
        {
          error: {
            code: "not_configured",
            message: (error as Error).message || "A API não está configurada."
          }
        },
        {}
      );
    }
  }
};
