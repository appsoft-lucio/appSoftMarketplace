import type { CatalogQuery } from "@appsoft/domain/catalog";
import { getPool } from "../database.ts";
import type { Database } from "../stores/repository.ts";
import { catalog } from "./repository.ts";
export const catalogService = { list: (query: CatalogQuery) => catalog(getPool() as unknown as Database, query) };