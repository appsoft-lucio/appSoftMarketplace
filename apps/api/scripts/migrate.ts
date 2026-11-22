import { readFile, readdir } from "node:fs/promises";
import { createHash } from "node:crypto";
import { getPool } from "../src/database.ts";

const directory = new URL("../../../database/migrations/", import.meta.url);
const pool = getPool();
const client = await pool.connect();
try {
  await client.query("SELECT pg_advisory_lock(58309214)");
  await client.query("CREATE SCHEMA IF NOT EXISTS appsoft_internal; REVOKE ALL ON SCHEMA appsoft_internal FROM PUBLIC;");
  await client.query("CREATE TABLE IF NOT EXISTS appsoft_internal.migrations (name text PRIMARY KEY, checksum text NOT NULL, applied_at timestamptz NOT NULL DEFAULT now())");
  for (const name of (await readdir(directory)).filter(name => name.endsWith(".sql")).sort()) {
    const sql = (await readFile(new URL(name, directory), "utf8")).replace(/^\uFEFF/, "").replace(/\r\n/g, "\n");
    const checksum = createHash("sha256").update(sql).digest("hex");
    const existing = await client.query("SELECT checksum FROM appsoft_internal.migrations WHERE name = $1", [name]);
    if (existing.rows.length) {
      if (existing.rows[0].checksum !== checksum) throw new Error(`A migração ${name} foi alterada depois de aplicada.`);
      console.log(`Já aplicada: ${name}`); continue;
    }
    await client.query("BEGIN");
    try {
      await client.query(sql.replace(/^\s*BEGIN;/i, "").replace(/COMMIT;\s*$/i, ""));
      await client.query("INSERT INTO appsoft_internal.migrations (name, checksum) VALUES ($1, $2)", [name, checksum]);
      await client.query("COMMIT");
      console.log(`Aplicada: ${name}`);
    } catch (error) { await client.query("ROLLBACK"); throw error; }
  }
} catch {
  console.error("Não foi possível aplicar as migrações. Verifique conexão, certificado e estado do schema. Nenhuma tabela existente será apagada pelo script.");
  process.exitCode = 1;
} finally {
  await client.query("SELECT pg_advisory_unlock(58309214)");
  client.release();
  await pool.end();
}