import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { createAccountSchema, loginSchema, runSchema, saveSchema, updateSaveSchema } from "../src/validation";

describe("validation", () => {
  it("aceita um save completo do jogo", () => {
    const save = {
      version: 1,
      introSeen: true,
      currentRoom: "hub",
      maxHearts: 7,
      bossesDefeated: ["mestre"],
      keys: ["mestre"],
      abilities: ["book"],
      lore: ["hub_ata"],
      settings: { muted: false, volume: 0.72 },
      stats: { timeMs: 12345, deaths: 1, kills: 10, runs: 0 },
      endingsSeen: 0,
      finalCutsceneSeen: false,
      lastSavedAt: 1700000000000
    };
    const parsed = saveSchema.parse(save);
    assert.equal(parsed.bossesDefeated[0], "mestre");
    assert.equal(parsed.keys.length, 1);
  });

  it("preenche campos ausentes com padrões", () => {
    const parsed = saveSchema.parse({});
    assert.equal(parsed.currentRoom, "hub");
    assert.deepEqual(parsed.keys, []);
    assert.equal(parsed.maxHearts, 6);
  });

  it("recusa nome curto ou com caracteres de controle", () => {
    assert.equal(createAccountSchema.safeParse({ name: "ab", pin: "1234" }).success, false);
    assert.equal(createAccountSchema.safeParse({ name: "abc\ndef", pin: "1234" }).success, false);
  });

  it("recusa PIN que não tem 4 dígitos", () => {
    assert.equal(loginSchema.safeParse({ name: "kennedito", pin: "12" }).success, false);
    assert.equal(loginSchema.safeParse({ name: "kennedito", pin: "abcd" }).success, false);
    assert.equal(loginSchema.safeParse({ name: "kennedito", pin: "1234" }).success, true);
  });

  it("rejeita campos extras no update de save", () => {
    assert.equal(updateSaveSchema.safeParse({ save: {}, hacker: 1 }).success, false);
  });

  it("valida o envio de tempo no ranking", () => {
    assert.equal(runSchema.safeParse({ timeMs: 1000 }).success, true);
    assert.equal(runSchema.safeParse({ timeMs: 0 }).success, false);
    assert.equal(runSchema.safeParse({ timeMs: 10, deaths: -1 }).success, false);
  });
});
