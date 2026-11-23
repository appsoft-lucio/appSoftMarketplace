import { useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import type { CatalogResult } from "@appsoft/domain/catalog";
import type { PublicStore } from "@appsoft/domain/cart";
import { loadCatalog } from "../catalog/service";
import { formatMoney } from "@appsoft/domain";
import { publicApi } from "../cart/service";
import { PublicHeader } from "../components/layout/PublicHeader";
import "./PublicPages.css";

export function PublicStorePage() {
  const { slug = "" } = useParams();
  const [store, setStore] = useState<PublicStore | null>(null);
  const [catalog, setCatalog] = useState<CatalogResult | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [params, setParams] = useSearchParams();
  const page = params.get("page") || "1";
  useEffect(() => {
    const controller = new AbortController(); setLoading(true); setError(""); setStore(null);
    void publicApi.store(slug, controller.signal).then(async result => {
      const products = await loadCatalog(new URLSearchParams({ store: result.store.id, page }), controller.signal);
      if (!controller.signal.aborted) { setStore(result.store); setCatalog(products); document.title = `${result.store.name} · AppSoft`; }
    }).catch(error => { if (!controller.signal.aborted) setError(error.message); }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [slug, page]);
  return <div className="site-shell"><PublicHeader /><main className="page-content"><Link to="/lojas" className="back-link">Todas as lojas</Link>{loading ? <p role="status">Carregando loja…</p> : error ? <p className="notice error" role="alert">{error}</p> : store && <><section className="store-public-heading"><p className="eyebrow">{store.city} / {store.state}</p><h1>{store.name}</h1><p>{store.description}</p></section><h2>Produtos da loja</h2><div className="directory-grid">{catalog?.products.map(product => <article key={product.id} className="panel-card"><p>{product.name}</p><strong>{formatMoney(product.price_cents)}</strong><br /><Link className="button secondary" to={`/produto/${product.id}`}>Ver produto</Link></article>)}</div>{!catalog?.products.length && <p className="notice">Esta loja ainda não tem produtos disponíveis.</p>}{catalog && catalog.total > catalog.pageSize && <nav className="pagination" aria-label="Paginação de produtos da loja"><button className="button secondary" disabled={catalog.page <= 1} onClick={() => setParams({ page: String(catalog.page - 1) })}>Anterior</button><span>Página {catalog.page}</span><button className="button secondary" disabled={catalog.page * catalog.pageSize >= catalog.total} onClick={() => setParams({ page: String(catalog.page + 1) })}>Próxima</button></nav>}</>}</main></div>;
}

