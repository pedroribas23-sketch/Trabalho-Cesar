import { Pool } from "pg";
import { getConfig } from "./config";
import { SCHEMA_SQL } from "./schema";

let sharedPool: Pool | null = null;

export function createPool(): Pool {
  const config = getConfig();
  const pool = new Pool({
    connectionString: config.databaseUrl,
    ssl: config.databaseSsl ? { rejectUnauthorized: false } : undefined,
    max: 10,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000
  });
  pool.on("error", (error) => {
    console.error("[db] erro inesperado no pool do Postgres:", error);
  });
  return pool;
}

export function getPool(): Pool {
  if (!sharedPool) sharedPool = createPool();
  return sharedPool;
}

export async function ensureSchema(pool: Pool = getPool()): Promise<void> {
  await pool.query(SCHEMA_SQL);
}

export async function checkDatabase(pool: Pool = getPool()): Promise<void> {
  await pool.query("SELECT 1");
}

export async function closePool(): Promise<void> {
  if (!sharedPool) return;
  const pool = sharedPool;
  sharedPool = null;
  await pool.end();
}
