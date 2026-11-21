import assert from "node:assert/strict";
import { test } from "node:test";
import { subscriptionPriceCents, isStoreVisible, canManageStore, canActivateProduct } from "../src/index.ts";

test("assinaturas Básico custam R$ 200 por mês, sem descontos", () => {
  assert.deepEqual([1, 3, 6, 12].map(subscriptionPriceCents), [20000, 60000, 120000, 240000]);
  assert.throws(() => subscriptionPriceCents(2), RangeError);
});

test("assinatura vencida oculta a loja no instante do vencimento", () => {
  const store = { id: "store-1", status: "approved" };
  const subscription = { storeId: store.id, status: "active", startsAt: "2026-01-01T00:00:00Z", endsAt: "2026-02-01T00:00:00Z" };
  assert.equal(isStoreVisible(store, subscription, subscription.startsAt), true);
  assert.equal(isStoreVisible(store, subscription, "2026-01-31T23:59:59Z"), true);
  assert.equal(isStoreVisible(store, subscription, subscription.endsAt), false);
  assert.equal(isStoreVisible(store, subscription, "2025-12-31T23:59:59Z"), false);
  assert.equal(isStoreVisible({ ...store, status: "suspended" }, subscription, subscription.startsAt), false);
  assert.equal(isStoreVisible(store, { ...subscription, storeId: "another" }, subscription.startsAt), false);
  assert.equal(isStoreVisible(store, { ...subscription, status: "pending" }, subscription.startsAt), false);
  assert.equal(isStoreVisible(store, null), false);
});

test("a 50ª ativação é permitida; a 51ª é bloqueada", () => {
  assert.equal(canActivateProduct(49), true);
  assert.equal(canActivateProduct(50), false);
  assert.equal(canActivateProduct(-1), false);
});

test("vencimento não elimina a permissão de administrar a própria loja", () => {
  const owner = { id: "user-1", role: "customer", memberships: [{ storeId: "store-1", role: "owner" }] };
  assert.equal(canManageStore(owner, "store-1"), true);
  assert.equal(canManageStore(owner, "store-2"), false);
  assert.equal(canManageStore({ id: "admin-1", role: "admin" }, "store-2"), true);
  assert.equal(canManageStore(null, "store-1"), false);
});
