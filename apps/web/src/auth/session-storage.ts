// Keep login in this browsing session. PKCE verifiers must also work when an
// email confirmation opens in a different tab of the same browser.
const memory = new Map<string, string>();
function store(key: string) {
  return key.endsWith("-code-verifier") ? localStorage : sessionStorage;
}
export const authSessionStorage = {
  getItem(key: string): string | null {
    try { return store(key).getItem(key); } catch { return memory.get(key) ?? null; }
  },
  setItem(key: string, value: string) {
    try { store(key).setItem(key, value); } catch { memory.set(key, value); }
  },
  removeItem(key: string) {
    memory.delete(key);
    try { store(key).removeItem(key); } catch { /* Storage may be disabled. */ }
  },
};
