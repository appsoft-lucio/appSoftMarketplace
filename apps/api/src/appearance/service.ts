import type { Appearance } from "@appsoft/domain/appearance";
import { parseAppearance } from "@appsoft/domain/appearance";
import { getPool } from "../database.ts";
import type { Database } from "../stores/repository.ts";
import type { Identity } from "../auth.ts";
import { HttpError } from "../auth.ts";
import { requireAdmin } from "../admin/repository.ts";

export function createAppearanceService(database: () => Database) {
  return {
    async get(): Promise<Appearance> {
      const result = await database().query<Appearance>("SELECT theme FROM marketplace_v2.appearance WHERE id = true");
      return result.rows[0] || { theme: "original" };
    },
    async readAdmin(user: Identity): Promise<Appearance> {
      await requireAdmin(database(), user.id);
      return this.get();
    },
    async save(user: Identity, body: unknown): Promise<Appearance> {
      const db = database();
      const actor = await requireAdmin(db, user.id);
      let input: Appearance;
      try { input = parseAppearance(body); }
      catch (error) { throw new HttpError(400, (error as Error).message); }
      const result = await db.query<Appearance>(
        "UPDATE marketplace_v2.appearance SET theme = $1, updated_at = now(), updated_by = $2 WHERE id = true RETURNING theme",
        [input.theme, actor],
      );
      if (!result.rows[0]) throw new HttpError(503, "A configuração de aparência não está disponível.");
      return result.rows[0];
    },
  };
}
export const appearanceService = createAppearanceService(() => getPool() as unknown as Database);
