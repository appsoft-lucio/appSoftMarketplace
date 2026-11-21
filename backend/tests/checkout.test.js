import test from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdtemp, mkdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { createServer } from "node:net";

test("purchase flow persists orders, reduces stock and enforces access", async () => {
  const directory = await mkdtemp(join(tmpdir(), "appsoft-checkout-"));
  await mkdir(join(directory, "data"));
  const reservation = createServer();
  await new Promise((resolve) => reservation.listen(0, "127.0.0.1", resolve));
  const port = reservation.address().port;
  await new Promise((resolve) => reservation.close(resolve));
  const server = spawn(process.execPath, [fileURLToPath(new URL("../src/server.js", import.meta.url))], {
    cwd: directory,
    env: { ...process.env, PORT: String(port), JWT_SECRET: "isolated-test-secret" },
    stdio: ["ignore", "pipe", "pipe"],
  });
  let output = "";
  server.stdout.on("data", (chunk) => { output += chunk; });
  server.stderr.on("data", (chunk) => { output += chunk; });
  const request = async (path, { token, body, method = "GET", status = 200 } = {}) => {
    const response = await fetch(`http://127.0.0.1:${port}/api${path}`, {
      method,
      headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    const data = await response.json();
    assert.equal(response.status, status, JSON.stringify(data));
    return data;
  };
  try {
    let ready = false;
    for (let attempt = 0; attempt < 100; attempt++) {
      if (server.exitCode !== null) throw new Error(output);
      try {
        await request("/health");
        ready = true;
        break;
      } catch {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }
    assert.ok(ready, `API failed to start: ${output}`);
    const login = (email) => request("/auth/login", { method: "POST", body: { email, password: "123456" } });
    const vendor = await login("vendedor@appsoft.com");
    const customer = await login("cliente@appsoft.com");
    const productBody = { name: "Integration product", description: "Test", category: "Software", price: 50, stock: 5 };
    await request("/products", { method: "POST", token: customer.token, body: productBody, status: 403 });
    const { product } = await request("/products", { method: "POST", token: vendor.token, body: productBody, status: 201 });
    await request("/cart", { status: 401 });
    await request("/cart/items", { method: "POST", token: customer.token, body: { productId: product.id, quantity: 1 }, status: 201 });
    const cart = await request(`/cart/items/${product.id}`, { method: "PUT", token: customer.token, body: { quantity: 2 } });
    assert.equal(cart.total, 125);
    await request(`/cart/items/${product.id}`, { method: "PUT", token: customer.token, body: { quantity: 6 }, status: 400 });
    const { order } = await request("/orders/checkout", { method: "POST", token: customer.token, status: 201 });
    assert.equal(order.total, 125);
    assert.equal(order.items[0].quantity, 2);
    assert.equal((await request(`/products/${product.id}`)).product.stock, 3);
    assert.equal((await request("/cart", { token: customer.token })).items.length, 0);
    assert.equal((await request("/orders/mine", { token: customer.token })).orders[0].id, order.id);
    assert.equal((await request("/orders/vendor/mine", { token: vendor.token })).orders[0].id, order.id);
    await request("/orders/checkout", { method: "POST", token: customer.token, status: 400 });
    assert.equal((await request(`/products/${product.id}`)).product.stock, 3);
  } finally {
    const stopped = new Promise((resolve) => server.once("close", resolve));
    if (server.exitCode === null) server.kill();
    await stopped;
    await rm(directory, { recursive: true, force: true });
  }
});
