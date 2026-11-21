import app from "./app.js";
import { pool, tables } from "./database.js";

const port = Number(process.env.PORT || 4000);
try {
  await pool.query(`SELECT id FROM ${tables.users} LIMIT 0`);
  const server = app.listen(port, () => {
    console.log(
      `AppSoft API rodando em http://localhost:${server.address().port}`,
    );
  });
  for (const signal of ["SIGINT", "SIGTERM"]) {
    process.once(signal, () =>
      server.close(async () => {
        await pool.end();
        process.exit(0);
      }),
    );
  }
} catch (error) {
  console.error(
    "Falha ao iniciar API. Confira DATABASE_URL e execute npm run db:migrate. Codigo:",
    error.code || "unknown",
  );
  await pool.end();
  process.exitCode = 1;
}
