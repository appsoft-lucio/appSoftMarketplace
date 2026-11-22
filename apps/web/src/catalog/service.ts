import type { CatalogResult } from "@appsoft/domain/catalog";
export async function loadCatalog(params: URLSearchParams, signal?: AbortSignal): Promise<CatalogResult> {
  let response: Response;
  try { response = await fetch(`/api/catalog?${params}`, { signal }); }
  catch (error) {
    if (error instanceof Error && error.name === "AbortError") throw error;
    throw new Error("Não foi possível carregar o catálogo. Verifique sua conexão e tente novamente.");
  }
  const body = await response.json().catch(() => null);
  if (!response.ok || !body) throw new Error(body?.message || "O catálogo está temporariamente indisponível.");
  return body as CatalogResult;
}