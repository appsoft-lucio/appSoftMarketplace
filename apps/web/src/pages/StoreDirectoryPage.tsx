import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import type { StoreDirectory } from "@appsoft/domain/cart";
import { publicApi } from "../cart/service";
import { PublicHeader } from "../components/layout/PublicHeader";
import "./PublicPages.css";

export function StoreDirectoryPage() {
  const [params, setParams] = useSearchParams();
  const search = params.get("q") || "";
  const page = Number(params.get("page") || 1);
  const [text, setText] = useState(search);
  const [data, setData] = useState<StoreDirectory | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => { document.title = "Conheça as lojas · AppSoft"; }, []);
  useEffect(() => { setText(search); }, [search]);
  useEffect(() => {
    const controller = new AbortController(); setLoading(true); setError("");
    void publicApi.stores(search, page, controller.signal).then(result => { if (!controller.signal.aborted) setData(result); }).catch(error => { if (!controller.signal.aborted) setError(error.message); }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [search, page]);
  return <div className="site-shell"><PublicHeader /><main className="page-content"><div className="page-heading"><p className="eyebrow">COMÉRCIO LOCAL</p><h1>Conheça nossas lojas</h1><p>Explore as lojas e seus produtos sem precisar criar uma conta.</p></div><form className="directory-search" onSubmit={event => { event.preventDefault(); setParams(text.trim() ? { q: text.trim() } : {}); }}><label>Buscar loja ou cidade<input type="search" value={text} maxLength={100} onChange={event => setText(event.target.value)} /></label><button className="button primary">Buscar</button></form>{loading ? <p role="status">Carregando lojas…</p> : error ? <p className="notice error" role="alert">{error}</p> : data?.stores.length ? <><div className="directory-grid">{data.stores.map(store => <article className="panel-card" key={store.id}><p className="eyebrow">{store.city} / {store.state}</p><h2><Link to={`/loja/${store.slug}`}>{store.name}</Link></h2><p>{store.description}</p><Link className="button secondary" to={`/loja/${store.slug}`}>Visitar loja</Link></article>)}</div><nav className="pagination" aria-label="Paginação de lojas"><button className="button secondary" disabled={data.page <= 1} onClick={() => setParams({ q: search, page: String(data.page - 1) })}>Anterior</button><span>Página {data.page}</span><button className="button secondary" disabled={data.page * data.pageSize >= data.total} onClick={() => setParams({ q: search, page: String(data.page + 1) })}>Próxima</button></nav></> : <section className="panel-card"><h2>{search ? "Nenhuma loja encontrada" : "As lojas estão chegando"}</h2><p>As lojas disponíveis aparecerão aqui. Enquanto isso, você pode explorar as categorias do catálogo.</p><Link to="/catalogo">Explorar produtos</Link></section>}</main></div>;
}

