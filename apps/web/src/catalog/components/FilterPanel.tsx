import { useEffect, useId, useState } from "react";
import type { FormEvent } from "react";
import type { CatalogResult, Category } from "@appsoft/domain/catalog";
import { priceToCents } from "@appsoft/domain/catalog";

export type UpdateFilter = (key: string, value: string, multiple?: boolean) => void;
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
export function FilterPanel({ data, params, update, clear }: { data: CatalogResult | null; params: URLSearchParams; update: UpdateFilter; clear: () => void }) {
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
