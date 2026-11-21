import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";

test("modelo SQL: plano, limite de produtos, visibilidade e isolamento por loja", async (t) => {
  const db = new PGlite();
  t.after(() => db.close());
  const sql = await readFile(new URL("../migrations/001_initial.sql", import.meta.url), "utf8");
  await db.exec(sql.replace(/^\uFEFF/, ""));
  const plans = await db.query<{ monthly_price_cents: number; active_product_limit: number }>("SELECT * FROM marketplace_v2.plans WHERE code = 'basic'");
  assert.equal(plans.rows[0].monthly_price_cents, 20000);
  assert.equal(plans.rows[0].active_product_limit, 50);
  const stores = await db.query<{ id: string }>("INSERT INTO marketplace_v2.stores (name, slug, status) VALUES ('Loja A', 'loja-a', 'approved'), ('Loja B', 'loja-b', 'approved') RETURNING id");
  const [a, b] = stores.rows.map(row => row.id);
  await db.query("INSERT INTO marketplace_v2.products (store_id, name, price_cents, active) SELECT $1, 'Produto ' || n, 1000, true FROM generate_series(1, 50) n", [a]);
  await assert.rejects(db.query("INSERT INTO marketplace_v2.products (store_id, name, price_cents, active) VALUES ($1, 'Produto 51', 1000, true)", [a]), /Limite de produtos/);
  const draft = await db.query<{ id: string }>("INSERT INTO marketplace_v2.products (store_id, name, price_cents) VALUES ($1, 'Rascunho', 1000) RETURNING id", [a]);
  await assert.rejects(db.query("UPDATE marketplace_v2.products SET active = true WHERE id = $1", [draft.rows[0].id]), /Limite de produtos/);
  await assert.rejects(db.query("UPDATE marketplace_v2.products SET store_id = $1 WHERE id = $2", [b, draft.rows[0].id]), /transferir produtos/);
  const productB = await db.query<{ id: string }>("INSERT INTO marketplace_v2.products (store_id, name, price_cents, active) VALUES ($1, 'Produto B', 2000, true) RETURNING id", [b]);
  await db.query("INSERT INTO marketplace_v2.subscriptions (store_id, billing_months, status, starts_at, ends_at) VALUES ($1, 1, 'active', now() - interval '1 day', now() + interval '1 day'), ($2, 1, 'active', now() - interval '2 months', now() - interval '1 month')", [a, b]);
  const visible = await db.query<{ id: string }>("SELECT id FROM marketplace_v2.visible_stores");
  assert.deepEqual(visible.rows.map(row => row.id), [a]);
  await db.query("UPDATE marketplace_v2.stores SET status = 'suspended' WHERE id = $1", [a]);
  assert.equal((await db.query("SELECT * FROM marketplace_v2.visible_stores")).rows.length, 0);
  const users = await db.query<{ id: string }>("INSERT INTO marketplace_v2.users (auth_subject, name, email) VALUES ('test-user', 'Cliente', 'cliente@example.test') RETURNING id");
  const checkout = await db.query<{ id: string }>("INSERT INTO marketplace_v2.checkouts (customer_id, idempotency_key) VALUES ($1, 'checkout-test') RETURNING id", [users.rows[0].id]);
  const order = await db.query<{ id: string }>("INSERT INTO marketplace_v2.store_orders (checkout_id, store_id, subtotal_cents, shipping_cents, delivery_address, shipping_name, estimated_days) VALUES ($1, $2, 1000, 500, '{}', 'Entrega local', 2) RETURNING id", [checkout.rows[0].id, a]);
  await assert.rejects(db.query("INSERT INTO marketplace_v2.order_items (order_id, store_id, product_id, product_name, unit_price_cents, quantity) VALUES ($1, $2, $3, 'Outro lojista', 2000, 1)", [order.rows[0].id, a, productB.rows[0].id]), /foreign key/i);
  // Mesmo com SELECT concedido, um papel sem política não acessa clientes via RLS.
  await db.exec("CREATE ROLE public_test; GRANT USAGE ON SCHEMA marketplace_v2 TO public_test; GRANT SELECT ON marketplace_v2.users TO public_test; SET ROLE public_test;");
  assert.equal((await db.query("SELECT * FROM marketplace_v2.users")).rows.length, 0);
  await db.exec("RESET ROLE;");
});
