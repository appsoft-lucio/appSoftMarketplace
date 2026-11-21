import { fileURLToPath } from "node:url";
import { importSqlite } from "../src/importSqlite.js";
import { pool } from "../src/database.js";

try {
  const source =
    process.argv[2] ||
    fileURLToPath(new URL("../data/appsoft.db", import.meta.url));
  const counts = await importSqlite(source);
  console.log("Importacao concluida. Registros por tabela:", counts);
} catch (error) {
  console.error(
    "Importacao nao concluida:",
    error.code || "confira se o destino esta vazio e o SQLite existe",
  );
  process.exitCode = 1;
} finally {
  await pool.end();
}
