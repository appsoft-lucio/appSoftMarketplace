export interface Category { id: string; name: string; slug: string; parent_id: string | null }
export interface CatalogStore { id: string; name: string; slug: string }
export interface CatalogProduct {
  id: string; name: string; description: string; price_cents: number;
  store_id: string; store_name: string; image_url: string | null; sizes: string[];
}
export interface CatalogResult {
  categories: Category[]; stores: CatalogStore[]; sizes: string[];
  products: CatalogProduct[]; total: number; page: number; pageSize: number;
}
export type CatalogSort = "recent" | "price_asc" | "price_desc";
export interface CatalogQuery {
  category: string | null; min: number | null; max: number | null;
  stores: string[]; sizes: string[]; search: string; sort: CatalogSort; page: number;
}
export function priceToCents(value: string | null): number | null {
  if (!value?.trim()) return null;
  const text = value.trim();
  if (!/^\d{1,7}([.,]\d{1,2})?$/.test(text)) throw new Error("Informe um preço válido, como 99,90, sem separador de milhar.");
  const [units, decimals = ""] = text.replace(",", ".").split(".");
  return Number(units) * 100 + Number(decimals.padEnd(2, "0"));
}
export function parseCatalogQuery(params: URLSearchParams): CatalogQuery {
  const category = params.get("category") || null;
  const stores = [...new Set(params.getAll("store"))];
  const sizes = [...new Set(params.getAll("size"))];
  const uuid = /^[a-f0-9]{8}(-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i;
  if ((category && !uuid.test(category)) || stores.some(id => !uuid.test(id)) || stores.length > 100 || sizes.length > 30 || sizes.some(size => !size.trim() || size.length > 20)) throw new Error("Os filtros selecionados são inválidos.");
  const min = priceToCents(params.get("min"));
  const max = priceToCents(params.get("max"));
  if (min !== null && max !== null && min > max) throw new Error("O preço mínimo não pode ser maior que o máximo.");
  const search = (params.get("q") || "").trim();
  const sort = params.get("sort") || "recent";
  const page = Number(params.get("page") || 1);
  if (search.length > 100 || !["recent", "price_asc", "price_desc"].includes(sort) || !Number.isInteger(page) || page < 1 || page > 100000) throw new Error("A busca ou ordenação é inválida.");
  return { category, stores, sizes, min, max, search, sort: sort as CatalogSort, page };
}