import { test } from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { app } from "../src/app.ts";
import type { AddressInfo } from "node:net";

test("API informa seu estado e não simula endpoints ainda não implementados", async (t) => {
  const server = createServer(app);
  await new Promise<void>(resolve => server.listen(0, "127.0.0.1", resolve));
  t.after(() => new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve())));
  const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  const health = await fetch(`${base}/api/health`);
  assert.equal(health.status, 200);
  assert.equal((await health.json()).database, "not-configured");
  const products = await fetch(`${base}/api/products`);
  assert.equal(products.status, 404);
});
