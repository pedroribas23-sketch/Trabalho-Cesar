import test from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import { newDb } from "pg-mem";
import type { Pool } from "pg";
import { createApp } from "../src/app";
import type { AppConfig } from "../src/config";
import { SCHEMA_SQL } from "../src/schema";
import { emptySave } from "../src/validation";

const config: AppConfig = {
  port: 0,
  host: "127.0.0.1",
  databaseUrl: "pg-mem",
  databaseSsl: false,
  corsOrigins: ["*"],
  sessionDays: 30,
  bcryptRounds: 4,
  autoMigrate: false
};

function makeApp() {
  const db = newDb();
  db.public.none(SCHEMA_SQL);
  const adapter = db.adapters.createPg();
  const pool = new adapter.Pool() as unknown as Pool;
  return { app: createApp({ pool, config }), pool };
}

function gameSave() {
  const save = emptySave();
  save.introSeen = true;
  save.currentRoom = "hub";
  save.maxHearts = 7;
  save.bossesDefeated = ["mestre"];
  save.keys = ["mestre"];
  save.abilities = ["book"];
  save.lore = ["hub_ata"];
  save.stats.timeMs = 60000;
  save.stats.deaths = 2;
  return save;
}

test("health responde com o banco disponível", async () => {
  const { app } = makeApp();
  const response = await request(app).get("/api/health");
  assert.equal(response.status, 200);
  assert.equal(response.body.ok, true);
  assert.equal(response.body.database, "ok");
});

test("cria conta, restaura sessão e salva o estado completo", async () => {
  const { app } = makeApp();
  const save = gameSave();

  const created = await request(app)
    .post("/api/accounts")
    .send({ name: "Kennedito", pin: "1234", save });
  assert.equal(created.status, 201);
  assert.equal(created.body.account.name, "Kennedito");
  assert.ok(created.body.token);
  assert.deepEqual(created.body.save.bossesDefeated, ["mestre"]);
  assert.deepEqual(created.body.save.keys, ["mestre"]);

  const me = await request(app)
    .get("/api/me")
    .set("Authorization", `Bearer ${created.body.token}`);
  assert.equal(me.status, 200);
  assert.equal(me.body.save.stats.deaths, 2);
  assert.equal(me.body.save.lore[0], "hub_ata");

  const updated = await request(app)
    .put("/api/me/save")
    .set("Authorization", `Bearer ${created.body.token}`)
    .send({ save: { ...save, currentRoom: "sala2", bossesDefeated: ["mestre", "programas"] } });
  assert.equal(updated.status, 200);
  assert.equal(updated.body.save.currentRoom, "sala2");
  assert.equal(updated.body.save.bossesDefeated.length, 2);
});

test("recusa nome duplicado e PIN errado", async () => {
  const { app } = makeApp();
  const first = await request(app).post("/api/accounts").send({ name: "Zeca", pin: "1234" });
  assert.equal(first.status, 201);

  const duplicate = await request(app).post("/api/accounts").send({ name: " zeca ", pin: "1234" });
  assert.equal(duplicate.status, 409);

  const login = await request(app).post("/api/accounts/login").send({ name: "Zeca", pin: "9999" });
  assert.equal(login.status, 401);

  const ok = await request(app).post("/api/accounts/login").send({ name: "Zeca", pin: "1234" });
  assert.equal(ok.status, 200);
  assert.ok(ok.body.token);
});

test("exige sessão para ler e escrever o save", async () => {
  const { app } = makeApp();
  const noAuth = await request(app).get("/api/me");
  assert.equal(noAuth.status, 401);

  const created = await request(app).post("/api/accounts").send({ name: "Ana", pin: "4321" });
  const logout = await request(app)
    .post("/api/accounts/logout")
    .set("Authorization", `Bearer ${created.body.token}`);
  assert.equal(logout.status, 204);

  const afterLogout = await request(app)
    .get("/api/me")
    .set("Authorization", `Bearer ${created.body.token}`);
  assert.equal(afterLogout.status, 401);
});

test("registra tempo no ranking e devolve a leaderboard", async () => {
  const { app } = makeApp();
  const fast = await request(app).post("/api/accounts").send({ name: "Rápido", pin: "1111" });
  const slow = await request(app).post("/api/accounts").send({ name: "Lento", pin: "2222" });

  const runSlow = await request(app)
    .post("/api/runs")
    .set("Authorization", `Bearer ${slow.body.token}`)
    .send({ timeMs: 900000, deaths: 12 });
  assert.equal(runSlow.status, 201);

  const runFast = await request(app)
    .post("/api/runs")
    .set("Authorization", `Bearer ${fast.body.token}`)
    .send({ timeMs: 120000, deaths: 1 });
  assert.equal(runFast.status, 201);

  const board = await request(app).get("/api/leaderboard?limit=10");
  assert.equal(board.status, 200);
  assert.equal(board.body.entries.length, 2);
  assert.equal(board.body.entries[0].name, "Rápido");
  assert.equal(board.body.entries[0].rank, 1);
  assert.equal(board.body.entries[0].timeMs, 120000);
  assert.equal(board.body.entries[1].deaths, 12);
});

test("recusa envio de ranking sem sessão", async () => {
  const { app } = makeApp();
  const response = await request(app).post("/api/runs").send({ timeMs: 1000 });
  assert.equal(response.status, 401);
});

test("valida o corpo do save e do run", async () => {
  const { app } = makeApp();
  const created = await request(app).post("/api/accounts").send({ name: "Bia", pin: "1234" });
  const token = created.body.token;

  const badSave = await request(app)
    .put("/api/me/save")
    .set("Authorization", `Bearer ${token}`)
    .send({ save: { currentRoom: 42 } });
  assert.equal(badSave.status, 400);

  const badRun = await request(app)
    .post("/api/runs")
    .set("Authorization", `Bearer ${token}`)
    .send({ timeMs: -5 });
  assert.equal(badRun.status, 400);
});
