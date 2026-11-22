import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import { PGlite } from "@electric-sql/pglite";
import { createApp } from "../src/app.ts";
import { HttpError } from "../src/auth.ts";
import { insertStore } from "../src/stores/repository.ts";
import type { Database } from "../src/stores/repository.ts";
import { listAdminStores, profileRole, requireAdmin, reviewStore, storeHistory } from "../src/admin/repository.ts";

const owner = { id: "owner-auth", email: "owner@example.test", name: "Lojista" };
const admin = { id: "admin-auth", email: "admin@example.test", name: "Admin" };
const input = { name: "Loja Admin", slug: "loja-admin", description: "Uma loja para testar a administração.", city: "São Paulo", state: "SP", phone: "11999999999" };

test("admin: autorização, análise, concorrência de status e auditoria transacional", async t => {
  const db = new PGlite();
  t.after(() => db.close());
  for (const name of ["001_initial.sql", "002_store_registration.sql", "003_store_admin.sql"]) {
    await db.exec((await readFile(new URL(`../../../database/migrations/${name}`, import.meta.url), "utf8")).replace(/^\uFEFF/, ""));
  }
  const database = db as unknown as Database;
  const store = await db.transaction(tx => insertStore(tx as unknown as Database, owner, input));
  await db.query("INSERT INTO marketplace_v2.users (auth_subject, name, email, role) VALUES ($1, $2, $3, 'admin')", [admin.id, admin.name, admin.email]);
  const adminMethods = {
    profile: (user: typeof owner) => profileRole(database, user.id),
    async list(user: typeof owner, query: Parameters<typeof listAdminStores>[1]) { await requireAdmin(database, user.id); return listAdminStores(database, query); },
    async history(user: typeof owner, id: string) { await requireAdmin(database, user.id); return storeHistory(database, id); },
    review: (user: typeof owner, id: string, payload: Parameters<typeof reviewStore>[3]) => db.transaction(async tx => {
      const adapter = tx as unknown as Database;
      const actor = await requireAdmin(adapter, user.id, true);
      return reviewStore(adapter, actor, id, payload);
    }),
  };
  const server = createServer(createApp({
    verifyUser: async token => {
      if (token === "admin") return admin;
      // Uma role enviada por metadados/token de teste nunca concede administração.
      if (token === "owner") return { ...owner, role: "admin" };
      throw new HttpError(401, "Sessão inválida.");
    },
    stores: { list: async () => [], create: async () => store },
    admin: adminMethods,
  }));
  await new Promise<void>(resolve => server.listen(0, "127.0.0.1", resolve));
  t.after(() => new Promise<void>(resolve => server.close(() => resolve())));
  const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  const call = (path: string, token?: string, body?: unknown) => fetch(base + path, {
    method: body ? "PATCH" : "GET",
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}), "Content-Type": "application/json" },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const statusPath = `/api/admin/stores/${store.id}/status`;
  const historyPath = `/api/admin/stores/${store.id}/history`;
  assert.equal((await call("/api/admin/stores")).status, 401);
  assert.equal((await call("/api/admin/stores", "owner")).status, 403);
  assert.equal((await call(historyPath, "owner")).status, 403);
  assert.equal((await call(statusPath, "owner", { status: "approved", expectedStatus: "pending" })).status, 403);
  assert.equal((await (await call("/api/me", "owner")).json()).role, "customer");
  assert.equal((await (await call("/api/me", "admin")).json()).role, "admin");
  const pending = await (await call("/api/admin/stores?status=pending", "admin")).json();
  assert.equal(pending.total, 1);
  assert.equal(pending.stores[0].owners[0].email, owner.email);
  assert.equal((await call("/api/admin/stores?page=-1", "admin")).status, 400);
  assert.equal((await call(statusPath, "admin", { status: "suspended", expectedStatus: "pending", reason: "Curto" })).status, 400);
  assert.equal((await call(statusPath, "admin", { status: "approved", expectedStatus: "pending", reason: "Cadastro conferido" })).status, 200);
  assert.equal((await call(statusPath, "admin", { status: "suspended", expectedStatus: "pending", reason: "Uma decisão com status antigo" })).status, 409);
  assert.equal((await (await call(historyPath, "admin")).json()).reviews.length, 1);
  // Uma falha na auditoria precisa desfazer também a alteração do status.
  await db.exec("ALTER TABLE marketplace_v2.store_reviews ADD CONSTRAINT reject_test_review CHECK (reason <> 'reject audit')");
  assert.equal((await call(statusPath, "admin", { status: "suspended", expectedStatus: "approved", reason: "reject audit" })).status, 503);
  assert.equal((await db.query<{ status: string }>("SELECT status FROM marketplace_v2.stores WHERE id = $1", [store.id])).rows[0].status, "approved");
  await db.exec("ALTER TABLE marketplace_v2.store_reviews DROP CONSTRAINT reject_test_review");
  await db.query("INSERT INTO marketplace_v2.subscriptions (store_id, billing_months, status, starts_at, ends_at) VALUES ($1, 1, 'active', now() - interval '1 day', now() + interval '1 day')", [store.id]);
  assert.equal((await db.query("SELECT * FROM marketplace_v2.visible_stores")).rows.length, 1);
  assert.equal((await call(statusPath, "admin", { status: "suspended", expectedStatus: "approved", reason: "Cadastro suspenso para revisão" })).status, 200);
  assert.equal((await db.query("SELECT * FROM marketplace_v2.visible_stores")).rows.length, 0);
  const history = await (await call(historyPath, "admin")).json();
  assert.equal(history.reviews.length, 2);
  assert.equal(history.reviews[0].actor_name, "Admin");
  assert.equal(history.reviews[0].new_status, "suspended");
  assert.equal((await call(statusPath, "admin", { status: "approved", expectedStatus: "suspended" })).status, 200);
  // Revogação no banco vale imediatamente, sem confiar em cache do navegador.
  await db.exec("UPDATE marketplace_v2.users SET role = 'customer' WHERE auth_subject = 'admin-auth'");
  assert.equal((await call("/api/admin/stores", "admin")).status, 403);
});