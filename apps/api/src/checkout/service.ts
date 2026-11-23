import type { CheckoutInput, ShippingSettings } from "@appsoft/domain/checkout";
import type { Identity } from "../auth.ts";
import { getPool } from "../database.ts";
import type { Database } from "../stores/repository.ts";
import { authorizeStore } from "../products/repository.ts";
import { cancelCheckout, checkoutQuote, createCheckout, listOrders, releaseExpired, saveShipping, shippingSettings } from "./repository.ts";

async function transaction<T>(work:(db:Database)=>Promise<T>):Promise<T> {
  const client=await getPool().connect();
  try { await client.query("BEGIN"); const db=client as unknown as Database; await releaseExpired(db); const result=await work(db); await client.query("COMMIT"); return result; }
  catch(error) { await client.query("ROLLBACK"); throw error; } finally {client.release();}
}
export const checkoutService={
  quote: (_user:Identity,input:CheckoutInput)=>transaction(db=>checkoutQuote(db,input)),
  create: (user:Identity,input:CheckoutInput,key:string,quoteToken:string)=>transaction(db=>createCheckout(db,user,input,key,quoteToken)),
  orders: (user:Identity)=>transaction(db=>listOrders(db,user.id)),
  cancel: (user:Identity,id:string)=>transaction(db=>cancelCheckout(db,user.id,id)),
  shipping: (user:Identity,storeId:string,input?:ShippingSettings)=>transaction(async db=>{await authorizeStore(db,user.id,storeId);return input ? saveShipping(db,storeId,input) : shippingSettings(db,storeId);}),
  storeOrders: (user:Identity,storeId:string)=>transaction(async db=>{await authorizeStore(db,user.id,storeId);return listOrders(db,user.id,storeId);}),
};
