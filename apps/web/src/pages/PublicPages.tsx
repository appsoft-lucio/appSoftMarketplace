import { useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import type { CatalogResult } from "@appsoft/domain/catalog";
import type { PublicProduct, PublicStore, StoreDirectory } from "@appsoft/domain/cart";
import { formatMoney } from "@appsoft/domain";
import { publicApi } from "../cart/service";
import { useCart } from "../cart/CartProvider";
import { loadCatalog } from "../catalog/service";
import { PublicHeader } from "../components/PublicHeader";
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

export function PublicProductPage() {
  const { id = "" } = useParams();
  const cart = useCart();
  const [product, setProduct] = useState<PublicProduct | null>(null);
  const [size, setSize] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  useEffect(() => {
    const controller = new AbortController(); setLoading(true); setError(""); setNotice(""); setProduct(null); setSize(""); setQuantity(1);
    void publicApi.product(id, controller.signal).then(result => { if (!controller.signal.aborted) { setProduct(result.product); document.title = `${result.product.name} · AppSoft`; } }).catch(error => { if (!controller.signal.aborted) setError(error.message); }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [id]);
  const stock = product ? product.variants.length ? product.variants.find(variant => variant.size === size)?.stock || 0 : product.stock : 0;
  return <div className="site-shell"><PublicHeader /><main className="page-content"><Link to="/catalogo" className="back-link">Voltar ao catálogo</Link>{loading ? <p role="status">Carregando produto…</p> : !product ? <p className="notice error" role="alert">{error || "Produto indisponível."}</p> : <div className="public-product"><div className="public-product-image">{product.image_url ? <img src={product.image_url} alt={product.name} /> : <span>Imagem indisponível</span>}</div><section><Link to={`/loja/${product.store_slug}`}>{product.store_name}</Link><h1>{product.name}</h1><p className="public-product-price">{formatMoney(product.price_cents)}</p><p className="public-product-description">{product.description}</p><form className="form" onSubmit={event => { event.preventDefault(); setError(""); setNotice(""); try { cart.add(product, product.variants.length ? size || null : null, quantity); setNotice("Produto adicionado ao carrinho."); } catch (error) { setError((error as Error).message); } }}><fieldset>{product.variants.length > 0 && <label>Tamanho<select value={size} required onChange={event => { setSize(event.target.value); setQuantity(1); setNotice(""); }}><option value="">Selecione</option>{product.variants.map(variant => <option key={variant.size} value={variant.size} disabled={variant.stock <= 0}>{variant.size}{variant.stock <= 0 ? " — esgotado" : ""}</option>)}</select></label>}<label>Quantidade<input type="number" min={1} max={Math.max(1, Math.min(stock, 99))} required value={quantity} onChange={event => setQuantity(Number(event.target.value))} /></label>{error && <p className="notice error" role="alert">{error}</p>}{notice && <p className="notice success" role="status">{notice} <Link to="/carrinho">Ver carrinho</Link></p>}<button className="button primary" disabled={!stock}>Adicionar ao carrinho</button><p className="fine-print">Você pode adicionar sem conta. O estoque é confirmado novamente no carrinho; não há reserva nesta etapa.</p></fieldset></form></section></div>}</main></div>;
}