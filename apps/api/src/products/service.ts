import { getPool } from "../database.ts";
import type { Database } from "../stores/repository.ts";
import type { Identity } from "../auth.ts";
import { HttpError } from "../auth.ts";
import type { ProductInput } from "@appsoft/domain/products";
import type { Category } from "@appsoft/domain/catalog";
import { authorizeStore, listProducts, saveProduct } from "./repository.ts";
import { releaseExpired } from "../checkout/repository.ts";
export const productService = {
  async execute(user: Identity, storeId: string, input?: ProductInput, id: string | null = null) {
    const client = await getPool().connect();
    try {
      await client.query('BEGIN');
      const db = client as unknown as Database;
      await releaseExpired(db);
      await authorizeStore(db,user.id,storeId);
      const result = input ? { product: await saveProduct(db,storeId,id,input) } : {
        products: await listProducts(db,storeId),
        categories: (await db.query<Category>('SELECT id,name,slug,parent_id FROM marketplace_v2.categories ORDER BY name')).rows
      };
      await client.query('COMMIT'); return result;
    } catch (error) {
      await client.query('ROLLBACK');
      if (error instanceof Error && error.message.includes('Limite de produtos ativos')) throw new HttpError(409,'Limite de 50 produtos ativos atingido. Desative outro produto para continuar.');
      throw error;
    } finally { client.release(); }
  }
};
