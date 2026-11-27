import { cartKey, parseCart } from "./cart.js";
import type { CartItem } from "./cart.js";
import { BRAZIL_STATES } from "./stores.js";
import { productUuid } from "./products.js";

export interface DeliveryAddress {
  recipient: string; phone: string; postal_code: string; street: string; number: string;
  complement: string; district: string; city: string; state: string;
}
export interface ShippingSettings {
  delivery_enabled: boolean; pickup_enabled: boolean; delivery_scope: "city" | "state" | "country";
  base_price_cents: number; estimated_days: number; notes: string;
}
export const defaultShipping: ShippingSettings = { delivery_enabled:false, pickup_enabled:false, delivery_scope:"city", base_price_cents:0, estimated_days:3, notes:"" };
export type DeliveryMethod = "delivery" | "pickup";
export interface CheckoutInput { items: CartItem[]; address: DeliveryAddress; methods: Record<string, DeliveryMethod> }
export interface CheckoutLine { productId:string; name:string; size:string|null; quantity:number; unit_price_cents:number }
export interface CheckoutStore {
  store_id:string; store_name:string; subtotal_cents:number; shipping_cents:number; total_cents:number;
  method:DeliveryMethod; delivery_available:boolean; pickup_available:boolean; estimated_days:number;
  shipping_notes:string; error:string|null; items:CheckoutLine[];
}
export interface CheckoutQuote { stores:CheckoutStore[]; subtotal_cents:number; shipping_cents:number; total_cents:number; canSubmit:boolean; quoteToken:string }
export interface SavedOrder {
  id:string; checkout_id:string; store_id:string; store_name:string; status:string;
  subtotal_cents:number; shipping_cents:number; total_cents:number; delivery_address:DeliveryAddress;
  shipping_name:string; estimated_days:number; shipping_notes:string; created_at:string; expires_at:string;
  items:CheckoutLine[];
  asaas_status?: "creating" | "active" | "paid" | "closed" | "review" | null;
}
function record(raw:unknown): Record<string,unknown> {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) throw new Error("Dados inválidos.");
  return raw as Record<string,unknown>;
}
export function parseCheckout(raw:unknown):CheckoutInput {
  const input=record(raw); const address=record(input.address);
  const text=(key:string,min:number,max:number)=>{
    if (typeof address[key] !== "string") throw new Error("Preencha o endereço completo.");
    const value=(address[key] as string).trim();
    if (value.length<min || value.length>max) throw new Error(`Confira o campo ${key} do endereço.`);
    return value;
  };
  const state=text("state",2,2).toUpperCase();
  if (!(BRAZIL_STATES as readonly string[]).includes(state)) throw new Error("Selecione um estado válido.");
  const postal_code=text("postal_code",8,9).replace(/\D/g,"");
  if (!/^\d{8}$/.test(postal_code)) throw new Error("Informe um CEP com oito números.");
  const phone=text("phone",10,20).replace(/\D/g,"");
  if (!/^\d{10,11}$/.test(phone)) throw new Error("Informe um telefone com DDD.");
  const items=parseCart(input.items).sort((a,b)=>cartKey(a).localeCompare(cartKey(b)));
  if (!items.length) throw new Error("O carrinho está vazio.");
  const rawMethods=record(input.methods); const methods:Record<string,DeliveryMethod>={};
  if (Object.keys(rawMethods).length>50) throw new Error("Opções de entrega inválidas.");
  for (const key of Object.keys(rawMethods).sort()) {
    if (!productUuid.test(key) || !["delivery","pickup"].includes(String(rawMethods[key]))) throw new Error("Opção de entrega inválida.");
    methods[key]=rawMethods[key] as DeliveryMethod;
  }
  return {items,methods,address:{recipient:text("recipient",3,120),phone,postal_code,street:text("street",3,160),number:text("number",1,20),complement:text("complement",0,100),district:text("district",2,100),city:text("city",2,100),state}};
}
export function parseShipping(raw:unknown):ShippingSettings {
  const v=record(raw);
  if (typeof v.delivery_enabled !== "boolean" || typeof v.pickup_enabled !== "boolean" || !["city","state","country"].includes(String(v.delivery_scope))) throw new Error("Configuração de entrega inválida.");
  if (!Number.isInteger(v.base_price_cents) || Number(v.base_price_cents)<0 || Number(v.base_price_cents)>10000000) throw new Error("Valor do frete inválido.");
  if (!Number.isInteger(v.estimated_days) || Number(v.estimated_days)<0 || Number(v.estimated_days)>365) throw new Error("Prazo inválido.");
  if (typeof v.notes !== "string" || v.notes.trim().length>1000) throw new Error("As condições devem ter até 1000 caracteres.");
  if (v.pickup_enabled && v.notes.trim().length<10) throw new Error("Informe o endereço e as condições para retirada nas observações.");
  return {delivery_enabled:v.delivery_enabled,pickup_enabled:v.pickup_enabled,delivery_scope:v.delivery_scope as ShippingSettings["delivery_scope"],base_price_cents:Number(v.base_price_cents),estimated_days:Number(v.estimated_days),notes:v.notes.trim()};
}
