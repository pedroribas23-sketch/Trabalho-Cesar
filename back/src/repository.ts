import { randomUUID } from "node:crypto";
import type { Pool } from "pg";
import { generateToken, hashToken, sessionExpiry } from "./security";
import type { AccountPublic, AccountRow, AccountWithHashRow, RunRow, SessionRow } from "./types";
import { emptySave, saveSchema, type SaveData } from "./validation";

function toPublicAccount(row: AccountRow): AccountPublic {
  return {
    id: row.id,
    name: row.name,
    createdAt: new Date(row.created_at).toISOString(),
    lastLoginAt: row.last_login_at ? new Date(row.last_login_at).toISOString() : null
  };
}

export async function ping(pool: Pool): Promise<void> {
  await pool.query("SELECT 1");
}

export async function findAccountByNameKey(
  pool: Pool,
  nameKey: string
): Promise<AccountWithHashRow | null> {
  const result = await pool.query<AccountWithHashRow>(
    `SELECT id, name, pin_hash, created_at, last_login_at
       FROM accounts
      WHERE name_key = $1
      LIMIT 1`,
    [nameKey]
  );
  return result.rows[0] || null;
}

export interface CreateAccountInput {
  name: string;
  nameKey: string;
  pinHash: string;
  save: SaveData;
  sessionDays: number;
}

export interface CreatedAccount {
  token: string;
  account: AccountPublic;
  save: SaveData;
}

export async function createAccountWithSession(
  pool: Pool,
  input: CreateAccountInput
): Promise<CreatedAccount> {
  const client = await pool.connect();
  const id = randomUUID();
  const token = generateToken();
  const tokenHash = hashToken(token);
  const expiresAt = sessionExpiry(input.sessionDays);
  try {
    await client.query("BEGIN");
    const accountResult = await client.query<AccountRow>(
      `INSERT INTO accounts (id, name, name_key, pin_hash, last_login_at)
       VALUES ($1, $2, $3, $4, now())
       RETURNING id, name, created_at, last_login_at`,
      [id, input.name, input.nameKey, input.pinHash]
    );
    await client.query(
      `INSERT INTO player_saves (account_id, data)
       VALUES ($1, $2::jsonb)`,
      [id, JSON.stringify(input.save)]
    );
    await client.query(
      `INSERT INTO sessions (token_hash, account_id, expires_at)
       VALUES ($1, $2, $3)`,
      [tokenHash, id, expiresAt]
    );
    await client.query("COMMIT");
    return {
      token,
      account: toPublicAccount(accountResult.rows[0]),
      save: input.save
    };
  } catch (error) {
    try {
      await client.query("ROLLBACK");
    } catch {
      // Ignora falha de rollback; o erro original é mais útil.
    }
    throw error;
  } finally {
    client.release();
  }
}

export async function createSession(
  pool: Pool,
  accountId: string,
  sessionDays: number
): Promise<{ token: string; tokenHash: string }> {
  const token = generateToken();
  const tokenHash = hashToken(token);
  await pool.query(
    `INSERT INTO sessions (token_hash, account_id, expires_at)
     VALUES ($1, $2, $3)`,
    [tokenHash, accountId, sessionExpiry(sessionDays)]
  );
  return { token, tokenHash };
}

export async function findSession(
  pool: Pool,
  token: string
): Promise<{ account: AccountPublic; tokenHash: string } | null> {
  const tokenHash = hashToken(token);
  const result = await pool.query<SessionRow>(
    `SELECT a.id, a.name, a.created_at, a.last_login_at, s.token_hash
       FROM sessions s
       JOIN accounts a ON a.id = s.account_id
      WHERE s.token_hash = $1
        AND s.expires_at > $2
      LIMIT 1`,
    [tokenHash, new Date()]
  );
  const row = result.rows[0];
  if (!row) return null;
  return { account: toPublicAccount(row), tokenHash };
}

export async function revokeSession(pool: Pool, tokenHash: string): Promise<void> {
  await pool.query("DELETE FROM sessions WHERE token_hash = $1", [tokenHash]);
}

export async function touchLogin(pool: Pool, accountId: string): Promise<void> {
  await pool.query("UPDATE accounts SET last_login_at = now() WHERE id = $1", [accountId]);
}

export async function getSave(
  pool: Pool,
  accountId: string
): Promise<{ save: SaveData; updatedAt: string | null }> {
  const result = await pool.query<{ data: unknown; updated_at: Date }>(
    `SELECT data, updated_at
       FROM player_saves
      WHERE account_id = $1
      LIMIT 1`,
    [accountId]
  );
  const row = result.rows[0];
  if (!row) return { save: emptySave(), updatedAt: null };
  const parsed = saveSchema.safeParse(row.data);
  return {
    save: parsed.success ? parsed.data : emptySave(),
    updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : null
  };
}

export async function upsertSave(
  pool: Pool,
  accountId: string,
  save: SaveData
): Promise<{ save: SaveData; updatedAt: string }> {
  const result = await pool.query<{ data: SaveData; updated_at: Date }>(
    `INSERT INTO player_saves (account_id, data, updated_at)
     VALUES ($1, $2::jsonb, now())
     ON CONFLICT (account_id)
     DO UPDATE SET data = EXCLUDED.data, updated_at = now()
     RETURNING data, updated_at`,
    [accountId, JSON.stringify(save)]
  );
  const row = result.rows[0];
  return {
    save: saveSchema.parse(row.data),
    updatedAt: new Date(row.updated_at).toISOString()
  };
}

export interface RunInput {
  timeMs: number;
  deaths: number;
  kills: number;
  bosses: number;
  lore: number;
  completedAt?: string;
}

export async function insertRun(pool: Pool, accountId: string, run: RunInput): Promise<RunRow> {
  const completedAt = run.completedAt ? new Date(run.completedAt) : new Date();
  const result = await pool.query<RunRow>(
    `INSERT INTO runs (account_id, time_ms, deaths, kills, bosses, lore, completed_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING id, time_ms, deaths, kills, bosses, lore, completed_at`,
    [
      accountId,
      run.timeMs,
      run.deaths,
      run.kills,
      run.bosses,
      run.lore,
      Number.isNaN(completedAt.getTime()) ? new Date() : completedAt
    ]
  );
  return result.rows[0];
}

export async function listBestRuns(
  pool: Pool,
  limit: number
): Promise<Array<{ name: string; timeMs: number; deaths: number }>> {
  const result = await pool.query<{ name: string; time_ms: number; deaths: number }>(
    `SELECT a.name, r.time_ms, r.deaths
       FROM runs r
       JOIN accounts a ON a.id = r.account_id
      ORDER BY r.time_ms ASC, r.completed_at ASC
      LIMIT $1`,
    [limit]
  );
  return result.rows.map((row) => ({
    name: row.name,
    timeMs: Number(row.time_ms),
    deaths: Number(row.deaths)
  }));
}

export async function countRuns(pool: Pool): Promise<number> {
  const result = await pool.query<{ count: string }>("SELECT COUNT(*)::text AS count FROM runs");
  return Number(result.rows[0]?.count || 0);
}
