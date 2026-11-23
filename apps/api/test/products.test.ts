import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import { validateProduct } from "@appsoft/domain/products";
import { authorizeStore, listProducts, saveProduct } from "../src/products/repository.ts";
import { insertStore } from "../src/stores/repository.ts";
import type { Database } from "../src/stores/repository.ts";
import { catalog } from "../src/catalog/repository.ts";
import { parseCatalogQuery } from "@appsoft/domain/catalog";
import { cartQuote } from "../src/public/repository.ts";
import { publicProducts } from "../src/public/repository.ts";
import { publicImage } from "../src/public/images.ts";
import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import { createApp } from "../src/app.ts";

test("produtos: autorização, edição, promoção, variações e limite do plano", async t => {
  const db = new PGlite(); t.after(() => db.close());
  for (const name of ["001_initial.sql", "002_store_registration.sql", "003_store_admin.sql", "004_catalog_filters.sql", "005_product_management.sql"]) {
    await db.exec((await readFile(new URL(`../../../database/migrations/${name}`, import.meta.url), "utf8")).replace(/^\uFEFF/, ""));
  }
  const adapter = db as unknown as Database;
  const owner = { id: "product-owner", name: "Ana", email: "ana@example.test" };
  const store = await insertStore(adapter, owner, { name: "Loja Ana", slug: "loja-ana", description: "Produtos para os testes do painel.", phone: "11999991234", city: "São Paulo", state: "SP" });
  const otherStore = await insertStore(adapter, { ...owner, id: "other", email: "other@example.test" }, { name: "Outra loja", slug: "outra-loja", description: "Uma outra loja para teste de isolamento.", phone: "11999991234", city: "São Paulo", state: "SP" });
  await authorizeStore(adapter, owner.id, store.id);
  await assert.rejects(authorizeStore(adapter, owner.id, otherStore.id), /permissão/);
  const category = (await db.query<{id:string}>("SELECT id FROM marketplace_v2.categories WHERE slug='vestidos'")).rows[0].id;
  const input = validateProduct({ name: "Vestido de algodão", description: "Vestido leve de algodão com forro.", category_id: category, price_cents: 10000, promotion_price_cents: 8000, active: true, stock: 0, sku: "V001", brand: "Local", shipping_mode: "fixed", shipping_price_cents: 1500, shipping_notes: "Entrega na cidade.", delivery_days: 3, weight_grams: 300, images: ["https://example.test/foto.jpg"], variants: [{size:"P",stock:3},{size:"G",stock:0}] });
  assert.throws(() => validateProduct({...input,promotion_price_cents:10000}), /promocional/);
  assert.throws(() => validateProduct({...input,images:[]}), /foto/);
  assert.throws(() => validateProduct({...input,variants:[{size:"P",stock:1},{size:"p",stock:1}]}), /repetidas/);
  assert.throws(() => validateProduct({...input,shipping_price_cents:-1}), /Frete/);
  assert.throws(() => validateProduct({...input,images:["javascript:alert(1)"]}), /HTTPS/);
  assert.throws(() => validateProduct({...input,images:["data:image/jpeg;base64,garbage"]}), /JPEG/);
  const created = await saveProduct(adapter,store.id,null,input);
  assert.equal((await listProducts(adapter,store.id))[0].images[0],input.images[0]);
  await assert.rejects(saveProduct(adapter,otherStore.id,created.id,input), /nesta loja/);
  await db.query("UPDATE marketplace_v2.stores SET status='approved' WHERE id=$1",[store.id]);
  await db.query("INSERT INTO marketplace_v2.subscriptions (store_id,billing_months,status,starts_at,ends_at) VALUES ($1,1,'active',now()-interval '1 day',now()+interval '1 month')",[store.id]);
  assert.equal((await catalog(adapter,parseCatalogQuery(new URLSearchParams("min=80&max=80")))).total,1);
  assert.equal((await cartQuote(adapter,[{productId:created.id,size:"P",quantity:2}])).subtotalCents,16000);
  await saveProduct(adapter,store.id,created.id,{...input,promotion_price_cents:null,variants:[],stock:5,images:["https://example.test/new.jpg"]});
  const edited=(await listProducts(adapter,store.id))[0];
  assert.deepEqual(edited.variants,[]); assert.equal(edited.stock,5); assert.equal(edited.images.length,1);
  assert.equal((await cartQuote(adapter,[{productId:created.id,size:null,quantity:2}])).subtotalCents,20000);
  await db.query("INSERT INTO marketplace_v2.products (store_id,name,price_cents,stock,active) SELECT $1,'Produto '||n,100,1,true FROM generate_series(1,49) n",[store.id]);
  await assert.rejects(saveProduct(adapter,store.id,null,input), /Limite de produtos ativos/);
  const draft=await saveProduct(adapter,store.id,null,{...input,active:false});
  assert.equal(draft.active,false);
  const jpeg=Buffer.concat([Buffer.from([0xff,0xd8,0xff]),Buffer.alloc(15000)]);
  const uploaded=`data:image/jpeg;base64,${jpeg.toString("base64")}`;
  await db.query("UPDATE marketplace_v2.product_images SET url=$1 WHERE product_id=$2",[uploaded,created.id]);
  const imageId=(await db.query<{id:string}>("SELECT id FROM marketplace_v2.product_images WHERE product_id=$1",[created.id])).rows[0].id;
  const publicProduct=(await publicProducts(adapter,[created.id]))[0];
  assert.equal(publicProduct.image_url,`/api/public/images/${imageId}`);
  assert.equal(publicProduct.images?.[0],publicProduct.image_url);
  assert.ok(!JSON.stringify(publicProduct).includes("base64"));
  assert.deepEqual((await cartQuote(adapter,[{productId:created.id,size:null,quantity:1}])).items[0].product?.images,[]);
  const catalogData=await catalog(adapter,parseCatalogQuery(new URLSearchParams()));
  assert.ok(!JSON.stringify(catalogData).includes("base64"));
  assert.deepEqual((await publicImage(adapter,imageId))?.data,jpeg);
  const server = createServer(createApp({
    verifyUser: async () => owner,
    stores: { list: async () => [], create: async () => store },
    image: id=>publicImage(adapter,id),
    products: { execute: (user,storeId,payload,id=null) => db.transaction(async tx => {
      const connection=tx as unknown as Database;
      await authorizeStore(connection,user.id,storeId);
      return payload ? {product:await saveProduct(connection,storeId,id,payload)} : {products:await listProducts(connection,storeId),categories:[]};
    }) },
  }));
  await new Promise<void>(resolve=>server.listen(0,"127.0.0.1",resolve));
  t.after(()=>new Promise<void>(resolve=>server.close(()=>resolve())));
  const base=`http://127.0.0.1:${(server.address() as AddressInfo).port}/api/stores`;
  const headers={"Content-Type":"application/json",Authorization:"Bearer owner"};
  const imageUrl=base.replace("/api/stores",`/api/public/images/${imageId}`);
  const imageResponse=await fetch(imageUrl);
  assert.equal(imageResponse.status,200);
  assert.equal(imageResponse.headers.get("content-type"),"image/jpeg");
  assert.match(imageResponse.headers.get("cache-control") || "",/max-age=3600/);
  assert.deepEqual(Buffer.from(await imageResponse.arrayBuffer()),jpeg);
  const cached=await fetch(imageUrl,{headers:{"If-None-Match":imageResponse.headers.get("etag")!}});
  assert.equal(cached.status,304);
  const head=await fetch(imageUrl,{method:"HEAD"});
  assert.equal(head.status,200); assert.equal((await head.arrayBuffer()).byteLength,0);
  await db.query("UPDATE marketplace_v2.products SET active=false WHERE id=$1",[created.id]);
  assert.equal((await fetch(imageUrl)).status,404);
  await db.query("UPDATE marketplace_v2.products SET active=true WHERE id=$1",[created.id]);
  assert.equal((await fetch(`${base}/${store.id}/products`)).status,401);
  assert.equal((await fetch(`${base}/${otherStore.id}/products`,{headers})).status,404);
  assert.equal((await fetch(`${base}/${store.id}/products/${created.id}`,{method:"DELETE",headers})).status,405);
  // A large draft proves the product body limit supports uploads, beyond 8 KB.
  const longInput={...input,active:false,description:"a".repeat(6000),shipping_notes:"b".repeat(1000),images:Array.from({length:8},(_,i)=>`https://example.test/${i}/${"x".repeat(500)}.jpg`)};
  const response=await fetch(`${base}/${store.id}/products`,{method:"POST",headers,body:JSON.stringify(longInput)});
  assert.equal(response.status,201);
  assert.equal((await response.json()).product.description.length,6000);
  assert.equal((await fetch(`${base}/${store.id}/products`,{method:"POST",headers,body:JSON.stringify({...input,promotion_price_cents:10001})})).status,400);
});
