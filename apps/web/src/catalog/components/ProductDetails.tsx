import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import type { CatalogProduct } from "@appsoft/domain/catalog";
import { formatMoney } from "@appsoft/domain";

export function ProductDetails({ product, onClose }: { product: CatalogProduct; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => { ref.current?.showModal(); }, []);
  return <dialog className="catalog-product-dialog" ref={ref} aria-labelledby="product-title" onCancel={event => { event.preventDefault(); onClose(); }}><button className="button secondary" onClick={onClose}>Fechar</button><Link className="eyebrow" to={product.store_slug ? `/loja/${product.store_slug}` : "/lojas"}>{product.store_name}</Link><h2 id="product-title">{product.name}</h2><p className="product-detail-price">{formatMoney(product.price_cents)}</p><p className="product-description">{product.description}</p>{product.sizes.length > 0 && <p>Tamanhos disponíveis: {product.sizes.join(", ")}</p>}<Link className="button primary" to={`/produto/${product.id}`}>Escolher opções e adicionar ao carrinho</Link></dialog>;
}
