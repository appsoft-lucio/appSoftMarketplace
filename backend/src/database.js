import "dotenv/config";
import pg from "pg";
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const connectionString = process.env.DATABASE_URL;
if (
  !connectionString ||
  connectionString.includes("[YOUR-DATABASE-PASSWORD]")
) {
  throw new Error(
    "Configure DATABASE_URL no backend/.env com a conexao PostgreSQL.",
  );
}

export const schema = process.env.DATABASE_SCHEMA || "appsoft";
if (!/^[a-z][a-z0-9_]{0,62}$/.test(schema)) {
  throw new Error(
    "DATABASE_SCHEMA deve ser um identificador PostgreSQL valido.",
  );
}
let url;
try {
  url = new URL(connectionString);
  if (!["postgres:", "postgresql:"].includes(url.protocol)) throw new Error();
} catch {
  throw new Error("DATABASE_URL deve ser uma conexao PostgreSQL valida.");
}
const local = ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
// Configure TLS here so URL options cannot silently disable verification.
for (const key of ["sslmode", "sslcert", "sslkey", "sslrootcert"])
  url.searchParams.delete(key);
const bundledCA = fileURLToPath(
  new URL("../certs/supabase-ca.crt", import.meta.url),
);
const caFile =
  process.env.DATABASE_CA_FILE || (existsSync(bundledCA) ? bundledCA : null);
const ssl = local
  ? false
  : {
      rejectUnauthorized: true,
      ...(caFile ? { ca: readFileSync(caFile, "utf8") } : {}),
    };
export const pool = new pg.Pool({
  connectionString: url.toString(),
  ssl,
  max: 5,
  connectionTimeoutMillis: 10000,
  idleTimeoutMillis: 30000,
  types: {
    getTypeParser(oid, format) {
      return oid === 1700 ? Number : pg.types.getTypeParser(oid, format);
    },
  },
});
pool.on("error", (error) =>
  console.error("PostgreSQL connection error:", error.code || "unknown"),
);

export const tables = Object.fromEntries(
  ["users", "products", "cart_items", "orders", "order_items"].map((name) => [
    name,
    `"${schema}"."${name}"`,
  ]),
);

export async function transaction(work) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await work(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export default pool;
