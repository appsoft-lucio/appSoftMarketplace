import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import type { PoolClient } from "pg";
import { getPool } from "../src/database.ts";
import type { Database } from "../src/stores/repository.ts";
import { insertStore } from "../src/stores/repository.ts";
import { authorizeStore, saveProduct } from "../src/products/repository.ts";
import { validateProduct } from "@appsoft/domain/products";
import { parseCheckout, parseShipping } from "@appsoft/domain/checkout";
import { cancelCheckout, checkoutQuote, createCheckout, listOrders, releaseExpired, saveShipping } from "../src/checkout/repository.ts";

// Test fixtures exist only inside this transaction: no COMMIT, no Auth accounts,
// no messages, no payment calls, no publicly visible test stores.
const pool=getPool();
const runId=randomUUID();
const checks:string[]=[];
let step="connect";
let rolledBack=false;
let client:PoolClient|undefined;
try {
  client=await pool.connect();
  await client.query("BEGIN");
  await client.query("SET LOCAL statement_timeout='15s'; SET LOCAL lock_timeout='3s'; SET LOCAL idle_in_transaction_session_timeout='30s'");
  const db=client as unknown as Database;
  step="migration history";
  const history=await client.query<{name:string}>("SELECT name FROM appsoft_internal.migrations ORDER BY name");
  for(const name of ["005_product_management.sql","006_checkout_shipping.sql","009_asaas_checkout.sql"]) assert.ok(history.rows.some(row=>row.name===name), `Missing migration: ${name}`);
  checks.push("migrations 005, 006 and 009 present");
  const owner={id:randomUUID(),name:"Verificação temporária",email:`owner-${runId}@example.invalid`};
  const other={id:randomUUID(),name:"Outra conta temporária",email:`other-${runId}@example.invalid`};
  const buyer={id:randomUUID(),name:"Comprador temporário",email:`buyer-${runId}@example.invalid`};
  step="temporary stores and products";
  const stores=[];
  for(const [index,user] of [owner,other].entries()) {
    const store=await insertStore(db,user,{name:`Verificação ${index+1}`,slug:`verify-${runId}-${index}`,description:"Dados temporários; transação sempre desfeita.",phone:"11999991234",city:"São Paulo",state:"SP"});
    stores.push(store);
    await client.query("UPDATE marketplace_v2.stores SET status='approved' WHERE id=$1",[store.id]);
    await client.query("INSERT INTO marketplace_v2.subscriptions(store_id,billing_months,status,starts_at,ends_at) VALUES($1,1,'active',now()-interval '1 day',now()+interval '1 day')",[store.id]);
    await saveShipping(db,store.id,parseShipping({delivery_enabled:true,pickup_enabled:true,delivery_scope:"city",base_price_cents:1000,estimated_days:3,notes:"Retirada: endereço temporário de verificação."}));
  }
  const category=(await client.query<{id:string}>("SELECT id FROM marketplace_v2.categories ORDER BY id LIMIT 1")).rows[0]?.id;
  assert.ok(category,"Category required");
  const productInput=validateProduct({name:"Produto temporário",description:"Produto usado apenas nesta transação de verificação.",category_id:category,price_cents:10000,promotion_price_cents:8000,active:true,stock:5,sku:"VERIFY",brand:"",shipping_mode:"arrange",shipping_price_cents:null,shipping_notes:"",delivery_days:2,weight_grams:null,images:["https://example.invalid/photo.jpg"],variants:[]});
  const first=await saveProduct(db,stores[0].id,null,productInput);
  const second=await saveProduct(db,stores[1].id,null,{...productInput,stock:0,shipping_mode:"fixed",shipping_price_cents:500,variants:[{size:"M",stock:3}]});
  const address={recipient:"Cliente temporário",phone:"11999991234",postal_code:"01001000",street:"Endereço de teste",number:"10",complement:"",district:"Centro",city:"Sao Paulo",state:"SP"};
  const input=parseCheckout({items:[{productId:first.id,size:null,quantity:2},{productId:second.id,size:"M",quantity:1}],address,methods:{}});
  step="delivery quote";
  const quote=await checkoutQuote(db,input);
  assert.ok(quote.canSubmit);assert.equal(quote.subtotal_cents,24000);assert.equal(quote.shipping_cents,1500);assert.equal(quote.total_cents,25500);
  checks.push("two-store promotional prices and freight: R$ 255.00");
  const pickup=await checkoutQuote(db,parseCheckout({...input,methods:{[stores[0].id]:"pickup",[stores[1].id]:"pickup"}}));
  assert.ok(pickup.canSubmit);assert.equal(pickup.shipping_cents,0);
  assert.equal((await checkoutQuote(db,parseCheckout({...input,address:{...address,city:"Campinas"}}))).canSubmit,false);
  checks.push("pickup free; out-of-area delivery blocked");
  step="authorization";
  await assert.rejects(authorizeStore(db,owner.id,stores[1].id));
  checks.push("store ownership isolation");
  step="order reservation and retry";
  const key=randomUUID();
  const saved=await createCheckout(db,buyer,input,key,quote.quoteToken);
  assert.equal(saved.orders.length,2);
  const repeated=await createCheckout(db,buyer,input,key,quote.quoteToken);
  assert.equal(repeated.checkout_id,saved.checkout_id);
  const stock=async()=>({general:(await client!.query<{stock:number}>("SELECT stock FROM marketplace_v2.products WHERE id=$1",[first.id])).rows[0].stock,variant:(await client!.query<{stock:number}>("SELECT stock FROM marketplace_v2.product_variants WHERE product_id=$1",[second.id])).rows[0].stock});
  assert.deepEqual(await stock(),{general:3,variant:2});
  assert.equal((await listOrders(db,buyer.id)).length,2);assert.equal((await listOrders(db,other.id)).length,0);
  checks.push("two orders, stock reserved once on identical retry, buyer isolation");
  step="cancellation";
  await cancelCheckout(db,buyer.id,saved.checkout_id);await cancelCheckout(db,buyer.id,saved.checkout_id);
  assert.deepEqual(await stock(),{general:5,variant:3});
  checks.push("repeated cancellation restores general and variant stock once");
  step="expiration";
  const expiring=await createCheckout(db,buyer,input,randomUUID(),quote.quoteToken);
  await client.query("UPDATE marketplace_v2.checkouts SET expires_at=clock_timestamp()-interval '1 second' WHERE id=$1",[expiring.checkout_id]);
  await releaseExpired(db);await releaseExpired(db);
  assert.deepEqual(await stock(),{general:5,variant:3});
  assert.ok((await listOrders(db,buyer.id,undefined,expiring.checkout_id)).every(order=>order.status==="cancelled"));
  checks.push("expired reservation restores stock once on real PostgreSQL");
  step="rollback and fixture removal";
  await client.query("ROLLBACK");rolledBack=true;
  const leftovers=await client.query<{count:number}>("SELECT count(*)::int AS count FROM marketplace_v2.stores WHERE id=ANY($1::uuid[])",[stores.map(store=>store.id)]);
  assert.equal(leftovers.rows[0].count,0);
  console.log(JSON.stringify({ok:true,checks,rolledBack,testStoresRemaining:0,scope:"Real PostgreSQL transaction; not browser or concurrent-session verification"},null,2));
} catch(error) {
  console.error(JSON.stringify({ok:false,step,errorType:error instanceof Error ? error.name:"Unknown",code:error && typeof error==="object" && "code" in error ? error.code:undefined}));
  process.exitCode=1;
} finally {
  if(client){if(!rolledBack)await client.query("ROLLBACK");client.release();}
  await pool.end();
}
