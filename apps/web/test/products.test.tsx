import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, expect, it, vi } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import ProductsPage from "../src/pages/ProductsPage";
const fake = vi.hoisted(() => ({ request: vi.fn() }));
vi.mock("../src/auth/AuthProvider", () => ({ useAuth: () => ({ session: { user: { id: "owner" } } }) }));
vi.mock("../src/stores/service", () => ({ request: fake.request }));
vi.mock("../src/stores/components/StoreLayout", () => ({ StoreLayout: ({ children }: {children: React.ReactNode}) => <main>{children}</main> }));
const category = "11111111-1111-1111-1111-111111111111";
const product = { id:"22222222-2222-2222-2222-222222222222", store_id:"store", name:"Vestido floral", description:"Vestido de algodão com forro.", category_id:category, price_cents:10000, promotion_price_cents:8000, active:true, stock:2, sku:"V001", brand:"Local", shipping_mode:"fixed", shipping_price_cents:1500, shipping_notes:"Entrega local.", delivery_days:3, weight_grams:300, images:["https://example.test/foto.jpg"], variants:[] };
beforeEach(()=>{ vi.resetAllMocks(); fake.request.mockImplementation((_path:string, options?:RequestInit)=>Promise.resolve(options?.method ? {product} : {products:[product],categories:[{id:category,name:"Moda",parent_id:null,slug:"moda"}]})); });
function open() { render(<MemoryRouter initialEntries={["/minhas-lojas/store/produtos"]}><Routes><Route path="/minhas-lojas/:storeId/produtos" element={<ProductsPage />} /></Routes></MemoryRouter>); }
it("edita produto e encerra promoção mantendo frete e fotos", async()=>{
  const user=userEvent.setup(); open();
  await user.click(await screen.findByRole("button",{name:"Editar Vestido floral"}));
  await user.clear(screen.getByLabelText(/Preço promocional/));
  await user.clear(screen.getByLabelText("Nome do produto"));
  await user.type(screen.getByLabelText("Nome do produto"),"Vestido atualizado");
  await user.click(screen.getByRole("button",{name:"Salvar produto"}));
  expect(await screen.findByRole("status")).toHaveTextContent("Produto salvo com sucesso");
  const call=fake.request.mock.calls.find(([,options])=>options?.method==="PUT");
  expect(call?.[0]).toBe(`/api/stores/store/products/${product.id}`);
  expect(JSON.parse(call?.[1].body)).toMatchObject({name:"Vestido atualizado",promotion_price_cents:null,shipping_price_cents:1500,images:product.images});
});
it("mantém o formulário e os dados quando a API rejeita a gravação",async()=>{
  const user=userEvent.setup(); open();
  await user.click(await screen.findByRole("button",{name:"Editar Vestido floral"}));
  fake.request.mockRejectedValueOnce(new Error("Limite de 50 produtos ativos atingido."));
  await user.click(screen.getByRole("button",{name:"Salvar produto"}));
  expect(await screen.findByRole("alert")).toHaveTextContent("Limite de 50");
  expect(screen.getByLabelText("Nome do produto")).toHaveValue("Vestido floral");
});
it("bloqueia acesso quando a API recusa a loja",async()=>{
  fake.request.mockRejectedValueOnce(new Error("Loja não encontrada ou sem permissão.")); open();
  expect(await screen.findByRole("alert")).toHaveTextContent("sem permissão");
  expect(screen.getByRole("button",{name:"Cadastrar produto"})).toBeDisabled();
});
