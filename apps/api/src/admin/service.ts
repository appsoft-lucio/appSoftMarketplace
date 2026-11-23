import { getPool } from "../database.ts";
import type { Database } from "../stores/repository.ts";
import type { Identity } from "../auth.ts";
import type { AdminStoreQuery, StoreReviewInput } from "@appsoft/domain/admin";
import { listAdminStores, profileRole, requireAdmin, reviewStore, storeHistory } from "./repository.ts";
import { listAdminCustomers } from "./repository.ts";
import type { AdminCustomerQuery } from "@appsoft/domain/admin";
export const adminService = {
  async customers(user: Identity, query: AdminCustomerQuery) {
    const db = getPool() as unknown as Database;
    await requireAdmin(db, user.id);
    return listAdminCustomers(db, query);
  },
  profile: (user: Identity) => profileRole(getPool() as unknown as Database, user.id),
  async list(user: Identity, query: AdminStoreQuery) {
    const db = getPool() as unknown as Database;
    await requireAdmin(db, user.id);
    return listAdminStores(db, query);
  },
  async history(user: Identity, storeId: string) {
    const db = getPool() as unknown as Database;
    await requireAdmin(db, user.id);
    return storeHistory(db, storeId);
  },
  async review(user: Identity, storeId: string, input: StoreReviewInput) {
    const client = await getPool().connect();
    try {
      await client.query("BEGIN");
      const db = client as unknown as Database;
      const actorId = await requireAdmin(db, user.id, true);
      const result = await reviewStore(db, actorId, storeId, input);
      await client.query("COMMIT");
      return result;
    } catch (error) { await client.query("ROLLBACK"); throw error; }
    finally { client.release(); }
  },
};
