export const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS accounts (
  id uuid PRIMARY KEY,
  name text NOT NULL,
  name_key text NOT NULL UNIQUE,
  pin_hash text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_login_at timestamptz
);

CREATE TABLE IF NOT EXISTS sessions (
  token_hash text PRIMARY KEY,
  account_id uuid NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL
);

CREATE INDEX IF NOT EXISTS sessions_account_id_idx ON sessions (account_id);
CREATE INDEX IF NOT EXISTS sessions_expires_at_idx ON sessions (expires_at);

CREATE TABLE IF NOT EXISTS player_saves (
  account_id uuid PRIMARY KEY REFERENCES accounts(id) ON DELETE CASCADE,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS runs (
  id bigserial PRIMARY KEY,
  account_id uuid NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  time_ms bigint NOT NULL,
  deaths integer NOT NULL DEFAULT 0,
  kills integer NOT NULL DEFAULT 0,
  bosses integer NOT NULL DEFAULT 0,
  lore integer NOT NULL DEFAULT 0,
  difficulty text NOT NULL DEFAULT 'normal',
  completed_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS runs_account_id_idx ON runs (account_id);
CREATE INDEX IF NOT EXISTS runs_time_ms_idx ON runs (time_ms);
`;

/* Migrações para bancos que já existem: o CREATE TABLE IF NOT EXISTS acima
   não muda tabela antiga, então as colunas novas entram aqui. */
export const MIGRATIONS_SQL: string[] = [
  `ALTER TABLE runs ADD COLUMN IF NOT EXISTS difficulty text NOT NULL DEFAULT 'normal'`
];
