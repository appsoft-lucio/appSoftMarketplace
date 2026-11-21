import { readFile } from "node:fs/promises";
import { schema, transaction } from "./database.js";

export async function migrate() {
  const sql = await readFile(
    new URL("../migrations/001_initial.sql", import.meta.url),
    "utf8",
  );
  await transaction(async (client) => {
    await client.query(`CREATE SCHEMA IF NOT EXISTS "${schema}"`);
    await client.query(`SET LOCAL search_path TO "${schema}"`);
    await client.query(sql);
  });
}
