import { useEffect, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import type { FormEvent } from "react";
import { parseShipping } from "@appsoft/domain/checkout";
import type { ShippingSettings } from "@appsoft/domain/checkout";
import { priceToCents } from "@appsoft/domain/catalog";
import { useAuth } from "../auth/AuthProvider";
import { StoreLayout } from "../stores/components/StoreLayout";
import { checkoutApi } from "../checkout/service";
import "./CheckoutPage.css";

export default function ShippingPage() {
  const {storeId=""}=useParams(); const {session}=useAuth();
  const [settings,setSettings]=useState<ShippingSettings|null>(null);
  const [error,setError]=useState(""); const [notice,setNotice]=useState(""); const [busy,setBusy]=useState(false); const [attempt,setAttempt]=useState(0);
  useEffect(()=>{document.title="Frete da loja · AppSoft";},[]);
  useEffect(()=>{if(!session)return; const controller=new AbortController();setError("");setSettings(null);
    void checkoutApi.shipping(storeId,controller.signal).then(result=>{if(!controller.signal.aborted)setSettings(result.shipping);}).catch(error=>{if(!controller.signal.aborted)setError(error.message);});
    return ()=>controller.abort();
  },[session?.user.id,storeId,attempt]);
  if(!session)return <Navigate to="/login" replace />;
  async function submit(event:FormEvent<HTMLFormElement>) {
    event.preventDefault(); if(busy)return;setError("");setNotice("");const form=new FormData(event.currentTarget);
    try {
      const input=parseShipping({delivery_enabled:form.has("delivery"),pickup_enabled:form.has("pickup"),delivery_scope:form.get("scope"),base_price_cents:priceToCents(String(form.get("price"))),estimated_days:Number(form.get("days")),notes:String(form.get("notes"))});
      setBusy(true); await checkoutApi.saveShipping(storeId,input);setSettings(input);setNotice("Configuração de frete salva.");
    }catch(error){setError((error as Error).message);}finally{setBusy(false);}
  }
  return <StoreLayout><Link to="/minhas-lojas" className="back-link">Voltar para minhas lojas</Link><h1>Frete e retirada</h1><p>Configure onde sua loja entrega e como o frete será calculado.</p>{error&&<p role="alert" className="notice error">{error}</p>}{notice&&<p role="status" className="notice success">{notice}</p>}{!settings ? error ? <button className="button secondary" onClick={()=>setAttempt(a=>a+1)}>Tentar novamente</button> : <p role="status">Carregando configuração…</p> : <section className="panel-card checkout-form"><form className="form" onSubmit={submit}><fieldset disabled={busy}>
    <label className="checkout-check"><input type="checkbox" name="delivery" defaultChecked={settings.delivery_enabled} /> Oferecer entrega</label>
    <label>Área de entrega<select name="scope" defaultValue={settings.delivery_scope}><option value="city">Somente a cidade da loja</option><option value="state">Todo o estado da loja</option><option value="country">Todo o Brasil</option></select></label>
    <label>Frete base por pedido (R$)<input name="price" inputMode="decimal" defaultValue={(settings.base_price_cents/100).toFixed(2)} required /><small>Cobrado uma vez por loja quando houver produtos com frete a combinar. Use 0 para oferecer entrega grátis nesses itens.</small></label>
    <label>Prazo estimado (dias úteis)<input name="days" type="number" min={0} max={365} defaultValue={settings.estimated_days} required /></label>
    <label className="checkout-check"><input type="checkbox" name="pickup" defaultChecked={settings.pickup_enabled} /> Permitir retirada na loja sem frete</label>
    <label>Condições de entrega e retirada<textarea name="notes" rows={4} maxLength={1000} defaultValue={settings.notes} placeholder="Informe o endereço e os horários para retirada e as condições de entrega." /></label>
    <p>O frete fixo cadastrado no produto é somado por unidade. Produtos com frete grátis não acrescentam tarifa. O prazo final considera o maior prazo dos produtos e da loja.</p><p>A área de entrega deve corresponder à sua operação. As observações complementam essa regra; não restringem CEPs automaticamente.</p>
    <button className="button primary" disabled={busy}>{busy ? "Salvando…" : "Salvar frete"}</button>
  </fieldset></form></section>}</StoreLayout>;
}
