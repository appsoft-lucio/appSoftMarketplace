import type { CatalogQuery } from "@appsoft/domain/catalog";
import { getPool } from "../database.ts";
import type { Database } from "../stores/repository.ts";
import { catalog } from "./repository.ts";
import { releaseExpired } from "../checkout/repository.ts";
export const catalogService = { async list(query: CatalogQuery) { const db=getPool() as unknown as Database; await releaseExpired(db); return catalog(db,query); } };
