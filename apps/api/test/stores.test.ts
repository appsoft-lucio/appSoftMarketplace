import { test } from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import { createApp } from "../src/app.ts";
import { HttpError } from "../src/auth.ts";
import { insertStore, listStores } from "../src/stores/repository.ts";
import { validateStore } from "@appsoft/domain/stores";
import type { Database } from "../src/stores/repository.ts";

const input = { name: "Loja Teste", slug: "loja-teste", description: "Uma loja de produtos locais para testar.", phone: "(11) 99999-1234", city: "São Paulo", state: "SP" };
const owner = { id: "auth-owner", name: "Ana", email: "ana@example.test" };
const other = { id: "auth-other", name: "Bia", email: "bia@example.test" };

test("cadastro HTTP grava dono e status no servidor; isola lojas e desfaz duplicação", async t => {
  const db = new PGlite();
  t.after(() => db.close());
  for (const file of ["001_initial.sql", "002_store_registration.sql"]) {
    const sql = await readFile(new URL(`../../../database/migrations/${file}`, import.meta.url), "utf8");
    await db.exec(sql.replace(/^\uFEFF/, ""));
  }
  const handler = createApp({
    verifyUser: async token => {
      if (token === "owner") return owner;
      if (token === "other") return other;
      throw new HttpError(401, "Sessão inválida.");
    },
    stores: {
      list: user => listStores(db as unknown as Database, user.id),
      create: (user, payload) => db.transaction(tx => insertStore(tx as unknown as Database, user, payload)),
    },
  });
  const server = createServer(handler);
  await new Promise<void>(resolve => server.listen(0, "127.0.0.1", resolve));
  t.after(() => new Promise<void>(resolve => server.close(() => resolve())));
  const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  const post = (token: string, body: unknown) => fetch(`${base}/api/stores`, { method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify(body) });
  assert.equal((await fetch(`${base}/api/stores/mine`)).status, 401);
  assert.equal((await post("forged", input)).status, 401);
  assert.equal((await post("owner", { ...input, state: "XX" })).status, 400);
  const created = await post("owner", { ...input, status: "approved", plan_code: "pro", ownerId: "auth-other" });
  assert.equal(created.status, 201);
  const { store } = await created.json();
  assert.equal(store.status, "pending"); assert.equal(store.plan_code, "basic");
  assert.equal(store.phone, "11999991234");
  const mine = await fetch(`${base}/api/stores/mine`, { headers: { Authorization: "Bearer owner" } });
  assert.equal((await mine.json()).stores.length, 1);
  const theirs = await fetch(`${base}/api/stores/mine`, { headers: { Authorization: "Bearer other" } });
  assert.deepEqual((await theirs.json()).stores, []);
  assert.equal((await post("other", input)).status, 409);
  assert.equal((await db.query("SELECT * FROM marketplace_v2.users WHERE auth_subject = 'auth-other'")).rows.length, 0);
  assert.equal((await db.query("SELECT * FROM marketplace_v2.visible_stores")).rows.length, 0);
  assert.equal((await db.query("SELECT * FROM marketplace_v2.subscriptions")).rows.length, 0);
});

test("validação não aceita dados incompletos ou slug inválido", () => {
  assert.throws(() => validateStore({ ...input, slug: "loja/../admin" }));
  assert.throws(() => validateStore({ ...input, description: "Curta" }));
  assert.throws(() => validateStore({ ...input, phone: "123" }));
});