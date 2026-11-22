import pg from "pg";
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { attachDatabasePool } from "@vercel/functions";

let pool: pg.Pool | null = null;
export function getPool(): pg.Pool {
  if (pool) return pool;
  const value = process.env.DATABASE_URL;
  if (!value) throw new Error("DATABASE_NOT_CONFIGURED");
  const url = new URL(value);
  if (!["postgres:", "postgresql:"].includes(url.protocol)) throw new Error("INVALID_DATABASE_URL");
  const local = ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
  for (const key of ["sslmode", "sslcert", "sslkey", "sslrootcert"]) url.searchParams.delete(key);
  const bundledCA = fileURLToPath(new URL("../certs/supabase-ca.crt", import.meta.url));
  const ca = process.env.DATABASE_CA_FILE || (existsSync(bundledCA) ? bundledCA : undefined);
  pool = new pg.Pool({
    connectionString: url.toString(),
    ssl: local ? false : { rejectUnauthorized: true, ...(ca ? { ca: readFileSync(ca, "utf8") } : {}) },
    max: 5, connectionTimeoutMillis: 10000, idleTimeoutMillis: 5000,
  });
  pool.on("error", () => console.error("Conexão PostgreSQL indisponível."));
  if (process.env.VERCEL) attachDatabasePool(pool);
  return pool;
}