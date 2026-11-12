export interface AccountPublic {
  id: string;
  name: string;
  createdAt: string;
  lastLoginAt: string | null;
}

export interface AccountRow {
  id: string;
  name: string;
  created_at: Date;
  last_login_at: Date | null;
}

export interface AccountWithHashRow extends AccountRow {
  pin_hash: string;
}

export interface SessionRow extends AccountRow {
  token_hash: string;
}

export interface RunRow {
  id: string;
  name: string;
  time_ms: number;
  deaths: number;
  kills: number;
  bosses: number;
  lore: number;
  difficulty: string;
  completed_at: Date;
}
