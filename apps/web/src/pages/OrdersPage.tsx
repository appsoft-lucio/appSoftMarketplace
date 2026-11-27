import { useEffect, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import type { SavedOrder } from "@appsoft/domain/checkout";
import { formatMoney } from "@appsoft/domain";
import { useAuth } from "../auth/AuthProvider";
import { checkoutApi } from "../checkout/service";
import { PublicHeader } from "../components/layout/PublicHeader";
import "./CheckoutPage.css";

export default function OrdersPage() {
  const {storeId}=useParams();const {session}=useAuth();const [orders,setOrders]=useState<SavedOrder[]|null>(null);
  const [error,setError]=useState("");const [attempt,setAttempt]=useState(0);const [busy,setBusy]=useState(false);
  const [asaasSandbox, setAsaasSandbox] = useState(false);
  useEffect(()=>{document.title="Pedidos · AppSoft";},[]);
  useEffect(()=>{if(!session)return;const controller=new AbortController();setError("");setOrders(null);
    void checkoutApi.orders(storeId,controller.signal).then(result=>{
      if(controller.signal.aborted)return;
      setOrders(result.orders);
      setAsaasSandbox(result.asaasSandbox === true);
    }).catch(error=>{if(!controller.signal.aborted)setError(error.message);});return ()=>controller.abort();
  },[session?.user.id,storeId,attempt]);
  if(!session)return <Navigate to="/login" replace />;
  async function cancel(id:string) {
    if(busy)return;setBusy(true);setError("");
    try{await checkoutApi.cancel(id);setAttempt(a=>a+1);}catch(error){setError((error as Error).message);}finally{setBusy(false);}
  }
  async function pay(id: string) {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const payment = await checkoutApi.payAsaas(id);
      window.location.assign(payment.url);
    } catch (error) {
      setError((error as Error).message);
      setBusy(false);
    }
  }
  const labels:Record<string,string>={pending_payment:"Reserva ativa",cancelled:"Cancelado / reserva encerrada",processing:"Em preparação",shipped:"Enviado",delivered:"Entregue"};
  const seen=new Set<string>();
  return <div className="site-shell"><PublicHeader /><main className="page-content"><Link className="back-link" to={storeId ? "/minhas-lojas" : "/minha-conta"}>Voltar</Link><h1>{storeId ? "Pedidos da loja" : "Meus pedidos"}</h1>{!storeId && asaasSandbox && <p className="notice warning">Pagamento Pix no ambiente de testes do Asaas.</p>}<button className="button secondary" disabled={busy} onClick={()=>setAttempt(a=>a+1)}>Atualizar pedidos</button>{error&&<p className="notice error" role="alert">{error}</p>}{!orders ? !error&&<p role="status">Carregando pedidos…</p> : !orders.length ? <section className="panel-card"><h2>Nenhum pedido por aqui</h2><Link to="/catalogo">Explorar produtos</Link></section> : orders.map(order=>{
    const pending = !storeId && order.status === "pending_payment" && !seen.has(order.checkout_id);
    seen.add(order.checkout_id);
    const canPay = pending && asaasSandbox && (!order.asaas_status || order.asaas_status === "active");
    return <article className="panel-card order-card" key={order.id}><header><h2>{order.store_name}</h2><span>{labels[order.status]||order.status}</span></header><p className="order-code">Pedido: {order.id}</p><p className="order-code">Compra: {order.checkout_id}</p><p>{new Date(order.created_at).toLocaleString("pt-BR")}</p><ul>{order.items.map((item,i)=><li key={i}>{item.quantity} × {item.name}{item.size ? ` (${item.size})` : ""} — {formatMoney(item.unit_price_cents*item.quantity)}</li>)}</ul><dl className="definition-list"><div><dt>Produtos</dt><dd>{formatMoney(order.subtotal_cents)}</dd></div><div><dt>Frete</dt><dd>{formatMoney(order.shipping_cents)}</dd></div><div><dt>Total</dt><dd>{formatMoney(order.total_cents)}</dd></div></dl><p>{order.shipping_name} · Prazo estimado: {order.estimated_days} dia(s) útil(eis).</p><p className="checkout-notes">{order.shipping_notes}</p><p>{order.delivery_address.recipient} · {order.delivery_address.phone}</p><p>{order.delivery_address.street}, {order.delivery_address.number}{order.delivery_address.complement ? `, ${order.delivery_address.complement}` : ""} — {order.delivery_address.district}, {order.delivery_address.city}/{order.delivery_address.state}, CEP {order.delivery_address.postal_code}</p>{order.status==="pending_payment"&&<p>Reserva até {new Date(order.expires_at).toLocaleString("pt-BR")}.</p>}
      {!storeId && order.asaas_status === "review" && <p>Pagamento Pix de teste em revisão.</p>}
      {pending && order.asaas_status === "creating" && <p>Aguardando confirmação da sessão Pix. Atualize seus pedidos para verificar.</p>}
      {pending && <div className="checkout-actions">
        {canPay && <button className="button primary" disabled={busy} onClick={()=>void pay(order.checkout_id)}>{order.asaas_status === "active" ? "Reabrir Pix de teste" : "Pagar compra com Pix de teste"}</button>}
        {!order.asaas_status && <button className="button secondary" disabled={busy} onClick={()=>void cancel(order.checkout_id)}>Cancelar todos os pedidos desta compra</button>}
      </div>}
    </article>;
  })}</main></div>;
}
