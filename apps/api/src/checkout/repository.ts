import { createHash } from "node:crypto";
import type { CheckoutInput, CheckoutQuote, CheckoutStore, SavedOrder, ShippingSettings } from "@appsoft/domain/checkout";
import { defaultShipping } from "@appsoft/domain/checkout";
import type { Database } from "../stores/repository.ts";
import type { Identity } from "../auth.ts";
import { HttpError } from "../auth.ts";
import { cartQuote } from "../public/repository.ts";

const hash=(value:unknown)=>createHash("sha256").update(JSON.stringify(value)).digest("hex");
const normalize=(value:string)=>value.normalize("NFD").replace(/[\u0300-\u036f]/g,"").trim().toLowerCase();
type StoreShipping=ShippingSettings & {id:string;city:string;state:string};
export async function releaseExpired(db:Database) { await db.query("SELECT marketplace_v2.release_expired_orders()"); }
export async function shippingSettings(db:Database,storeId:string):Promise<ShippingSettings> {
  return (await db.query<ShippingSettings>("SELECT delivery_enabled,pickup_enabled,delivery_scope,base_price_cents,estimated_days,notes FROM marketplace_v2.store_shipping WHERE store_id=$1",[storeId])).rows[0] || {...defaultShipping};
}
export async function saveShipping(db:Database,storeId:string,input:ShippingSettings) {
  await db.query(`INSERT INTO marketplace_v2.store_shipping(store_id,delivery_enabled,pickup_enabled,delivery_scope,base_price_cents,estimated_days,notes)
    VALUES($1,$2,$3,$4,$5,$6,$7) ON CONFLICT(store_id) DO UPDATE SET delivery_enabled=$2,pickup_enabled=$3,delivery_scope=$4,base_price_cents=$5,estimated_days=$6,notes=$7`,
  [storeId,input.delivery_enabled,input.pickup_enabled,input.delivery_scope,input.base_price_cents,input.estimated_days,input.notes]);
  return input;
}
export async function checkoutQuote(db:Database,input:CheckoutInput):Promise<CheckoutQuote> {
  const cart=await cartQuote(db,input.items);
  if (cart.hasIssues) throw new HttpError(409,"O estoque ou a disponibilidade mudou. Confira o carrinho novamente.");
  const storeIds=[...new Set(cart.items.map(line=>line.product!.store_id))].sort();
  const settings=(await db.query<StoreShipping>(`SELECT s.id,s.city,s.state,
    coalesce(f.delivery_enabled,false) AS delivery_enabled,coalesce(f.pickup_enabled,false) AS pickup_enabled,
    coalesce(f.delivery_scope,'city') AS delivery_scope,coalesce(f.base_price_cents,0) AS base_price_cents,
    coalesce(f.estimated_days,3) AS estimated_days,coalesce(f.notes,'') AS notes
    FROM marketplace_v2.stores s LEFT JOIN marketplace_v2.store_shipping f ON f.store_id=s.id WHERE s.id=ANY($1::uuid[])`,[storeIds])).rows;
  const stores:CheckoutStore[]=storeIds.map(storeId=>{
    const lines=cart.items.filter(line=>line.product!.store_id===storeId);
    const config=settings.find(row=>row.id===storeId)!;
    const area=config.delivery_scope==="country" || (config.state===input.address.state && (config.delivery_scope==="state" || normalize(config.city)===normalize(input.address.city)));
    const delivery_available=config.delivery_enabled && area && lines.every(line=>line.product!.shipping_mode!=="pickup");
    const method=input.methods[storeId] || "delivery";
    const error=method==="pickup" ? config.pickup_enabled ? null : "Esta loja não oferece retirada." : delivery_available ? null : "Entrega indisponível para este endereço ou produto. Escolha retirada, se disponível.";
    const subtotal_cents=lines.reduce((sum,line)=>sum+line.lineTotalCents!,0);
    // Fixed product freight is per unit; the store base is charged once for items marked arrange.
    const shipping_cents=method==="pickup" ? 0 : lines.reduce((sum,line)=>sum+(line.product!.shipping_mode==="fixed" ? (line.product!.shipping_price_cents || 0)*line.quantity : 0),0)+(lines.some(line=>line.product!.shipping_mode==="arrange") ? config.base_price_cents : 0);
    const estimated_days=method==="pickup" ? 0 : Math.max(config.estimated_days,...lines.map(line=>line.product!.delivery_days || 0));
    return {store_id:storeId,store_name:lines[0].product!.store_name,subtotal_cents,shipping_cents,total_cents:subtotal_cents+shipping_cents,method,delivery_available,pickup_available:config.pickup_enabled,estimated_days,
      shipping_notes:[config.notes,...new Set(lines.map(line=>line.product!.shipping_notes || "").filter(Boolean))].filter(Boolean).join("\n"),error,
      items:lines.map(line=>({productId:line.productId,name:line.product!.name,size:line.size,quantity:line.quantity,unit_price_cents:line.product!.price_cents}))};
  });
  const subtotal_cents=stores.reduce((sum,s)=>sum+s.subtotal_cents,0);
  const shipping_cents=stores.reduce((sum,s)=>sum+s.shipping_cents,0);
  const total_cents=subtotal_cents+shipping_cents;
  if (!Number.isSafeInteger(total_cents) || total_cents>2147483647) throw new HttpError(400,"O valor desta compra excede o limite. Divida os itens em compras menores.");
  return {stores,subtotal_cents,shipping_cents,total_cents,canSubmit:stores.every(store=>!store.error),quoteToken:hash({input,stores})};
}
export async function listOrders(db:Database,subject:string,storeId?:string,checkoutId?:string):Promise<SavedOrder[]> {
  return (await db.query<SavedOrder>(`SELECT o.*,s.name AS store_name,c.expires_at,
    coalesce((SELECT jsonb_agg(jsonb_build_object('productId',i.product_id,'name',i.product_name,'size',i.variant_size,'quantity',i.quantity,'unit_price_cents',i.unit_price_cents) ORDER BY i.id)
    FROM marketplace_v2.order_items i WHERE i.order_id=o.id),'[]'::jsonb) AS items
    FROM marketplace_v2.store_orders o JOIN marketplace_v2.checkouts c ON c.id=o.checkout_id JOIN marketplace_v2.stores s ON s.id=o.store_id
    WHERE ${storeId ? "o.store_id=$1" : "c.customer_id IN (SELECT id FROM marketplace_v2.users WHERE auth_subject=$1)"}
    ${checkoutId ? "AND c.id=$2" : ""}
    ORDER BY o.created_at DESC,o.id LIMIT 100`,checkoutId ? [storeId || subject,checkoutId] : [storeId || subject])).rows;
}
export async function createCheckout(db:Database,user:Identity,input:CheckoutInput,key:string,quoteToken:string) {
  const customer=(await db.query<{id:string}>(`INSERT INTO marketplace_v2.users(auth_subject,name,email) VALUES($1,$2,$3)
    ON CONFLICT(auth_subject) DO UPDATE SET name=EXCLUDED.name,email=EXCLUDED.email RETURNING id`,[user.id,user.name,user.email])).rows[0].id;
  const requestHash=hash({input,quoteToken});
  const previous=(await db.query<{id:string;customer_id:string;request_hash:string}>("SELECT id,customer_id,request_hash FROM marketplace_v2.checkouts WHERE idempotency_key=$1",[key])).rows[0];
  if (previous) {
    if (previous.customer_id!==customer || previous.request_hash!==requestHash) throw new HttpError(409,"Esta tentativa já foi usada com outros dados. Atualize o resumo antes de tentar novamente.");
    return {checkout_id:previous.id,orders:await listOrders(db,user.id,undefined,previous.id)};
  }
  const productIds=[...new Set(input.items.map(item=>item.productId))].sort();
  // Lock in the same order as product administration: stores, then products/variants.
  await db.query(`SELECT id FROM marketplace_v2.stores WHERE id IN(SELECT store_id FROM marketplace_v2.products WHERE id=ANY($1::uuid[])) ORDER BY id FOR UPDATE`,[productIds]);
  await db.query("SELECT id FROM marketplace_v2.products WHERE id=ANY($1::uuid[]) ORDER BY id FOR UPDATE",[productIds]);
  await db.query("SELECT id FROM marketplace_v2.product_variants WHERE product_id=ANY($1::uuid[]) ORDER BY product_id,size FOR UPDATE",[productIds]);
  const quote=await checkoutQuote(db,input);
  if (!quote.canSubmit) throw new HttpError(409,"Confira as opções de entrega de cada loja.");
  if (quote.quoteToken!==quoteToken) throw new HttpError(409,"Preços, frete ou condições mudaram. Atualize o resumo e confira os novos valores.");
  const checkoutId=(await db.query<{id:string}>(`INSERT INTO marketplace_v2.checkouts(customer_id,idempotency_key,request_hash,expires_at) VALUES($1,$2,$3,clock_timestamp()+interval '30 minutes') RETURNING id`,[customer,key,requestHash])).rows[0].id;
  for (const store of quote.stores) {
    const orderId=(await db.query<{id:string}>(`INSERT INTO marketplace_v2.store_orders(checkout_id,store_id,subtotal_cents,shipping_cents,delivery_address,shipping_name,estimated_days,shipping_notes)
      VALUES($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id`,[checkoutId,store.store_id,store.subtotal_cents,store.shipping_cents,JSON.stringify(input.address),store.method==="pickup" ? "Retirada na loja" : "Entrega da loja",store.estimated_days,store.shipping_notes])).rows[0].id;
    for (const item of store.items) {
      const params=[item.quantity,item.productId,item.size];
      const result=item.size===null ? await db.query("UPDATE marketplace_v2.products SET stock=stock-$1 WHERE id=$2 AND stock>=$1 RETURNING id",params.slice(0,2)) : await db.query("UPDATE marketplace_v2.product_variants SET stock=stock-$1 WHERE product_id=$2 AND size=$3 AND stock>=$1 RETURNING id",params);
      if (!result.rows.length) throw new HttpError(409,"O estoque mudou. Confira o carrinho novamente.");
      await db.query(`INSERT INTO marketplace_v2.order_items(order_id,store_id,product_id,product_name,unit_price_cents,quantity,variant_size) VALUES($1,$2,$3,$4,$5,$6,$7)`,[orderId,store.store_id,item.productId,item.name,item.unit_price_cents,item.quantity,item.size]);
    }
    await db.query("INSERT INTO marketplace_v2.order_events(order_id,actor_id,status,note) VALUES($1,$2,'pending_payment','Pedido preparado; reserva de 30 minutos. Nenhuma cobrança realizada.')",[orderId,customer]);
  }
  return {checkout_id:checkoutId,orders:await listOrders(db,user.id,undefined,checkoutId)};
}
export async function cancelCheckout(db:Database,subject:string,id:string) {
  const result=await db.query(`UPDATE marketplace_v2.checkouts SET expires_at=clock_timestamp() WHERE id=$1 AND customer_id IN(SELECT id FROM marketplace_v2.users WHERE auth_subject=$2) RETURNING id`,[id,subject]);
  if (!result.rows.length) throw new HttpError(404,"Compra não encontrada.");
  await releaseExpired(db);
}
