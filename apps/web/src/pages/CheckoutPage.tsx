import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Link, Navigate } from "react-router-dom";
import { BRAZIL_STATES } from "@appsoft/domain/stores";
import { parseCheckout } from "@appsoft/domain/checkout";
import type { CheckoutInput, CheckoutQuote, DeliveryMethod, SavedOrder } from "@appsoft/domain/checkout";
import { formatMoney } from "@appsoft/domain";
import { useAuth } from "../auth/AuthProvider";
import { useCart } from "../cart/CartProvider";
import { checkoutApi } from "../checkout/service";
import { ApiError } from "../stores/service";
import { PublicHeader } from "../components/layout/PublicHeader";
import "./CheckoutPage.css";

type Pending={input:CheckoutInput;key:string;token:string};
export default function CheckoutPage() {
  const {session}=useAuth();const cart=useCart();
  const [quote,setQuote]=useState<CheckoutQuote|null>(null);const [input,setInput]=useState<CheckoutInput|null>(null);
  const [methods,setMethods]=useState<Record<string,DeliveryMethod>>({});const [dirty,setDirty]=useState(true);
  const [busy,setBusy]=useState(false);const [error,setError]=useState("");const [orders,setOrders]=useState<SavedOrder[]|null>(null);
  const pendingKey=`appsoft.checkout.pending.${session?.user.id || ""}`;
  const [pending,setPending]=useState<Pending|null>(()=>{
    try {const value=JSON.parse(sessionStorage.getItem(pendingKey)||"null");if(!value)return null;return {input:parseCheckout(value.input),key:String(value.key),token:String(value.token)};}catch{return null;}
  });
  useEffect(()=>{document.title="Revisar compra · AppSoft";},[]);
  useEffect(()=>{setDirty(true);},[cart.items]);
  if(!session)return <Navigate to="/login?next=/finalizar-compra" replace />;
  if(!cart.items.length&&!orders&&!pending)return <Navigate to="/carrinho" replace />;
  async function preview(event:FormEvent<HTMLFormElement>) {
    event.preventDefault();if(busy)return;setError("");
    try {
      const address=Object.fromEntries(new FormData(event.currentTarget));
      const next=parseCheckout({items:cart.items,address,methods});setBusy(true);
      const result=await checkoutApi.quote(next);setInput(next);setQuote(result);setDirty(false);
    }catch(error){setError((error as Error).message);setDirty(true);}finally{setBusy(false);}
  }
  async function create(attempt:Pending) {
    if(busy)return;setBusy(true);setError("");setPending(attempt);
    try {
      // Do not send the order if the browser cannot retain its retry key.
      sessionStorage.setItem(pendingKey,JSON.stringify(attempt));
      const result=await checkoutApi.create(attempt.input,attempt.key,attempt.token);
      setOrders(result.orders);cart.consume(attempt.input.items);setPending(null);sessionStorage.removeItem(pendingKey);
    }catch(error){
      setError((error as Error).message);
      // If storage itself failed, the request has not been sent and can be prepared again.
      if(error instanceof DOMException && ["QuotaExceededError","SecurityError"].includes(error.name)) {
        setPending(null);setError("Não foi possível guardar a identificação desta tentativa. Libere espaço ou permita o armazenamento no navegador antes de reservar.");
      }
      if(error instanceof ApiError && [400,401,403,404,409].includes(error.status)){setPending(null);sessionStorage.removeItem(pendingKey);setDirty(true);}
    }finally{setBusy(false);}
  }
  return <div className="site-shell"><PublicHeader /><main className="page-content"><Link to="/carrinho" className="back-link">Voltar ao carrinho</Link><h1>Revisar compra</h1><p className="notice warning">O pagamento ainda não está disponível. Você pode preparar os pedidos e reservar o estoque por 30 minutos, sem cobrança.</p>{error&&<p role="alert" className="notice error">{error}</p>}{orders ? <section className="panel-card"><h2>Pedidos preparados</h2><p>Nenhum pagamento foi realizado. Consulte os pedidos para acompanhar ou cancelar a reserva.</p>{orders.map(order=><p key={order.id}>{order.store_name}: {formatMoney(order.total_cents)} — {order.status==="cancelled" ? "Reserva encerrada" : `Reserva até ${new Date(order.expires_at).toLocaleString("pt-BR")}`}</p>)}<Link className="button primary" to="/meus-pedidos">Ver meus pedidos</Link></section> : pending ? <section className="panel-card"><h2>Conferir tentativa anterior</h2><p>A resposta pode ter se perdido na conexão. Tente novamente com a mesma identificação para evitar pedidos duplicados.</p><div className="checkout-actions"><button className="button primary" disabled={busy} onClick={()=>void create(pending)}>{busy ? "Conferindo…" : "Conferir e repetir tentativa"}</button><Link to="/meus-pedidos">Consultar meus pedidos</Link></div></section> : <>
    <section className="panel-card checkout-form"><h2>Destinatário e endereço</h2><form id="checkout-address" className="form" onSubmit={preview} onChange={()=>setDirty(true)}><fieldset disabled={busy}>
    <label>Nome do destinatário<input name="recipient" autoComplete="name" required minLength={3} maxLength={120} /></label>
    <div className="checkout-fields"><label>Telefone com DDD<input name="phone" type="tel" autoComplete="tel-national" required maxLength={20} /></label><label>CEP<input name="postal_code" inputMode="numeric" autoComplete="postal-code" required minLength={8} maxLength={9} placeholder="00000-000" /></label></div>
    <label>Rua ou avenida<input name="street" autoComplete="address-line1" required minLength={3} maxLength={160} /></label>
    <div className="checkout-fields"><label>Número<input name="number" required maxLength={20} placeholder="Número ou S/N" /></label><label>Complemento<input name="complement" autoComplete="address-line2" maxLength={100} /></label></div>
    <label>Bairro<input name="district" required minLength={2} maxLength={100} /></label>
    <div className="checkout-fields"><label>Cidade<input name="city" autoComplete="address-level2" required minLength={2} maxLength={100} /></label><label>Estado<select name="state" autoComplete="address-level1" required defaultValue=""><option value="">Selecione</option>{BRAZIL_STATES.map(state=><option key={state}>{state}</option>)}</select></label></div>
    <button className="button secondary" disabled={busy}>{busy ? "Conferindo…" : "Calcular frete e revisar"}</button>
    </fieldset></form></section>
    {quote&&<><div className="checkout-stores">{quote.stores.map(store=><section className="panel-card" key={store.store_id}><h2>{store.store_name}</h2><ul>{store.items.map(item=><li key={`${item.productId}:${item.size}`}>{item.quantity} × {item.name}{item.size ? ` (${item.size})` : ""} — {formatMoney(item.unit_price_cents*item.quantity)}</li>)}</ul>
      <label>Entrega de {store.store_name}<select value={methods[store.store_id]||"delivery"} disabled={busy} onChange={event=>{setMethods({...methods,[store.store_id]:event.target.value as DeliveryMethod});setDirty(true);}}><option value="delivery" disabled={!store.delivery_available}>Entrega pela loja{!store.delivery_available ? " — indisponível" : ""}</option><option value="pickup" disabled={!store.pickup_available}>Retirada sem frete{!store.pickup_available ? " — indisponível" : ""}</option></select></label>
      {store.error&&<p className="notice error">{store.error}</p>}<p>Produtos: {formatMoney(store.subtotal_cents)} · Frete: {store.error ? "Indisponível" : formatMoney(store.shipping_cents)}</p><p>Prazo estimado: {store.estimated_days} dia(s) útil(eis).</p><p className="checkout-notes">{store.shipping_notes}</p></section>)}</div>
      <section className="panel-card"><h2>Total da compra</h2><p>Produtos: {formatMoney(quote.subtotal_cents)}</p><p>Frete: {quote.canSubmit ? formatMoney(quote.shipping_cents) : "Confira as opções de entrega"}</p>{quote.canSubmit&&<p className="checkout-total">{formatMoney(quote.total_cents)}</p>}{dirty&&<p role="status">Os dados mudaram. Atualize o resumo para conferir os valores.</p>}<div className="checkout-actions"><button className="button secondary" form="checkout-address" disabled={busy}>Atualizar resumo</button><button className="button primary" disabled={busy||dirty||!quote.canSubmit||!input} onClick={()=>{if(input)void create({input,key:crypto.randomUUID(),token:quote.quoteToken});}}>Preparar pedidos e reservar por 30 minutos</button></div></section>
    </>}
  </>}</main></div>;
}
