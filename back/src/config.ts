import "dotenv/config";

export interface AppConfig {
  port: number;
  host: string;
  databaseUrl: string;
  databaseSsl: boolean;
  corsOrigins: string[];
  sessionDays: number;
  bcryptRounds: number;
  autoMigrate: boolean;
}

function intEnv(value: string | undefined, fallback: number, min: number, max: number): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, Math.floor(parsed)));
}

function boolEnv(value: string | undefined, fallback: boolean): boolean {
  if (value == null || value === "") return fallback;
  return /^(1|true|yes|on)$/i.test(value);
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  const databaseUrl = String(env.DATABASE_URL || "").trim();
  if (!databaseUrl) {
    throw new Error(
      "DATABASE_URL não configurada. Defina a connection string do Postgres do Render no ambiente."
    );
  }

  const corsOrigins = String(env.CORS_ORIGIN || "*")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  return {
    port: intEnv(env.PORT, 3001, 1, 65535),
    host: String(env.HOST || "0.0.0.0").trim() || "0.0.0.0",
    databaseUrl,
    databaseSsl: boolEnv(env.DATABASE_SSL, false),
    corsOrigins: corsOrigins.length ? corsOrigins : ["*"],
    sessionDays: intEnv(env.SESSION_DAYS, 30, 1, 365),
    bcryptRounds: intEnv(env.BCRYPT_ROUNDS, 12, 4, 15),
    autoMigrate: boolEnv(env.AUTO_MIGRATE, true)
  };
}

let cached: AppConfig | null = null;

export function getConfig(): AppConfig {
  if (!cached) cached = loadConfig();
  return cached;
}
