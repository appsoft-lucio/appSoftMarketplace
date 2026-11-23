import type { CartItem, CartQuote, PublicProduct, PublicStore, StoreDirectory } from "@appsoft/domain/cart";
import type { Database } from "../stores/repository.ts";
import { availableProductsSql } from "../catalog/repository.ts";

const publicStoreFields = "id, name, slug, description, logo_url, city, state";
const publicStoresSql = "SELECT s.* FROM marketplace_v2.stores s JOIN marketplace_v2.visible_stores v ON v.id = s.id";
export async function storeDirectory(db: Database, search: string, page: number): Promise<StoreDirectory> {
  const filter = "($1 = '' OR strpos(lower(name), lower($1)) > 0 OR strpos(lower(city), lower($1)) > 0)";
  const [stores, count] = await Promise.all([
    db.query<PublicStore>(`WITH visible AS (${publicStoresSql}) SELECT ${publicStoreFields} FROM visible WHERE ${filter} ORDER BY name, id LIMIT 24 OFFSET $2`, [search, (page - 1) * 24]),
    db.query<{ total: number }>(`WITH visible AS (${publicStoresSql}) SELECT count(*)::int AS total FROM visible WHERE ${filter}`, [search]),
  ]);
  return { stores: stores.rows, total: count.rows[0].total, page, pageSize: 24 };
}
export async function publicStore(db: Database, slug: string): Promise<PublicStore | null> {
  return (await db.query<PublicStore>(`WITH visible AS (${publicStoresSql}) SELECT ${publicStoreFields} FROM visible WHERE slug = $1`, [slug])).rows[0] || null;
}
export async function publicProducts(db: Database, ids: string[]): Promise<PublicProduct[]> {
  if (!ids.length) return [];
  const result = await db.query<PublicProduct>(`WITH available AS (${availableProductsSql})
    SELECT p.id, p.name, p.description, p.price_cents, p.original_price_cents, p.shipping_mode,p.shipping_price_cents,p.shipping_notes,p.delivery_days,p.brand, p.store_id, p.store_name, p.store_slug, p.stock,
    coalesce((SELECT jsonb_agg(url ORDER BY position) FROM marketplace_v2.product_images WHERE product_id=p.id),'[]'::jsonb) AS images,
    (SELECT url FROM marketplace_v2.product_images WHERE product_id = p.id ORDER BY position LIMIT 1) AS image_url,
    coalesce((SELECT jsonb_agg(v.size ORDER BY v.size) FROM marketplace_v2.product_variants v WHERE v.product_id = p.id AND v.stock > 0), '[]'::jsonb) AS sizes,
    coalesce((SELECT jsonb_agg(jsonb_build_object('size', v.size, 'stock', v.stock) ORDER BY v.size) FROM marketplace_v2.product_variants v WHERE v.product_id = p.id), '[]'::jsonb) AS variants
    FROM available p WHERE p.id = ANY($1::uuid[])`, [ids]);
  return result.rows;
}
export async function cartQuote(db: Database, items: CartItem[]): Promise<CartQuote> {
  const products = await publicProducts(db, [...new Set(items.map(item => item.productId))]);
  const byId = new Map(products.map(product => [product.id, product]));
  const lines = items.map(item => {
    const product = byId.get(item.productId) || null;
    let error: string | null = null;
    let stock = 0;
    if (!product) error = "Este produto ou loja não está disponível. Remova o item para continuar.";
    else if (product.variants.length) {
      const variant = product.variants.find(variant => variant.size === item.size);
      stock = variant?.stock || 0;
      if (!item.size) error = "Selecione o tamanho na página do produto e adicione-o novamente.";
      else if (!stock) error = "Este tamanho está esgotado ou não está mais disponível.";
    } else if (item.size) error = "Este produto não possui mais o tamanho selecionado. Adicione-o novamente.";
    else stock = product.stock;
    if (!error && item.quantity > stock) error = `Quantidade indisponível. Restam ${stock} unidade(s).`;
    return { ...item, product, error, maxQuantity: Math.min(stock, 99), lineTotalCents: product && !error ? product.price_cents * item.quantity : null };
  });
  return { items: lines, subtotalCents: lines.reduce((sum, line) => sum + (line.lineTotalCents || 0), 0), hasIssues: lines.some(line => Boolean(line.error)) };
}
