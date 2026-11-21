import { migrate } from "../src/migrate.js";
import { pool } from "../src/database.js";

try {
  await migrate();
  console.log("Tabelas PostgreSQL criadas/verificadas com sucesso.");
} catch (error) {
  console.error("Falha na migracao PostgreSQL:", error.code || "unknown");
  process.exitCode = 1;
} finally {
  await pool.end();
}
