import { getPool } from "../database.ts";
import type { Database } from "../stores/repository.ts";
import type { CartItem } from "@appsoft/domain/cart";
import { cartQuote, publicProducts, publicStore, storeDirectory } from "./repository.ts";
import { releaseExpired } from "../checkout/repository.ts";
const db = () => getPool() as unknown as Database;
async function currentDb() { const connection=db(); await releaseExpired(connection); return connection; }
export const publicService = {
  stores: (search: string, page: number) => storeDirectory(db(), search, page),
  store: (slug: string) => publicStore(db(), slug),
  async product(id: string) { return (await publicProducts(await currentDb(), [id]))[0] || null; },
  quote: async (items: CartItem[]) => cartQuote(await currentDb(), items),
};
