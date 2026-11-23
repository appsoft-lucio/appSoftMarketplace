import type { ProductInput, ManagedProduct } from "@appsoft/domain/products";
import type { Database } from "../stores/repository.ts";
import { HttpError } from "../auth.ts";
export async function authorizeStore(db: Database, subject: string, storeId: string) {
  const result = await db.query(`SELECT s.id FROM marketplace_v2.stores s JOIN marketplace_v2.store_members m ON m.store_id=s.id JOIN marketplace_v2.users u ON u.id=m.user_id WHERE s.id=$1 AND u.auth_subject=$2 FOR UPDATE OF s`, [storeId, subject]);
  if (!result.rows.length) throw new HttpError(404, "Loja não encontrada ou sem permissão.");
}
export async function listProducts(db: Database, storeId: string): Promise<ManagedProduct[]> {
  return (await db.query<ManagedProduct>(`SELECT p.*, coalesce((SELECT jsonb_agg(i.url ORDER BY i.position) FROM marketplace_v2.product_images i WHERE i.product_id=p.id),'[]'::jsonb) AS images,
   coalesce((SELECT jsonb_agg(jsonb_build_object('size',v.size,'stock',v.stock) ORDER BY v.size) FROM marketplace_v2.product_variants v WHERE v.product_id=p.id),'[]'::jsonb) AS variants
   FROM marketplace_v2.products p WHERE store_id=$1 ORDER BY p.created_at DESC,p.id`, [storeId])).rows;
}
export async function saveProduct(db: Database, storeId: string, id: string | null, input: ProductInput) {
  const category = await db.query('SELECT id FROM marketplace_v2.categories WHERE id=$1', [input.category_id]);
  if (!category.rows.length) throw new HttpError(400, "Categoria não encontrada.");
  const fields = ['name','description','category_id','price_cents','promotion_price_cents','active','stock','sku','brand','shipping_mode','shipping_price_cents','shipping_notes','delivery_days','weight_grams'] as const;
  const values: unknown[] = fields.map(field => input[field]);
  let productId: string;
  if (id) {
    const reserved=await db.query(`SELECT 1 FROM marketplace_v2.order_items i JOIN marketplace_v2.store_orders o ON o.id=i.order_id JOIN marketplace_v2.checkouts c ON c.id=o.checkout_id
      WHERE i.product_id=$1 AND i.store_id=$2 AND o.status='pending_payment' AND c.expires_at>clock_timestamp() LIMIT 1`,[id,storeId]);
    if (reserved.rows.length) throw new HttpError(409,"Este produto possui estoque reservado. Aguarde o encerramento das reservas para editar.");
    const result = await db.query<{id:string}>(`UPDATE marketplace_v2.products SET ${fields.map((f,i)=>`${f}=$${i+1}`).join(',')} WHERE id=$15 AND store_id=$16 RETURNING id`, [...values,id,storeId]);
    if (!result.rows.length) throw new HttpError(404, "Produto não encontrado nesta loja.");
    productId = id;
  } else {
    const result = await db.query<{id:string}>(`INSERT INTO marketplace_v2.products (${fields.join(',')},store_id) VALUES (${fields.map((_,i)=>`$${i+1}`).join(',')},$15) RETURNING id`, [...values,storeId]);
    productId = result.rows[0].id;
  }
  await db.query('DELETE FROM marketplace_v2.product_images WHERE product_id=$1',[productId]);
  await db.query('DELETE FROM marketplace_v2.product_variants WHERE product_id=$1',[productId]);
  for (const [position,url] of input.images.entries()) await db.query('INSERT INTO marketplace_v2.product_images (product_id,url,position) VALUES ($1,$2,$3)',[productId,url,position]);
  for (const v of input.variants) await db.query('INSERT INTO marketplace_v2.product_variants (product_id,size,stock) VALUES ($1,$2,$3)',[productId,v.size,v.stock]);
  return { ...input, id: productId, store_id: storeId };
}
