import type { CatalogProduct } from "./catalog.js";
export interface CartItem { productId: string; size: string | null; quantity: number }
export interface PublicProduct extends CatalogProduct { stock: number; images?: string[]; brand?: string; shipping_mode?: string; shipping_price_cents?: number | null; shipping_notes?: string; delivery_days?: number | null; variants: Array<{ size: string; stock: number }> }
export interface PublicStore { id: string; name: string; slug: string; description: string; logo_url: string | null; city: string; state: string }
export interface StoreDirectory { stores: PublicStore[]; total: number; page: number; pageSize: number }
export interface CartLine extends CartItem { product: PublicProduct | null; error: string | null; maxQuantity: number; lineTotalCents: number | null }
export interface CartQuote { items: CartLine[]; subtotalCents: number; hasIssues: boolean }
export const CART_LIMIT = 50;
export function cartKey(item: Pick<CartItem, "productId" | "size">) { return `${item.productId}:${item.size || ""}`; }
export function parseCart(value: unknown): CartItem[] {
  if (!Array.isArray(value) || value.length > CART_LIMIT) throw new Error("O carrinho permite até 50 itens diferentes.");
  const keys = new Set<string>();
  return value.map(raw => {
    if (!raw || typeof raw !== "object") throw new Error("Item de carrinho inválido.");
    const item = raw as Record<string, unknown>;
    if (typeof item.productId !== "string" || !/^[a-f0-9]{8}(-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(item.productId)) throw new Error("Produto inválido no carrinho.");
    if (item.size !== null && (typeof item.size !== "string" || !item.size.trim() || item.size.length > 20)) throw new Error("Tamanho inválido.");
    if (!Number.isInteger(item.quantity) || Number(item.quantity) < 1 || Number(item.quantity) > 99) throw new Error("A quantidade deve estar entre 1 e 99.");
    const result = { productId: item.productId, size: item.size as string | null, quantity: Number(item.quantity) };
    if (keys.has(cartKey(result))) throw new Error("Item duplicado no carrinho.");
    keys.add(cartKey(result)); return result;
  });
}
export function readSavedCart(value: string | null): CartItem[] {
  if (!value) return [];
  try { const parsed = JSON.parse(value); return parsed.version === 1 ? parseCart(parsed.items) : []; }
  catch { return []; }
}
export function afterAuthPath(next: string | null, hasCart: boolean): string {
  return next === "/finalizar-compra" ? next : hasCart ? "/carrinho" : "/minha-conta";
}