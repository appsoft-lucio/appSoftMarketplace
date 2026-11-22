import { getPool } from "../database.ts";
import type { Database } from "../stores/repository.ts";
import type { CartItem } from "@appsoft/domain/cart";
import { cartQuote, publicProducts, publicStore, storeDirectory } from "./repository.ts";
const db = () => getPool() as unknown as Database;
export const publicService = {
  stores: (search: string, page: number) => storeDirectory(db(), search, page),
  store: (slug: string) => publicStore(db(), slug),
  async product(id: string) { return (await publicProducts(db(), [id]))[0] || null; },
  quote: (items: CartItem[]) => cartQuote(db(), items),
};