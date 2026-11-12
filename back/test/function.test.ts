import test from "node:test";
import assert from "node:assert/strict";
import { newDb } from "pg-mem";
import type { Pool } from "pg";
import { createHandler } from "../src/function";
import { createCoreContext } from "../src/core";
import type { AppConfig } from "../src/config";
import { SCHEMA_SQL } from "../src/schema";
import { emptySave } from "../src/validation";

/* A Function do Neon usa a Fetch API. Estes testes cobrem o mesmo
   caminho de código do deploy (back/src/function.ts), que é o que
   roda no ar quando a API está hospedada no Neon. */

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

function makeHandler() {
  const db = newDb();
  db.public.none(SCHEMA_SQL);
  const adapter = db.adapters.createPg();
  const pool = new adapter.Pool() as unknown as Pool;
  return createHandler(createCoreContext(pool, config));
}

const ORIGIN = "https://pedroribas23-sketch.github.io";

function call(
  handler: ReturnType<typeof makeHandler>,
  path: string,
  init?: RequestInit
): Promise<Response> {
  return handler.fetch(
    new Request(`https://api.exemplo.test${path}`, {
      ...init,
      headers: { Origin: ORIGIN, ...(init?.headers || {}) }
    })
  );
}

test("function: health responde com o banco disponível", async () => {
  const handler = makeHandler();
  const response = await call(handler, "/api/health");
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.ok, true);
  assert.equal(body.database, "ok");
});

test("function: cria conta e usa o token na sessao", async () => {
  const handler = makeHandler();
  const save = emptySave();
  save.bossesDefeated = ["mestre"];
  save.keys = ["mestre"];

  const created = await call(handler, "/api/accounts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: "Kennedito", pin: "1234", save })
  });
  assert.equal(created.status, 201);
  const createdBody = await created.json();
  assert.equal(createdBody.account.name, "Kennedito");
  assert.ok(createdBody.token);

  // o token precisa funcionar no header Authorization (regressão:
  // antes era repassado o header inteiro e a sessao dava 401)
  const me = await call(handler, "/api/me", {
    headers: { Authorization: `Bearer ${createdBody.token}` }
  });
  assert.equal(me.status, 200);
  const meBody = await me.json();
  assert.deepEqual(meBody.save.bossesDefeated, ["mestre"]);
  assert.deepEqual(meBody.save.keys, ["mestre"]);

  const updated = await call(handler, "/api/me/save", {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${createdBody.token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ save: { ...save, currentRoom: "sala2" } })
  });
  assert.equal(updated.status, 200);

  const logout = await call(handler, "/api/accounts/logout", {
    method: "POST",
    headers: { Authorization: `Bearer ${createdBody.token}` }
  });
  assert.equal(logout.status, 204);

  const afterLogout = await call(handler, "/api/me", {
    headers: { Authorization: `Bearer ${createdBody.token}` }
  });
  assert.equal(afterLogout.status, 401);
});

test("function: recusa sessao ausente e nome duplicado", async () => {
  const handler = makeHandler();
  const semSessao = await call(handler, "/api/me");
  assert.equal(semSessao.status, 401);

  const body = JSON.stringify({ name: "Kennedito", pin: "1234" });
  const primeiro = await call(handler, "/api/accounts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body
  });
  assert.equal(primeiro.status, 201);

  const duplicado = await call(handler, "/api/accounts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body
  });
  assert.equal(duplicado.status, 409);
});

test("function: responde com CORS e trata preflight", async () => {
  const handler = makeHandler();
  const preflight = await call(handler, "/api/accounts", { method: "OPTIONS" });
  assert.equal(preflight.status, 204);
  assert.equal(preflight.headers.get("access-control-allow-origin"), ORIGIN);
  assert.ok(preflight.headers.get("access-control-allow-headers"));
});

test("function: registra corrida no ranking", async () => {
  const handler = makeHandler();
  const created = await call(handler, "/api/accounts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: "Corrida", pin: "1234" })
  });
  const token = (await created.json()).token;

  const run = await call(handler, "/api/runs", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ timeMs: 12345.6, deaths: 1, kills: 4, bosses: 1, lore: 2 })
  });
  assert.equal(run.status, 201);

  const board = await call(handler, "/api/leaderboard?limit=5");
  assert.equal(board.status, 200);
  const body = await board.json();
  assert.equal(body.total, 1);
  assert.equal(body.entries[0].name, "Corrida");
  assert.equal(body.entries[0].timeMs, 12346);
});

test("function: devolve 404 para rota desconhecida", async () => {
  const handler = makeHandler();
  const response = await call(handler, "/api/nao-existe");
  assert.equal(response.status, 404);
});
