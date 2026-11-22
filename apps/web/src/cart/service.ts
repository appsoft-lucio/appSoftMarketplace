import type { CartItem, CartQuote, PublicProduct, PublicStore, StoreDirectory } from "@appsoft/domain/cart";
export class PublicApiError extends Error { constructor(public status: number, message: string) { super(message); } }
async function request<T>(path: string, signal?: AbortSignal, body?: unknown): Promise<T> {
  let response: Response;
  try { response = await fetch(path, { signal, ...(body !== undefined ? { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) } : {}) }); }
  catch (error) { if (error instanceof Error && error.name === "AbortError") throw error; throw new Error("Não foi possível conectar. Verifique sua conexão e tente novamente."); }
  const data = await response.json().catch(() => null);
  if (!response.ok || !data) throw new PublicApiError(response.status, data?.message || "O serviço está temporariamente indisponível.");
  return data as T;
}
export const publicApi = {
  stores: (search: string, page: number, signal?: AbortSignal) => request<StoreDirectory>(`/api/public/stores?${new URLSearchParams({ q: search, page: String(page) })}`, signal),
  store: (slug: string, signal?: AbortSignal) => request<{ store: PublicStore }>(`/api/public/stores/${encodeURIComponent(slug)}`, signal),
  product: (id: string, signal?: AbortSignal) => request<{ product: PublicProduct }>(`/api/public/products/${encodeURIComponent(id)}`, signal),
  quote: (items: CartItem[], signal?: AbortSignal) => request<CartQuote>("/api/public/cart/quote", signal, items),
};