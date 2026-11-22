import { getPool } from "../database.ts";
import { insertStore, listStores } from "./repository.ts";
import type { Database } from "./repository.ts";
import type { Identity } from "../auth.ts";
import type { StoreInput } from "@appsoft/domain/stores";

export const storeService = {
  async list(user: Identity) { return listStores(getPool() as unknown as Database, user.id); },
  async create(user: Identity, input: StoreInput) {
    const client = await getPool().connect();
    try {
      await client.query("BEGIN");
      const store = await insertStore(client as unknown as Database, user, input);
      await client.query("COMMIT");
      return store;
    } catch (error) { await client.query("ROLLBACK"); throw error; }
    finally { client.release(); }
  },
};