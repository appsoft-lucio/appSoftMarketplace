import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import type { PublicProduct } from "@appsoft/domain/cart";
import { useCart } from "../cart/CartProvider";
import { formatMoney } from "@appsoft/domain";
import { publicApi } from "../cart/service";
import { PublicHeader } from "../components/layout/PublicHeader";
import "./PublicPages.css";
import "./ProductsPage.css";

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
  return <div className="site-shell"><PublicHeader /><main className="page-content"><Link to="/catalogo" className="back-link">Voltar ao catálogo</Link>{loading ? <p role="status">Carregando produto…</p> : !product ? <p className="notice error" role="alert">{error || "Produto indisponível."}</p> : <div className="public-product"><div className="public-product-image">{product.image_url ? <img decoding="async" src={product.image_url} alt={product.name} /> : <span>Imagem indisponível</span>}</div><section><Link to={`/loja/${product.store_slug}`}>{product.store_name}</Link><h1>{product.name}</h1>{product.original_price_cents && product.original_price_cents > product.price_cents ? <p>De <del>{formatMoney(product.original_price_cents)}</del></p> : null}<p className="public-product-price">{formatMoney(product.price_cents)}</p>{product.brand && <p>Marca: {product.brand}</p>}<div className="product-gallery">{product.images?.slice(1).map((url,i)=><a href={url} key={i} target="_blank" rel="noreferrer"><img decoding="async" src={url} alt={`${product.name} - foto ${i+2}`} loading="lazy" /></a>)}</div><h2>Entrega</h2><p>{product.shipping_mode === "free" ? "Frete grátis" : product.shipping_mode === "fixed" ? `Frete informado: ${formatMoney(product.shipping_price_cents || 0)}` : product.shipping_mode === "pickup" ? "Retirada na loja" : "Frete a combinar com a loja"}</p>{product.delivery_days && <p>Prazo estimado: {product.delivery_days} dias úteis.</p>}{product.shipping_notes && <p className="public-product-description">{product.shipping_notes}</p>}<p className="public-product-description">{product.description}</p><form className="form" onSubmit={event => { event.preventDefault(); setError(""); setNotice(""); try { cart.add(product, product.variants.length ? size || null : null, quantity); setNotice("Produto adicionado ao carrinho."); } catch (error) { setError((error as Error).message); } }}><fieldset>{product.variants.length > 0 && <label>Tamanho<select value={size} required onChange={event => { setSize(event.target.value); setQuantity(1); setNotice(""); }}><option value="">Selecione</option>{product.variants.map(variant => <option key={variant.size} value={variant.size} disabled={variant.stock <= 0}>{variant.size}{variant.stock <= 0 ? " — esgotado" : ""}</option>)}</select></label>}<label>Quantidade<input type="number" min={1} max={Math.max(1, Math.min(stock, 99))} required value={quantity} onChange={event => setQuantity(Number(event.target.value))} /></label>{error && <p className="notice error" role="alert">{error}</p>}{notice && <p className="notice success" role="status">{notice} <Link to="/carrinho">Ver carrinho</Link></p>}<button className="button primary" disabled={!stock}>Adicionar ao carrinho</button><p className="fine-print">Você pode adicionar sem conta. O estoque é confirmado novamente no carrinho; não há reserva nesta etapa.</p></fieldset></form></section></div>}</main></div>;
}
