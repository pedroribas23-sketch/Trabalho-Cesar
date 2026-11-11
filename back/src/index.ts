import { createApp } from "./app";
import { getConfig } from "./config";
import { closePool, ensureSchema, getPool } from "./db";

async function main(): Promise<void> {
  const config = getConfig();
  if (config.autoMigrate) {
    await ensureSchema();
    console.log("[api] schema verificado no Postgres.");
  }

  const app = createApp({ pool: getPool(), config });
  const server = app.listen(config.port, config.host, () => {
    console.log(`[api] Kennedito API ouvindo em http://${config.host}:${config.port}`);
  });

  let shuttingDown = false;
  const shutdown = (signal: string) => {
    if (shuttingDown) return;
    shuttingDown = true;
    console.log(`[api] ${signal} recebido; encerrando.`);
    const force = setTimeout(() => process.exit(1), 10_000);
    force.unref();
    server.close(async () => {
      try {
        await closePool();
      } finally {
        clearTimeout(force);
        process.exit(0);
      }
    });
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}

main().catch((error) => {
  console.error("[api] falha ao iniciar:", error);
  process.exit(1);
});
