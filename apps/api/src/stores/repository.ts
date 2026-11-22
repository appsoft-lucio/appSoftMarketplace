import type { Store, StoreInput } from "@appsoft/domain/stores";
import type { Identity } from "../auth.ts";

// Interface pequena para usar as mesmas consultas em PostgreSQL e no banco de testes.
export interface Database {
  query<T>(sql: string, params?: unknown[]): Promise<{ rows: T[] }>;
}
export async function insertStore(db: Database, user: Identity, input: StoreInput): Promise<Store> {
  const owner = await db.query<{ id: string }>(
    `INSERT INTO marketplace_v2.users (auth_subject, name, email)
     VALUES ($1, $2, $3) ON CONFLICT (auth_subject)
     DO UPDATE SET name = EXCLUDED.name, email = EXCLUDED.email RETURNING id`,
    [user.id, user.name, user.email],
  );
  // Status e plano nunca são aceitos do navegador.
  const created = await db.query<Store>(
    `INSERT INTO marketplace_v2.stores (name, slug, description, phone, city, state, status, plan_code)
     VALUES ($1, $2, $3, $4, $5, $6, 'pending', 'basic') RETURNING *`,
    [input.name, input.slug, input.description, input.phone, input.city, input.state],
  );
  await db.query(`INSERT INTO marketplace_v2.store_members (store_id, user_id) VALUES ($1, $2)`, [created.rows[0].id, owner.rows[0].id]);
  return created.rows[0];
}
export async function listStores(db: Database, authSubject: string): Promise<Store[]> {
  const result = await db.query<Store>(
    `SELECT s.* FROM marketplace_v2.stores s
     JOIN marketplace_v2.store_members m ON m.store_id = s.id
     JOIN marketplace_v2.users u ON u.id = m.user_id
     WHERE u.auth_subject = $1 ORDER BY s.created_at DESC, s.id`,
    [authSubject],
  );
  return result.rows;
}