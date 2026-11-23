import type { CatalogProduct, CatalogQuery, CatalogResult, CatalogStore, Category } from "@appsoft/domain/catalog";
import type { Database } from "../stores/repository.ts";

export const availableProductsSql = `SELECT p.id,p.store_id,p.category_id,p.name,p.description,p.stock,p.active,p.created_at,p.price_cents AS original_price_cents,coalesce(p.promotion_price_cents,p.price_cents) AS price_cents,p.shipping_mode,p.shipping_price_cents,p.shipping_notes,p.delivery_days,p.brand, s.name AS store_name, s.slug AS store_slug FROM marketplace_v2.products p
 JOIN marketplace_v2.visible_stores s ON s.id = p.store_id
 WHERE p.active AND (EXISTS (SELECT 1 FROM marketplace_v2.product_variants v WHERE v.product_id = p.id AND v.stock > 0)
 OR (p.stock > 0 AND NOT EXISTS (SELECT 1 FROM marketplace_v2.product_variants v WHERE v.product_id = p.id)))`;
export async function catalog(db: Database, query: CatalogQuery): Promise<CatalogResult> {
  const pageSize = 24;
  const cte = `WITH RECURSIVE subtree AS (
    SELECT id FROM marketplace_v2.categories WHERE id = $1::uuid
    UNION SELECT c.id FROM marketplace_v2.categories c JOIN subtree t ON c.parent_id = t.id
  ), available AS (${availableProductsSql})`;
  const where = `($1::uuid IS NULL OR p.category_id IN (SELECT id FROM subtree))
    AND ($2::int IS NULL OR p.price_cents >= $2) AND ($3::int IS NULL OR p.price_cents <= $3)
    AND (cardinality($4::uuid[]) = 0 OR p.store_id = ANY($4::uuid[]))
    AND (cardinality($5::text[]) = 0 OR EXISTS (SELECT 1 FROM marketplace_v2.product_variants v WHERE v.product_id = p.id AND v.stock > 0 AND v.size = ANY($5::text[])))
    AND ($6 = '' OR strpos(lower(p.name), lower($6)) > 0 OR strpos(lower(p.description), lower($6)) > 0)`;
  const params = [query.category, query.min, query.max, query.stores, query.sizes, query.search];
  const order = { recent: "p.created_at DESC, p.id", price_asc: "p.price_cents ASC, p.id", price_desc: "p.price_cents DESC, p.id" }[query.sort];
  const [products, total, categories, stores, sizes] = await Promise.all([
    db.query<CatalogProduct>(`${cte} SELECT p.id, p.name, p.description, p.price_cents, p.original_price_cents, p.store_id, p.store_name, p.store_slug,
      (SELECT i.url FROM marketplace_v2.product_images i WHERE i.product_id = p.id ORDER BY i.position LIMIT 1) AS image_url,
      coalesce((SELECT jsonb_agg(v.size ORDER BY v.size) FROM marketplace_v2.product_variants v WHERE v.product_id = p.id AND v.stock > 0), '[]'::jsonb) AS sizes
      FROM available p WHERE ${where} ORDER BY ${order} LIMIT $7 OFFSET $8`, [...params, pageSize, (query.page - 1) * pageSize]),
    db.query<{ total: number }>(`${cte} SELECT count(*)::int AS total FROM available p WHERE ${where}`, params),
    db.query<Category>("SELECT id, name, slug, parent_id FROM marketplace_v2.categories ORDER BY name, id"),
    db.query<CatalogStore>("SELECT id, name, slug FROM marketplace_v2.visible_stores ORDER BY name, id"),
    db.query<{ size: string }>(`WITH available AS (${availableProductsSql}) SELECT DISTINCT v.size FROM marketplace_v2.product_variants v JOIN available p ON p.id = v.product_id WHERE v.stock > 0 ORDER BY v.size`),
  ]);
  return { products: products.rows, total: total.rows[0].total, categories: categories.rows, stores: stores.rows, sizes: sizes.rows.map(row => row.size), page: query.page, pageSize };
}