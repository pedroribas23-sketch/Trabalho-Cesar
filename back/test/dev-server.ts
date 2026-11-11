import { newDb } from "pg-mem";
import type { Pool } from "pg";
import { createApp } from "../src/app";
import type { AppConfig } from "../src/config";
import { SCHEMA_SQL } from "../src/schema";

const config: AppConfig = {
  port: 3001,
  host: "127.0.0.1",
  databaseUrl: "pg-mem",
  databaseSsl: false,
  corsOrigins: ["*"],
  sessionDays: 30,
  bcryptRounds: 4,
  autoMigrate: false
};

const db = newDb();
db.public.none(SCHEMA_SQL);
const adapter = db.adapters.createPg();
const pool = new adapter.Pool() as unknown as Pool;

const app = createApp({ pool, config });
app.listen(3001, "127.0.0.1", () => {
  console.log("api de teste ouvindo em http://127.0.0.1:3001");
});
