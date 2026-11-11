import { createHash, randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";

export function normalizeName(name: string): string {
  return String(name || "").trim().replace(/\s+/g, " ").toLowerCase();
}

export async function hashPin(pin: string, rounds = 12): Promise<string> {
  return bcrypt.hash(pin, rounds);
}

export async function verifyPin(pin: string, hash: string): Promise<boolean> {
  try {
    return await bcrypt.compare(pin, hash);
  } catch {
    return false;
  }
}

export function generateToken(): string {
  return randomBytes(32).toString("base64url");
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function sessionExpiry(days: number): Date {
  return new Date(Date.now() + Math.max(1, days) * 24 * 60 * 60 * 1000);
}

// Hash de "0000" usado para manter o custo de verificação parecido
// quando o nome não existe. Evita revelar quais contas existem pelo tempo.
export const DUMMY_PIN_HASH = "$2b$12$VuAexFoI83XzfdQ8NgKNT.pW1ejf1UYxtJj5QearZ0Fa33Ddz0E2W";
