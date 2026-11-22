import assert from "node:assert/strict";
import { test } from "node:test";
import { afterAuthPath, parseCart, readSavedCart } from "../src/cart.ts";
const item = { productId: "00000000-0000-4000-8000-000000000001", size: "P", quantity: 2 };
test("carrinho persistido recupera apenas referências e quantidades", () => {
  assert.deepEqual(readSavedCart(JSON.stringify({ version: 1, items: [{ ...item, price_cents: 1, access_token: "discard" }] })), [item]);
  assert.deepEqual(readSavedCart("invalid json"), []);
  assert.deepEqual(readSavedCart(JSON.stringify({ version: 2, items: [item] })), []);
});
test("carrinho rejeita duplicações, quantidades inválidas e excesso de itens", () => {
  assert.throws(() => parseCart([item, item]));
  assert.throws(() => parseCart([{ ...item, quantity: 0 }]));
  assert.throws(() => parseCart([{ ...item, quantity: 100 }]));
  assert.throws(() => parseCart([{ ...item, size: "" }]));
  assert.throws(() => parseCart(Array(51).fill(item)));
});
test("retorno pós-login permite somente destinos internos previstos", () => {
  assert.equal(afterAuthPath("https://evil.test", false), "/minha-conta");
  assert.equal(afterAuthPath("//evil.test", true), "/carrinho");
  assert.equal(afterAuthPath("/finalizar-compra", true), "/finalizar-compra");
});
