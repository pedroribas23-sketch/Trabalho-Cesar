import { z } from "zod";

const namePattern = /^[^\u0000-\u001f<>]+$/u;

const bossIdSchema = z.string().min(1).max(40);
const loreIdSchema = z.string().min(1).max(60);

/* As dificuldades que o jogo oferece. Uma dificuldade desconhecida
   (save antigo, cliente desatualizado) cai para "normal" em vez de
   fazer o save inteiro ser recusado. */
export const difficultySchema = z.enum(["facil", "normal", "dificil"]).catch("normal");

export const saveSchema = z
  .object({
    version: z.number().int().min(1).max(100).default(1),
    introSeen: z.boolean().default(false),
    currentRoom: z.string().min(1).max(40).default("hub"),
    maxHearts: z.number().int().min(1).max(20).default(6),
    bossesDefeated: z.array(bossIdSchema).max(10).default([]),
    keys: z.array(bossIdSchema).max(10).default([]),
    abilities: z.array(z.string().min(1).max(40)).max(20).default([]),
    lore: z.array(loreIdSchema).max(60).default([]),
    settings: z
      .object({
        muted: z.boolean().default(false),
        volume: z.number().min(0).max(1).default(0.72),
        difficulty: difficultySchema.default("normal")
      })
      .default({ muted: false, volume: 0.72, difficulty: "normal" }),
    stats: z
      .object({
        // o front acumula dt * 1000 e pode chegar fracionario: arredonda
        timeMs: z
          .number()
          .min(0)
          .max(999_999_999)
          .transform((value) => Math.round(value))
          .default(0),
        deaths: z.number().int().min(0).max(999_999).default(0),
        kills: z.number().int().min(0).max(999_999).default(0),
        runs: z.number().int().min(0).max(999_999).default(0)
      })
      .default({ timeMs: 0, deaths: 0, kills: 0, runs: 0 }),
    endingsSeen: z.number().int().min(0).max(999).default(0),
    finalCutsceneSeen: z.boolean().default(false),
    lastSavedAt: z.number().int().min(0).default(0)
  })
  .passthrough();

export type SaveData = z.infer<typeof saveSchema>;

export const accountNameSchema = z
  .string()
  .trim()
  .min(3, "O apelido precisa ter entre 3 e 18 caracteres.")
  .max(18, "O apelido precisa ter entre 3 e 18 caracteres.")
  .regex(namePattern, "O apelido contém caracteres inválidos.")
  .transform((value) => value.replace(/\s+/g, " "));

export const pinSchema = z
  .string()
  .regex(/^\d{4}$/, "A chave de acesso precisa ter exatamente 4 números.");

export const createAccountSchema = z
  .object({
    name: accountNameSchema,
    pin: pinSchema,
    save: saveSchema.optional()
  })
  .strict();

export const loginSchema = z
  .object({
    name: accountNameSchema,
    pin: pinSchema
  })
  .strict();

export const updateSaveSchema = z
  .object({
    save: saveSchema
  })
  .strict();

export const runSchema = z
  .object({
    timeMs: z
      .number()
      .min(1)
      .max(999_999_999)
      .transform((value) => Math.round(value)),
    deaths: z.number().int().min(0).max(999_999).default(0),
    kills: z.number().int().min(0).max(999_999).default(0),
    bosses: z.number().int().min(0).max(10).default(0),
    lore: z.number().int().min(0).max(100).default(0),
    difficulty: difficultySchema.default("normal"),
    completedAt: z.string().max(40).optional()
  })
  .strict();

export function emptySave(): SaveData {
  return saveSchema.parse({});
}

export function firstIssue(error: z.ZodError): string {
  const issue = error.issues[0];
  return issue ? issue.message : "Dados inválidos.";
}
