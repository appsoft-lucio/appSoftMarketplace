import type { AdminStore, AdminStoreList, AdminStoreQuery, StoreReview, StoreReviewInput } from "@appsoft/domain/admin";
import type { Database } from "../stores/repository.ts";
import { HttpError } from "../auth.ts";

export async function profileRole(db: Database, subject: string): Promise<"admin" | "customer"> {
  const result = await db.query<{ role: string }>("SELECT role FROM marketplace_v2.users WHERE auth_subject = $1", [subject]);
  return result.rows[0]?.role === "admin" ? "admin" : "customer";
}
export async function requireAdmin(db: Database, subject: string, lock = false): Promise<string> {
  const result = await db.query<{ id: string }>(`SELECT id FROM marketplace_v2.users WHERE auth_subject = $1 AND role = 'admin'${lock ? " FOR SHARE" : ""}`, [subject]);
  if (!result.rows[0]) throw new HttpError(403, "Esta área é exclusiva da administração.");
  return result.rows[0].id;
}
export async function listAdminStores(db: Database, query: AdminStoreQuery): Promise<AdminStoreList> {
  const pageSize = 20;
  // Busca literal, sem tratar % ou _ digitados como curingas.
  const filter = `($1 = 'all' OR s.status = $1) AND ($2 = '' OR strpos(lower(s.name), lower($2)) > 0 OR strpos(lower(s.slug), lower($2)) > 0)`;
  const params = [query.status, query.search];
  const stores = await db.query<AdminStore>(
    `SELECT s.*, coalesce((SELECT jsonb_agg(jsonb_build_object('name', u.name, 'email', u.email) ORDER BY u.name)
     FROM marketplace_v2.store_members m JOIN marketplace_v2.users u ON u.id = m.user_id WHERE m.store_id = s.id), '[]'::jsonb) AS owners
     FROM marketplace_v2.stores s WHERE ${filter} ORDER BY s.created_at DESC, s.id LIMIT $3 OFFSET $4`,
    [...params, pageSize, (query.page - 1) * pageSize],
  );
  const total = await db.query<{ total: number }>(`SELECT count(*)::int AS total FROM marketplace_v2.stores s WHERE ${filter}`, params);
  const counts = await db.query<{ pending: number; approved: number; suspended: number }>(`SELECT count(*) FILTER (WHERE status = 'pending')::int AS pending, count(*) FILTER (WHERE status = 'approved')::int AS approved, count(*) FILTER (WHERE status = 'suspended')::int AS suspended FROM marketplace_v2.stores`);
  return { stores: stores.rows, page: query.page, pageSize, total: total.rows[0].total, counts: counts.rows[0] };
}
export async function storeHistory(db: Database, storeId: string): Promise<StoreReview[]> {
  const exists = await db.query("SELECT id FROM marketplace_v2.stores WHERE id = $1", [storeId]);
  if (!exists.rows.length) throw new HttpError(404, "Loja não encontrada.");
  const result = await db.query<StoreReview>(`SELECT r.id, r.previous_status, r.new_status, r.reason, r.created_at, u.name AS actor_name
    FROM marketplace_v2.store_reviews r JOIN marketplace_v2.users u ON u.id = r.actor_id
    WHERE r.store_id = $1 ORDER BY r.created_at DESC, r.id DESC LIMIT 50`, [storeId]);
  return result.rows;
}
// Deve ser executado na mesma transação de requireAdmin(..., true).
export async function reviewStore(db: Database, actorId: string, storeId: string, input: StoreReviewInput) {
  const result = await db.query<{ status: string }>("SELECT status FROM marketplace_v2.stores WHERE id = $1 FOR UPDATE", [storeId]);
  if (!result.rows[0]) throw new HttpError(404, "Loja não encontrada.");
  const current = result.rows[0].status;
  if (current !== input.expectedStatus || current === input.status) throw new HttpError(409, "O status desta loja mudou. Atualize a lista antes de continuar.");
  const updated = await db.query("UPDATE marketplace_v2.stores SET status = $1 WHERE id = $2 RETURNING id, status", [input.status, storeId]);
  await db.query("INSERT INTO marketplace_v2.store_reviews (store_id, actor_id, previous_status, new_status, reason) VALUES ($1, $2, $3, $4, $5)", [storeId, actorId, current, input.status, input.reason]);
  return updated.rows[0];
}