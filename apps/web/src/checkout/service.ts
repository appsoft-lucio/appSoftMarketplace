import type { CheckoutInput, CheckoutQuote, SavedOrder, ShippingSettings } from "@appsoft/domain/checkout";
import { request } from "../stores/service";
export const checkoutApi={
  quote:(input:CheckoutInput,signal?:AbortSignal)=>request<CheckoutQuote>("/api/checkout/quote",{method:"POST",body:JSON.stringify(input),signal}),
  create:(input:CheckoutInput,idempotencyKey:string,quoteToken:string)=>request<{checkout_id:string;orders:SavedOrder[]}>("/api/checkouts",{method:"POST",body:JSON.stringify({...input,idempotencyKey,quoteToken})}),
  orders:(storeId?:string,signal?:AbortSignal)=>request<{orders:SavedOrder[];asaasSandbox?:boolean}>(storeId ? `/api/stores/${storeId}/orders` : "/api/orders",{signal}),
  payAsaas:(id:string)=>request<{url:string}>(`/api/checkouts/${id}/asaas`,{method:"POST"}),
  cancel:(id:string)=>request("/api/checkouts/"+id+"/cancel",{method:"POST"}),
  shipping:(storeId:string,signal?:AbortSignal)=>request<{shipping:ShippingSettings}>(`/api/stores/${storeId}/shipping`,{signal}),
  saveShipping:(storeId:string,shipping:ShippingSettings)=>request<{shipping:ShippingSettings}>(`/api/stores/${storeId}/shipping`,{method:"PUT",body:JSON.stringify(shipping)}),
};
