import { FilterPanel } from "../catalog/components/FilterPanel";
import type { UpdateFilter } from "../catalog/components/FilterPanel";
import { ProductDetails } from "../catalog/components/ProductDetails";
import { SiteFooter } from "../components/layout/SiteFooter";
import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import type { CatalogProduct, CatalogResult } from "@appsoft/domain/catalog";
import { formatMoney } from "@appsoft/domain";
import { loadCatalog } from "../catalog/service";
import { PublicHeader } from "../components/layout/PublicHeader";
import { InstallPrompt } from "../components/pwa/InstallPrompt";
import "./CatalogPage.css";

export default function CatalogPage({ home = false }: { home?: boolean }) {
  const [params, setParams] = useSearchParams();
  const [data, setData] = useState<CatalogResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState(params.get("q") || "");
  const [refresh, setRefresh] = useState(0);
  const [selected, setSelected] = useState<CatalogProduct | null>(null);
  const mobile = useRef<HTMLDialogElement>(null);
  const query = params.toString();
  const currentSearch = params.get("q") || "";
  useEffect(() => { document.title = home ? "AppSoft Marketplace" : "Catálogo · AppSoft Marketplace"; }, [home]);
  useEffect(() => { setSearch(currentSearch); }, [currentSearch]);
  useEffect(() => {
    const controller = new AbortController(); setLoading(true); setError("");
    void loadCatalog(new URLSearchParams(query), controller.signal).then(result => { if (!controller.signal.aborted) setData(result); }).catch(error => { if (!controller.signal.aborted) setError(error.message); }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [query, refresh]);
  const update: UpdateFilter = (key, value, multiple = false) => {
    setParams(previous => {
      const next = new URLSearchParams(previous); next.delete("page");
      if (key === "price") {
        const price = JSON.parse(value) as { min: string; max: string };
        for (const field of ["min", "max"] as const) { next.delete(field); if (price[field].trim()) next.set(field, price[field].trim()); }
      } else if (multiple) {
        const values = next.getAll(key); next.delete(key);
        for (const item of values.includes(value) ? values.filter(item => item !== value) : [...values, value]) next.append(key, item);
      } else { next.delete(key); if (value) next.set(key, value); }
      return next;
    });
  };
  const clear = () => setParams(previous => { const next = new URLSearchParams(); if (["recent", "price_asc", "price_desc"].includes(previous.get("sort") || "")) next.set("sort", previous.get("sort")!); return next; });
  const chips: Array<{ key: string; value: string; label: string; multiple?: boolean }> = [];
  if (params.get("category")) chips.push({ key: "category", value: params.get("category")!, label: data?.categories.find(category => category.id === params.get("category"))?.name || "Categoria" });
  if (params.get("q")) chips.push({ key: "q", value: params.get("q")!, label: `Busca: ${params.get("q")}` });
  for (const key of ["min", "max"]) if (params.get(key)) chips.push({ key, value: params.get(key)!, label: `${key === "min" ? "A partir de" : "Até"} R$ ${params.get(key)}` });
  for (const value of params.getAll("size")) chips.push({ key: "size", value, label: `Tamanho ${value}`, multiple: true });
  for (const value of params.getAll("store")) chips.push({ key: "store", value, label: data?.stores.find(store => store.id === value)?.name || "Loja", multiple: true });
  return <div className="catalog-shell"><PublicHeader />
    <main>{home && <InstallPrompt />}<div className="catalog-intro"><p className="eyebrow">EXPLORE O COMÉRCIO LOCAL</p><h1>Encontre o que combina com você.</h1><p>Escolha a categoria e refine a busca do seu jeito.</p></div><form className="catalog-search" onSubmit={event => { event.preventDefault(); update("q", search.trim()); }}><label>Buscar produtos<input type="search" value={search} maxLength={100} onChange={event => setSearch(event.target.value)} placeholder="O que você está procurando?" /></label><button className="button primary" type="submit">Buscar</button></form>
    <div className="catalog-layout"><aside className="filters-desktop"><FilterPanel data={data} params={params} update={update} clear={clear} /></aside><section className="catalog-results" aria-label="Produtos" aria-busy={loading}><div className="catalog-toolbar"><button className="button secondary mobile-filter-button" onClick={() => mobile.current?.showModal()}>Categorias e filtros{chips.length ? ` (${chips.length})` : ""}</button><p role="status">{loading ? "Buscando produtos…" : error ? "Não foi possível carregar" : `${data?.total || 0} produto(s) encontrado(s)`}</p><label>Ordenar por<select value={params.get("sort") || "recent"} onChange={event => update("sort", event.target.value)}><option value="recent">Mais recentes</option><option value="price_asc">Menor preço</option><option value="price_desc">Maior preço</option></select></label></div>
    {chips.length > 0 && <div className="filter-chips" aria-label="Filtros aplicados">{chips.map(chip => <button key={`${chip.key}-${chip.value}`} onClick={() => update(chip.key, chip.multiple ? chip.value : "", chip.multiple)} aria-label={`Remover ${chip.label}`}>{chip.label}<span aria-hidden="true">×</span></button>)}<button className="clear-chips" onClick={clear}>Limpar filtros</button></div>}
    {error ? <div className="catalog-empty"><h2>Não conseguimos carregar o catálogo</h2><p role="alert">{error}</p><button className="button secondary" onClick={() => setRefresh(value => value + 1)}>Tentar novamente</button></div> : loading ? <div className="catalog-skeleton" aria-hidden="true">{[1, 2, 3, 4, 5, 6].map(item => <div key={item} />)}</div> : data?.products.length ? <><div className="catalog-product-grid">{data.products.map(product => <article className="catalog-product" key={product.id}><button className="catalog-product-image" onClick={() => setSelected(product)} aria-label={`Ver detalhes de ${product.name}`}>{product.image_url ? <img decoding="async" src={product.image_url} alt={product.name} loading="lazy" onError={event => { event.currentTarget.style.visibility = "hidden"; }} /> : <span>Imagem indisponível</span>}</button><div className="catalog-product-copy"><p><Link to={product.store_slug ? `/loja/${product.store_slug}` : "/lojas"}>{product.store_name}</Link></p><h2><button onClick={() => setSelected(product)}>{product.name}</button></h2><strong>{product.original_price_cents && product.original_price_cents > product.price_cents ? <><del>{formatMoney(product.original_price_cents)}</del>{" "}</> : null}{formatMoney(product.price_cents)}</strong>{product.sizes.length > 0 && <small>Tamanhos: {product.sizes.join(" · ")}</small>}<button className="button secondary" onClick={() => setSelected(product)}>Ver detalhes</button></div></article>)}</div><nav className="pagination" aria-label="Paginação de produtos"><button className="button secondary" disabled={data.page <= 1} onClick={() => setParams(previous => { const next = new URLSearchParams(previous); next.set("page", String(data.page - 1)); return next; })}>Anterior</button><span>Página {data.page} de {Math.max(1, Math.ceil(data.total / data.pageSize))}</span><button className="button secondary" disabled={data.page * data.pageSize >= data.total} onClick={() => setParams(previous => { const next = new URLSearchParams(previous); next.set("page", String(data.page + 1)); return next; })}>Próxima</button></nav></> : <div className="catalog-empty"><span className="catalog-empty-icon" aria-hidden="true">⌕</span><h2>{chips.length ? "Nenhum produto com esses filtros" : "As novidades estão chegando"}</h2><p>{chips.length ? "Experimente outra categoria, faixa de preço ou loja." : "Os produtos aparecerão aqui quando as lojas estiverem disponíveis."}</p>{chips.length > 0 && <button className="button secondary" onClick={clear}>Limpar filtros</button>}</div>}
    </section></div></main><SiteFooter />
    <dialog className="mobile-filters-dialog" ref={mobile} aria-labelledby="mobile-filter-title"><header><h2 id="mobile-filter-title">Refine sua busca</h2><button className="button secondary" onClick={() => mobile.current?.close()}>Fechar</button></header><FilterPanel data={data} params={params} update={update} clear={clear} /><div className="mobile-filter-footer"><button className="button primary full" onClick={() => mobile.current?.close()}>Ver resultados</button></div></dialog>
    {selected && <ProductDetails product={selected} onClose={() => setSelected(null)} />}
  </div>;
}
