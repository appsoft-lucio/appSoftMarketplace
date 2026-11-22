import { useEffect, useId, useRef, useState } from "react";
import type { FormEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import type { CatalogProduct, CatalogResult, Category } from "@appsoft/domain/catalog";
import { priceToCents } from "@appsoft/domain/catalog";
import { formatMoney } from "@appsoft/domain";
import { loadCatalog } from "../catalog/service";
import { useAuth } from "../auth/AuthProvider";
import logo from "../../../../imagens/logo-appsoft-orange-semFundo.png";
import "./CatalogPage.css";

type UpdateFilter = (key: string, value: string, multiple?: boolean) => void;
function hasSelectedChild(category: Category, selected: string, categories: Category[]): boolean {
  return category.id === selected || categories.some(child => child.parent_id === category.id && hasSelectedChild(child, selected, categories));
}
function CategoryBranch({ category, categories, selected, onSelect }: { category: Category; categories: Category[]; selected: string; onSelect: (id: string) => void }) {
  const children = categories.filter(item => item.parent_id === category.id);
  const active = hasSelectedChild(category, selected, categories);
  const [expanded, setExpanded] = useState(active);
  useEffect(() => { if (active) setExpanded(true); }, [active]);
  return <li><div className="category-row"><button className={category.id === selected ? "category-name selected" : "category-name"} aria-current={category.id === selected ? "true" : undefined} onClick={() => { onSelect(category.id); setExpanded(true); }}>{category.name}</button>{children.length > 0 && <button className="category-toggle" aria-label={`${expanded ? "Recolher" : "Expandir"} ${category.name}`} aria-expanded={expanded} onClick={() => setExpanded(!expanded)}>{expanded ? "−" : "+"}</button>}</div>{children.length > 0 && expanded && <ul>{children.map(child => <CategoryBranch key={child.id} category={child} categories={categories} selected={selected} onSelect={onSelect} />)}</ul>}</li>;
}
function FilterPanel({ data, params, update, clear }: { data: CatalogResult | null; params: URLSearchParams; update: UpdateFilter; clear: () => void }) {
  const [min, setMin] = useState(params.get("min") || "");
  const [max, setMax] = useState(params.get("max") || "");
  const [error, setError] = useState("");
  const [storeSearch, setStoreSearch] = useState("");
  const errorId = useId();
  const priceMin = params.get("min") || "";
  const priceMax = params.get("max") || "";
  useEffect(() => { setMin(priceMin); setMax(priceMax); setError(""); }, [priceMin, priceMax]);
  const applyPrice = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      const low = priceToCents(min); const high = priceToCents(max);
      if (low !== null && high !== null && low > high) throw new Error("O mínimo não pode ser maior que o máximo.");
      setError("");
      // Uma única alteração de URL para os dois limites.
      const value = JSON.stringify({ min, max }); update("price", value);
    } catch (error) { setError((error as Error).message); }
  };
  const shops = (data?.stores || []).filter(store => store.name.toLocaleLowerCase("pt-BR").includes(storeSearch.toLocaleLowerCase("pt-BR")));
  return <div className="catalog-filters"><div className="filter-heading"><h2>Categorias e filtros</h2><button className="text-button" onClick={clear}>Limpar</button></div>
    <nav className="category-nav" aria-label="Categorias"><button className={!params.get("category") ? "category-name selected" : "category-name"} onClick={() => update("category", "")}>Todos os produtos</button><ul>{(data?.categories || []).filter(item => !item.parent_id).map(category => <CategoryBranch key={category.id} category={category} categories={data?.categories || []} selected={params.get("category") || ""} onSelect={id => update("category", id)} />)}</ul></nav>
    <section className="filter-group"><h3>Preço</h3><form onSubmit={applyPrice}><div className="price-fields"><label>Mínimo (R$)<input inputMode="decimal" placeholder="0,00" value={min} maxLength={10} onChange={event => setMin(event.target.value)} aria-describedby={error ? errorId : undefined} /></label><label>Máximo (R$)<input inputMode="decimal" placeholder="Sem limite" value={max} maxLength={10} onChange={event => setMax(event.target.value)} aria-describedby={error ? errorId : undefined} /></label></div>{error && <p className="filter-error" id={errorId} role="alert">{error}</p>}<button className="button secondary filter-apply" type="submit">Aplicar preço</button></form></section>
    <fieldset className="filter-group"><legend>Tamanho</legend>{data?.sizes.length ? <div className="size-options">{data.sizes.map(size => <label key={size} className={params.getAll("size").includes(size) ? "size-option checked" : "size-option"}><input type="checkbox" checked={params.getAll("size").includes(size)} onChange={() => update("size", size, true)} /><span>{size}</span></label>)}</div> : <p className="filter-hint">Os tamanhos aparecerão conforme os produtos disponíveis.</p>}</fieldset>
    <fieldset className="filter-group"><legend>Lojas</legend><label className="store-search">Buscar loja<input type="search" placeholder="Nome da loja" value={storeSearch} onChange={event => setStoreSearch(event.target.value)} /></label><div className="shop-options">{shops.map(store => <label key={store.id}><input type="checkbox" checked={params.getAll("store").includes(store.id)} onChange={() => update("store", store.id, true)} /><span>{store.name}</span></label>)}{!shops.length && <p className="filter-hint">{storeSearch ? "Nenhuma loja encontrada." : "As lojas disponíveis aparecerão aqui."}</p>}</div></fieldset>
  </div>;
}
function ProductDetails({ product, onClose }: { product: CatalogProduct; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => { ref.current?.showModal(); }, []);
  return <dialog className="catalog-product-dialog" ref={ref} aria-labelledby="product-title" onCancel={event => { event.preventDefault(); onClose(); }}><button className="button secondary" onClick={onClose}>Fechar</button><p className="eyebrow">{product.store_name}</p><h2 id="product-title">{product.name}</h2><p className="product-detail-price">{formatMoney(product.price_cents)}</p><p className="product-description">{product.description}</p>{product.sizes.length > 0 && <p>Tamanhos disponíveis: {product.sizes.join(", ")}</p>}<p className="filter-hint">Carrinho e pagamento serão disponibilizados em uma próxima etapa.</p></dialog>;
}
export default function CatalogPage() {
  const { session } = useAuth();
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
  useEffect(() => { document.title = "Catálogo · AppSoft Marketplace"; }, []);
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
  return <div className="catalog-shell"><header className="site-header"><Link to="/"><img src={logo} alt="AppSoft, início" /></Link><nav aria-label="Conta"><Link className="button secondary" to={session ? "/minha-conta" : "/login"}>{session ? "Minha conta" : "Entrar"}</Link></nav></header>
    <main><div className="catalog-intro"><p className="eyebrow">EXPLORE O COMÉRCIO LOCAL</p><h1>Encontre o que combina com você.</h1><p>Escolha a categoria e refine a busca do seu jeito.</p></div><form className="catalog-search" onSubmit={event => { event.preventDefault(); update("q", search.trim()); }}><label>Buscar produtos<input type="search" value={search} maxLength={100} onChange={event => setSearch(event.target.value)} placeholder="O que você está procurando?" /></label><button className="button primary" type="submit">Buscar</button></form>
    <div className="catalog-layout"><aside className="filters-desktop"><FilterPanel data={data} params={params} update={update} clear={clear} /></aside><section className="catalog-results" aria-label="Produtos" aria-busy={loading}><div className="catalog-toolbar"><button className="button secondary mobile-filter-button" onClick={() => mobile.current?.showModal()}>Categorias e filtros{chips.length ? ` (${chips.length})` : ""}</button><p role="status">{loading ? "Buscando produtos…" : error ? "Não foi possível carregar" : `${data?.total || 0} produto(s) encontrado(s)`}</p><label>Ordenar por<select value={params.get("sort") || "recent"} onChange={event => update("sort", event.target.value)}><option value="recent">Mais recentes</option><option value="price_asc">Menor preço</option><option value="price_desc">Maior preço</option></select></label></div>
    {chips.length > 0 && <div className="filter-chips" aria-label="Filtros aplicados">{chips.map(chip => <button key={`${chip.key}-${chip.value}`} onClick={() => update(chip.key, chip.multiple ? chip.value : "", chip.multiple)} aria-label={`Remover ${chip.label}`}>{chip.label}<span aria-hidden="true">×</span></button>)}<button className="clear-chips" onClick={clear}>Limpar filtros</button></div>}
    {error ? <div className="catalog-empty"><h2>Não conseguimos carregar o catálogo</h2><p role="alert">{error}</p><button className="button secondary" onClick={() => setRefresh(value => value + 1)}>Tentar novamente</button></div> : loading ? <div className="catalog-skeleton" aria-hidden="true">{[1, 2, 3, 4, 5, 6].map(item => <div key={item} />)}</div> : data?.products.length ? <><div className="catalog-product-grid">{data.products.map(product => <article className="catalog-product" key={product.id}><button className="catalog-product-image" onClick={() => setSelected(product)} aria-label={`Ver detalhes de ${product.name}`}>{product.image_url ? <img src={product.image_url} alt={product.name} loading="lazy" onError={event => { event.currentTarget.style.visibility = "hidden"; }} /> : <span>Imagem indisponível</span>}</button><div className="catalog-product-copy"><p>{product.store_name}</p><h2><button onClick={() => setSelected(product)}>{product.name}</button></h2><strong>{formatMoney(product.price_cents)}</strong>{product.sizes.length > 0 && <small>Tamanhos: {product.sizes.join(" · ")}</small>}<button className="button secondary" onClick={() => setSelected(product)}>Ver detalhes</button></div></article>)}</div><nav className="pagination" aria-label="Paginação de produtos"><button className="button secondary" disabled={data.page <= 1} onClick={() => setParams(previous => { const next = new URLSearchParams(previous); next.set("page", String(data.page - 1)); return next; })}>Anterior</button><span>Página {data.page} de {Math.max(1, Math.ceil(data.total / data.pageSize))}</span><button className="button secondary" disabled={data.page * data.pageSize >= data.total} onClick={() => setParams(previous => { const next = new URLSearchParams(previous); next.set("page", String(data.page + 1)); return next; })}>Próxima</button></nav></> : <div className="catalog-empty"><span className="catalog-empty-icon" aria-hidden="true">⌕</span><h2>{chips.length ? "Nenhum produto com esses filtros" : "As novidades estão chegando"}</h2><p>{chips.length ? "Experimente outra categoria, faixa de preço ou loja." : "Os produtos aparecerão aqui quando as lojas estiverem disponíveis."}</p>{chips.length > 0 && <button className="button secondary" onClick={clear}>Limpar filtros</button>}</div>}
    </section></div></main><footer className="site-footer">AppSoft Marketplace · Conectando o comércio local</footer>
    <dialog className="mobile-filters-dialog" ref={mobile} aria-labelledby="mobile-filter-title"><header><h2 id="mobile-filter-title">Refine sua busca</h2><button className="button secondary" onClick={() => mobile.current?.close()}>Fechar</button></header><FilterPanel data={data} params={params} update={update} clear={clear} /><div className="mobile-filter-footer"><button className="button primary full" onClick={() => mobile.current?.close()}>Ver resultados</button></div></dialog>
    {selected && <ProductDetails product={selected} onClose={() => setSelected(null)} />}
  </div>;
}