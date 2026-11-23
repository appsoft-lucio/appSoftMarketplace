import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { cartKey } from "@appsoft/domain/cart";
import type { CartQuote } from "@appsoft/domain/cart";
import { formatMoney } from "@appsoft/domain";
import { useCart } from "../cart/CartProvider";
import { publicApi } from "../cart/service";
import { useAuth } from "../auth/AuthProvider";
import { PublicHeader } from "../components/layout/PublicHeader";
import "./CartPage.css";

function useQuote() {
  const { items } = useCart();
  const [quote, setQuote] = useState<CartQuote | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(items.length > 0);
  const [refresh, setRefresh] = useState(0);
  useEffect(() => {
    const controller = new AbortController(); setError("");
    if (!items.length) { setQuote(null); setLoading(false); return; }
    setLoading(true);
    void publicApi.quote(items, controller.signal).then(result => { if (!controller.signal.aborted) setQuote(result); }).catch(error => { if (!controller.signal.aborted) { setError(error.message); setQuote(null); } }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [items, refresh]);
  return { quote, error, loading, retry: () => setRefresh(value => value + 1) };
}
export default function CartPage() {
  const cart = useCart();
  const { session } = useAuth();
  const { quote, error, loading, retry } = useQuote();
  useEffect(() => { document.title = "Carrinho · AppSoft"; }, []);
  const storeIds = [...new Set(quote?.items.map(line => line.product?.store_id || "unavailable") || [])];
  return <div className="site-shell"><PublicHeader /><main className="page-content"><div className="page-heading"><p className="eyebrow">SEU CARRINHO</p><h1>Escolhas do seu jeito</h1><p>Você não precisa de conta para montar seu carrinho.</p></div>{cart.storageWarning && <p className="notice warning" role="status">Seu navegador não permitiu salvar o carrinho. Os itens podem ser perdidos ao fechar a página.</p>}{!cart.items.length ? <section className="panel-card"><h2>Seu carrinho está vazio</h2><p>Explore os produtos e adicione o que gostar.</p><Link className="button primary" to="/catalogo">Explorar produtos</Link></section> : loading ? <p role="status">Conferindo preços e disponibilidade…</p> : error ? <section><p className="notice error" role="alert">{error}</p><button className="button secondary" onClick={retry}>Tentar novamente</button></section> : quote && <div className="cart-layout"><div>{storeIds.map(storeId => {
    const lines = quote.items.filter(line => (line.product?.store_id || "unavailable") === storeId);
    const first = lines[0].product;
    return <section className="panel-card" key={storeId}><h2>{first ? <Link to={`/loja/${first.store_slug}`}>{first.store_name}</Link> : "Itens indisponíveis"}</h2>{lines.map(line => {
      const key = cartKey(line);
      const label = `${line.product?.name || "Produto indisponível"}${line.size ? `, tamanho ${line.size}` : ""}`;
      return <article className="cart-line" key={key}><div><h3>{line.product ? <Link to={`/produto/${line.product.id}`}>{line.product.name}</Link> : "Produto indisponível"}</h3>{line.size && <p>Tamanho: {line.size}</p>}{line.product && <p>{formatMoney(line.product.price_cents)} por unidade</p>}{line.error && <p className="cart-line-error" role="alert">{line.error}</p>}<button className="text-button" onClick={() => cart.remove(key)} aria-label={`Remover ${label}`}>Remover</button></div><div className="cart-line-actions"><div className="cart-quantity"><button className="button secondary" disabled={line.quantity <= 1} onClick={() => cart.setQuantity(key, line.quantity - 1)} aria-label={`Diminuir ${label}`}>−</button><span aria-label={`Quantidade de ${label}`}>{line.quantity}</span><button className="button secondary" disabled={line.quantity >= line.maxQuantity} onClick={() => cart.setQuantity(key, line.quantity + 1)} aria-label={`Aumentar ${label}`}>+</button></div><strong>{line.lineTotalCents === null ? "Indisponível" : formatMoney(line.lineTotalCents)}</strong></div></article>;
    })}</section>;
  })}</div><aside className="panel-card cart-summary"><h2>Resumo</h2><dl className="definition-list"><div><dt>Subtotal{quote.hasIssues ? " disponível" : ""}</dt><dd>{formatMoney(quote.subtotalCents)}</dd></div><div><dt>Frete</dt><dd>A definir</dd></div></dl>{quote.hasIssues && <p className="notice warning">Ajuste ou remova os itens indisponíveis para continuar.</p>}{!quote.hasIssues && <Link className="button primary full" to={session ? "/finalizar-compra" : "/login?next=/finalizar-compra"}>{session ? "Continuar" : "Entrar para continuar"}</Link>}<p className="fine-print">Frete e pagamento ainda não estão disponíveis. Seu carrinho não reserva estoque e será conferido novamente.</p><Link to="/catalogo">Continuar explorando</Link></aside></div>}</main></div>;
}
export function CheckoutPage() {
  const { session } = useAuth();
  const { items } = useCart();
  if (!session) return <Navigate to="/login?next=/finalizar-compra" replace />;
  if (!items.length) return <Navigate to="/carrinho" replace />;
  return <div className="site-shell"><PublicHeader /><main className="page-content"><div className="page-heading"><h1>Você está conectado</h1></div><section className="panel-card"><h2>Seu carrinho continua salvo</h2><p>O frete e o pagamento estão em desenvolvimento. Nenhuma compra ou cobrança foi feita. Você poderá concluir a compra quando essa etapa estiver disponível.</p><Link className="button primary" to="/carrinho">Voltar ao carrinho</Link></section></main></div>;
}