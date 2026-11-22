import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { runInNewContext } from "node:vm";
import { expect, it, vi } from "vitest";
it("retira o worker antigo, limpa apenas seu cache e preserva páginas de autenticação", async () => {
  const listeners: Record<string, (event: { waitUntil: (promise: Promise<unknown>) => void }) => void> = {};
  const navigate = vi.fn().mockResolvedValue(undefined);
  const resetNavigate = vi.fn();
  const deleted = vi.fn().mockResolvedValue(true);
  const unregister = vi.fn().mockResolvedValue(true);
  const skipWaiting = vi.fn().mockResolvedValue(undefined);
  const claim = vi.fn().mockResolvedValue(undefined);
  runInNewContext(readFileSync(resolve(process.cwd(), "public/sw.js"), "utf8"), {
    URL,
    self: {
      addEventListener: (name: string, listener: typeof listeners[string]) => { listeners[name] = listener; },
      skipWaiting, registration: { scope: "https://example.test/", unregister },
      location: { origin: "https://example.test" },
      clients: { claim, matchAll: async () => [{ url: "https://example.test/", navigate }, { url: "https://example.test/redefinir-senha?code=test", navigate: resetNavigate }] },
    },
    caches: { keys: async () => ["workbox-precache-v2-https://example.test/", "other-cache", "workbox-precache-v2-https://other.test/"], delete: deleted },
  });
  let task: Promise<unknown> = Promise.resolve();
  const event = { waitUntil: (promise: Promise<unknown>) => { task = promise; } };
  listeners.install(event); await task;
  listeners.activate(event); await task;
  expect(skipWaiting).toHaveBeenCalledOnce();
  expect(deleted).toHaveBeenCalledExactlyOnceWith("workbox-precache-v2-https://example.test/");
  expect(unregister).toHaveBeenCalledOnce();
  expect(navigate).toHaveBeenCalledExactlyOnceWith("https://example.test/");
  expect(resetNavigate).not.toHaveBeenCalled();
});
