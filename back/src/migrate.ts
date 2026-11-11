import { closePool, ensureSchema } from "./db";

async function main(): Promise<void> {
  await ensureSchema();
  console.log("[api] schema aplicado com sucesso.");
}

main()
  .catch((error) => {
    console.error("[api] falha ao aplicar o schema:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await closePool();
  });
