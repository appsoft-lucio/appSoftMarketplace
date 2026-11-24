import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import { PGlite } from "@electric-sql/pglite";
import { createApp } from "../src/app.ts";
import { createAppearanceService } from "../src/appearance/service.ts";
import type { Database } from "../src/stores/repository.ts";

test("aparência: leitura pública, persistência global e alteração exclusiva de admin", async t => {
  const db = new PGlite();
  t.after(() => db.close());
  for (const file of ["001_initial.sql", "002_store_registration.sql", "007_appearance.sql"]) {
    await db.exec((await readFile(new URL(`../../../database/migrations/${file}`, import.meta.url), "utf8")).replace(/^\uFEFF/, ""));
  }
  await db.query("INSERT INTO marketplace_v2.users (auth_subject,name,email,role) VALUES ('admin','Admin','admin@example.test','admin'),('buyer','Buyer','buyer@example.test','customer')");
  const service = createAppearanceService(() => db as unknown as Database);
  const server = createServer(createApp({
    appearance: service,
    verifyUser: async token => ({ id: token, email: "test@example.test", name: "Test" }),
    stores: { list: async () => [], create: async () => { throw new Error("unused"); } },
  }));
  await new Promise<void>(resolve => server.listen(0, "127.0.0.1", resolve));
  t.after(() => new Promise<void>(resolve => server.close(() => resolve())));
  const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  const call = (path: string, method = "GET", token?: string, theme?: unknown) => fetch(base + path, {
    method, headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    ...(theme !== undefined ? { body: JSON.stringify({ theme }) } : {}),
  });
  assert.deepEqual(await (await call("/api/appearance")).json(), { theme: "original" });
  assert.equal((await call("/api/admin/appearance")).status, 401);
  assert.equal((await call("/api/admin/appearance", "GET", "buyer")).status, 403);
  assert.equal((await call("/api/admin/appearance", "PUT", "buyer", "christmas")).status, 403);
  assert.equal((await call("/api/appearance", "PUT", "admin", "christmas")).status, 405);
  assert.equal((await call("/api/admin/appearance", "PUT", "admin", "invalid")).status, 400);
  for (const theme of ["christmas", "new-year", "original"]) {
    const response = await call("/api/admin/appearance", "PUT", "admin", theme);
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { theme });
    assert.deepEqual(await (await call("/api/appearance")).json(), { theme });
    const manifestResponse = await call("/api/appearance/manifest");
    assert.match(manifestResponse.headers.get("content-type")!, /application\/manifest\+json/);
    const manifest = await manifestResponse.json();
    assert.equal(manifest.id, "/");
    assert.equal(manifest.icons[0].src, `/icons/${theme}/icon-192.png`);
  }
  const result = await db.query<{ role: string; theme: string }>("SELECT a.theme,u.role FROM marketplace_v2.appearance a JOIN marketplace_v2.users u ON u.id=a.updated_by");
  assert.equal(result.rows[0].role, "admin");
  assert.equal(result.rows[0].theme, "original");
  await assert.rejects(db.query("UPDATE marketplace_v2.appearance SET theme='invalid'"));
});
