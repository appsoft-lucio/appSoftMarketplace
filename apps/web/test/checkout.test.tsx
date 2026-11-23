import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import CheckoutPage from "../src/pages/CheckoutPage";
import { CartProvider, CART_STORAGE_KEY } from "../src/cart/CartProvider";
const fake=vi.hoisted(()=>({quote:vi.fn(),create:vi.fn()}));
vi.mock("../src/auth/AuthProvider",()=>({useAuth:()=>({session:{user:{id:"buyer",user_metadata:{}}}})}));
vi.mock("../src/checkout/service",()=>({checkoutApi:fake}));
vi.mock("../src/components/layout/PublicHeader",()=>({PublicHeader:()=> <header>AppSoft</header>}));
const productId="11111111-1111-1111-1111-111111111111";
const storeId="22222222-2222-2222-2222-222222222222";
const item={productId,size:null,quantity:1};
const quote={stores:[{store_id:storeId,store_name:"Loja Ana",subtotal_cents:10000,shipping_cents:1000,total_cents:11000,method:"delivery",delivery_available:true,pickup_available:true,estimated_days:3,shipping_notes:"Entrega local.",error:null,items:[{...item,name:"Camiseta",unit_price_cents:10000}]}],subtotal_cents:10000,shipping_cents:1000,total_cents:11000,canSubmit:true,quoteToken:"a".repeat(64)};
beforeEach(()=>{
  vi.resetAllMocks();localStorage.clear();sessionStorage.clear();
  localStorage.setItem(CART_STORAGE_KEY,JSON.stringify({version:1,items:[item]}));
  fake.quote.mockResolvedValue(quote);
  fake.create.mockResolvedValue({checkout_id:"checkout",orders:[{id:"order",store_name:"Loja Ana",total_cents:11000,status:"pending_payment",expires_at:"2026-11-23T15:00:00Z"}]});
});
function open(){render(<MemoryRouter><CartProvider><CheckoutPage /></CartProvider></MemoryRouter>);}
async function preview(user:ReturnType<typeof userEvent.setup>){
  await user.type(screen.getByLabelText("Nome do destinatário"),"Cliente Teste");
  await user.type(screen.getByLabelText("Telefone com DDD"),"11999991234");
  await user.type(screen.getByLabelText("CEP"),"01001-000");
  await user.type(screen.getByLabelText("Rua ou avenida"),"Praça da Sé");
  await user.type(screen.getByLabelText("Número"),"10");
  await user.type(screen.getByLabelText("Bairro"),"Centro");
  await user.type(screen.getByLabelText("Cidade"),"São Paulo");
  await user.selectOptions(screen.getByLabelText("Estado"),"SP");
  await user.click(screen.getByRole("button",{name:"Calcular frete e revisar"}));
  await screen.findByRole("heading",{name:"Total da compra"});
}
it("revisa frete, prepara pedidos sem cobrança e remove só os itens comprados",async()=>{
  const user=userEvent.setup();open();await preview(user);
  expect(screen.getByRole("button",{name:/Preparar pedidos/})).toBeEnabled();
  await user.click(screen.getByRole("button",{name:/Preparar pedidos/}));
  expect(await screen.findByRole("heading",{name:"Pedidos preparados"})).toBeVisible();
  expect(fake.create).toHaveBeenCalledOnce();
  expect(JSON.parse(localStorage.getItem(CART_STORAGE_KEY)!).items).toEqual([]);
  expect(sessionStorage.getItem("appsoft.checkout.pending.buyer")).toBeNull();
});
it("reutiliza a mesma chave quando a resposta da criação se perde na conexão",async()=>{
  fake.create.mockRejectedValueOnce(new Error("Falha de conexão"));
  const user=userEvent.setup();open();await preview(user);
  await user.click(screen.getByRole("button",{name:/Preparar pedidos/}));
  await user.click(await screen.findByRole("button",{name:"Conferir e repetir tentativa"}));
  expect(await screen.findByRole("heading",{name:"Pedidos preparados"})).toBeVisible();
  expect(fake.create.mock.calls[0]).toEqual(fake.create.mock.calls[1]);
});
it("exige novo resumo depois de mudar o endereço ou a entrega",async()=>{
  const user=userEvent.setup();open();await preview(user);
  await user.selectOptions(screen.getByLabelText("Entrega de Loja Ana"),"pickup");
  expect(screen.getByRole("button",{name:/Preparar pedidos/})).toBeDisabled();
  await user.click(screen.getByRole("button",{name:"Atualizar resumo"}));
  expect(fake.quote.mock.calls[1][0].methods[storeId]).toBe("pickup");
  await user.type(screen.getByLabelText("Cidade")," Outra");
  expect(screen.getByRole("button",{name:/Preparar pedidos/})).toBeDisabled();
});
