import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import { PGlite } from "@electric-sql/pglite";
import { parseCheckout, parseShipping } from "@appsoft/domain/checkout";
import { validateProduct } from "@appsoft/domain/products";
import { insertStore } from "../src/stores/repository.ts";
import type { Database } from "../src/stores/repository.ts";
import { authorizeStore, saveProduct } from "../src/products/repository.ts";
import { checkoutQuote, createCheckout, cancelCheckout, listOrders, releaseExpired, saveShipping, shippingSettings } from "../src/checkout/repository.ts";
import { createApp } from "../src/app.ts";
import type { checkoutService } from "../src/checkout/service.ts";

test("checkout: frete por loja, reserva atômica, idempotência, cancelamento e expiração",async t=>{
  const db=new PGlite();t.after(()=>db.close());
  for(const file of ["001_initial.sql","002_store_registration.sql","003_store_admin.sql","004_catalog_filters.sql","005_product_management.sql","006_checkout_shipping.sql"]){
    await db.exec((await readFile(new URL(`../../../database/migrations/${file}`,import.meta.url),"utf8")).replace(/^\uFEFF/,""));
  }
  const adapter=db as unknown as Database;
  const owner={id:"owner-checkout",name:"Ana",email:"ana-checkout@example.test"};
  const buyer={id:"buyer-checkout",name:"Cliente",email:"cliente@example.test"};
  const outsider={id:"outsider-checkout",name:"Outro",email:"outro@example.test"};
  const storeA=await insertStore(adapter,owner,{name:"Loja A",slug:"loja-a",description:"Uma loja para testes de frete.",phone:"11999991234",city:"São Paulo",state:"SP"});
  const storeB=await insertStore(adapter,outsider,{name:"Loja B",slug:"loja-b",description:"Outra loja para testes de frete.",phone:"11999991234",city:"São Paulo",state:"SP"});
  for(const store of [storeA,storeB]){
    await db.query("UPDATE marketplace_v2.stores SET status='approved' WHERE id=$1",[store.id]);
    await db.query("INSERT INTO marketplace_v2.subscriptions(store_id,billing_months,status,starts_at,ends_at) VALUES($1,1,'active',now()-interval '1 day',now()+interval '1 month')",[store.id]);
    await saveShipping(adapter,store.id,parseShipping({delivery_enabled:true,pickup_enabled:true,delivery_scope:"city",base_price_cents:1000,estimated_days:3,notes:"Entrega local e retirada na loja."}));
  }
  const category=(await db.query<{id:string}>("SELECT id FROM marketplace_v2.categories LIMIT 1")).rows[0].id;
  const productInput=validateProduct({name:"Camiseta de algodão",description:"Uma camiseta para testar pedidos.",category_id:category,price_cents:10000,promotion_price_cents:8000,active:true,stock:5,sku:"SKU1",brand:"Local",shipping_mode:"arrange",shipping_price_cents:null,shipping_notes:"Entrega em horário comercial.",delivery_days:2,weight_grams:200,images:["https://example.test/foto.jpg"],variants:[]});
  const a=await saveProduct(adapter,storeA.id,null,productInput);
  const b=await saveProduct(adapter,storeB.id,null,{...productInput,name:"Calça",shipping_mode:"fixed",shipping_price_cents:500,variants:[{size:"M",stock:3}],stock:0});
  const address={recipient:"Cliente Teste",phone:"11999991234",postal_code:"01001-000",street:"Praça da Sé",number:"10",complement:"",district:"Sé",city:"Sao Paulo",state:"SP"};
  const input=parseCheckout({items:[{productId:a.id,size:null,quantity:2},{productId:b.id,size:"M",quantity:1}],address,methods:{}});
  const quote=await checkoutQuote(adapter,input);
  assert.equal(quote.subtotal_cents,24000);assert.equal(quote.shipping_cents,1500);assert.equal(quote.total_cents,25500);assert.ok(quote.canSubmit);
  const outside=parseCheckout({...input,address:{...address,city:"Campinas"}});
  assert.equal((await checkoutQuote(adapter,outside)).canSubmit,false);
  const pickup=parseCheckout({...outside,methods:{[storeA.id]:"pickup",[storeB.id]:"pickup"}});
  assert.equal((await checkoutQuote(adapter,pickup)).shipping_cents,0);assert.ok((await checkoutQuote(adapter,pickup)).canSubmit);
  await assert.rejects(authorizeStore(adapter,owner.id,storeB.id));
  const key=randomUUID();
  const transaction=<T>(work:(connection:Database)=>Promise<T>)=>db.transaction(tx=>work(tx as unknown as Database));
  // Fail on the second store after the first has written its order and debited stock.
  await db.exec(`CREATE FUNCTION marketplace_v2.test_checkout_failure() RETURNS trigger LANGUAGE plpgsql AS $$
    BEGIN IF NEW.store_id='${quote.stores[1].store_id}'::uuid THEN RAISE EXCEPTION 'test atomic rollback'; END IF; RETURN NEW; END; $$;
    CREATE TRIGGER test_checkout_failure BEFORE INSERT ON marketplace_v2.order_items FOR EACH ROW EXECUTE FUNCTION marketplace_v2.test_checkout_failure();`);
  await assert.rejects(transaction(connection=>createCheckout(connection,buyer,input,randomUUID(),quote.quoteToken)),/atomic rollback/);
  assert.equal((await db.query<{count:number}>("SELECT count(*)::int AS count FROM marketplace_v2.checkouts")).rows[0].count,0);
  assert.equal((await db.query<{stock:number}>("SELECT stock FROM marketplace_v2.products WHERE id=$1",[a.id])).rows[0].stock,5);
  assert.equal((await db.query<{stock:number}>("SELECT stock FROM marketplace_v2.product_variants WHERE product_id=$1",[b.id])).rows[0].stock,3);
  await db.exec("DROP TRIGGER test_checkout_failure ON marketplace_v2.order_items; DROP FUNCTION marketplace_v2.test_checkout_failure()");
  const created=await transaction(connection=>createCheckout(connection,buyer,input,key,quote.quoteToken));
  assert.equal(created.orders.length,2);assert.equal(new Set(created.orders.map(o=>o.checkout_id)).size,1);
  assert.equal((await db.query<{stock:number}>("SELECT stock FROM marketplace_v2.products WHERE id=$1",[a.id])).rows[0].stock,3);
  assert.equal((await db.query<{stock:number}>("SELECT stock FROM marketplace_v2.product_variants WHERE product_id=$1",[b.id])).rows[0].stock,2);
  const repeated=await transaction(connection=>createCheckout(connection,buyer,input,key,quote.quoteToken));
  assert.equal(repeated.checkout_id,created.checkout_id);
  assert.equal((await listOrders(adapter,buyer.id)).length,2);assert.equal((await listOrders(adapter,owner.id)).length,0);
  await assert.rejects(transaction(connection=>createCheckout(connection,buyer,pickup,key,quote.quoteToken)),/outros dados/);
  await assert.rejects(transaction(connection=>cancelCheckout(connection,outsider.id,created.checkout_id)),/não encontrada/);
  await assert.rejects(saveProduct(adapter,storeA.id,a.id,productInput),/reservado/);
  await transaction(connection=>cancelCheckout(connection,buyer.id,created.checkout_id));
  await transaction(connection=>cancelCheckout(connection,buyer.id,created.checkout_id));
  assert.equal((await db.query<{stock:number}>("SELECT stock FROM marketplace_v2.products WHERE id=$1",[a.id])).rows[0].stock,5);
  assert.equal((await db.query<{stock:number}>("SELECT stock FROM marketplace_v2.product_variants WHERE product_id=$1",[b.id])).rows[0].stock,3);
  const expires=await transaction(connection=>createCheckout(connection,buyer,input,randomUUID(),quote.quoteToken));
  await db.query("UPDATE marketplace_v2.checkouts SET expires_at=now()-interval '1 second' WHERE id=$1",[expires.checkout_id]);
  await releaseExpired(adapter);await releaseExpired(adapter);
  assert.equal((await listOrders(adapter,buyer.id)).filter(o=>o.checkout_id===expires.checkout_id).every(o=>o.status==="cancelled"),true);
  assert.equal((await db.query<{stock:number}>("SELECT stock FROM marketplace_v2.product_variants WHERE product_id=$1",[b.id])).rows[0].stock,3);
  await saveShipping(adapter,storeA.id,{...(await shippingSettings(adapter,storeA.id)),base_price_cents:1200});
  await assert.rejects(transaction(connection=>createCheckout(connection,buyer,input,randomUUID(),quote.quoteToken)),/mudaram/);
  assert.equal((await db.query<{stock:number}>("SELECT stock FROM marketplace_v2.products WHERE id=$1",[a.id])).rows[0].stock,5);
  // A request based on stock that another buyer consumed cannot reserve it again.
  const lowStock=parseCheckout({...input,items:[{productId:b.id,size:"M",quantity:3}]});
  const lowQuote=await checkoutQuote(adapter,lowStock);
  const last=await transaction(connection=>createCheckout(connection,buyer,lowStock,randomUUID(),lowQuote.quoteToken));
  await assert.rejects(transaction(connection=>createCheckout(connection,outsider,lowStock,randomUUID(),lowQuote.quoteToken)),/estoque|disponibilidade/);
  await transaction(connection=>cancelCheckout(connection,buyer.id,last.checkout_id));

  const service:typeof checkoutService={
    quote:(_user,payload)=>transaction(connection=>checkoutQuote(connection,payload)),
    create:(user,payload,k,token)=>transaction(connection=>createCheckout(connection,user,payload,k,token)),
    orders:user=>listOrders(adapter,user.id),cancel:(user,id)=>transaction(connection=>cancelCheckout(connection,user.id,id)),
    shipping:(user,id,settings)=>transaction(async connection=>{await authorizeStore(connection,user.id,id);return settings ? saveShipping(connection,id,settings) : shippingSettings(connection,id);}),
    storeOrders:(user,id)=>transaction(async connection=>{await authorizeStore(connection,user.id,id);return listOrders(connection,user.id,id);}),
  };
  const server=createServer(createApp({verifyUser:async token=>token==="owner" ? owner : buyer,stores:{list:async()=>[],create:async()=>storeA},checkout:service}));
  await new Promise<void>(resolve=>server.listen(0,"127.0.0.1",resolve));t.after(()=>new Promise<void>(resolve=>server.close(()=>resolve())));
  const base=`http://127.0.0.1:${(server.address() as AddressInfo).port}/api`;
  const headers={"Content-Type":"application/json",Authorization:"Bearer buyer"};
  assert.equal((await fetch(base+"/orders")).status,401);
  assert.equal((await fetch(`${base}/stores/${storeA.id}/shipping`,{headers})).status,404);
  assert.equal((await fetch(`${base}/stores/${storeB.id}/orders`,{headers:{Authorization:"Bearer owner"}})).status,404);
  assert.equal((await fetch(base+"/checkout/quote",{method:"POST",headers,body:JSON.stringify({...input,address:{...address,postal_code:"123"}})})).status,400);
  const fresh=await checkoutQuote(adapter,input);
  const response=await fetch(base+"/checkouts",{method:"POST",headers,body:JSON.stringify({...input,idempotencyKey:randomUUID(),quoteToken:fresh.quoteToken,total_cents:1})});
  assert.equal(response.status,201);const saved=await response.json();
  assert.equal(saved.orders.reduce((sum:number,o:{total_cents:number})=>sum+o.total_cents,0),fresh.total_cents);
});
