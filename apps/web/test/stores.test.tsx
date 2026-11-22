import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, expect, it, vi } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { MyStoresPage, StoreRegistrationPage } from "../src/pages/StorePages";
const fake = vi.hoisted(() => ({ session: true, create: vi.fn(), list: vi.fn() }));
vi.mock("../src/auth/AuthProvider", () => ({ useAuth: () => ({ session: fake.session ? { user: { id: "owner" } } : null }) }));
vi.mock("../src/stores/service", () => ({ storesService: { create: fake.create, list: fake.list } }));
const store = { id: "store-1", name: "Minha Loja", slug: "minha-loja", description: "Produtos locais para toda a família.", phone: "11999991234", city: "São Paulo", state: "SP", status: "pending" };
function open(path = "/lojas/nova") {
  render(<MemoryRouter initialEntries={[path]}><Routes><Route path="/lojas/nova" element={<StoreRegistrationPage />} /><Route path="/lojas" element={<MyStoresPage />} /><Route path="/login" element={<h1>Entrar na conta</h1>} /></Routes></MemoryRouter>);
}
beforeEach(() => { vi.resetAllMocks(); fake.session = true; fake.create.mockResolvedValue({ store }); fake.list.mockResolvedValue({ stores: [store] }); });
async function fill() {
  const user = userEvent.setup();
  await user.type(screen.getByLabelText("Nome da loja"), "Minha Loja");
  await user.type(screen.getByLabelText("Sobre a loja"), store.description);
  await user.type(screen.getByLabelText(/Telefone comercial/), "11999991234");
  await user.type(screen.getByLabelText("Cidade"), "São Paulo");
  await user.selectOptions(screen.getByLabelText("Estado"), "SP");
  return user;
}
it("cadastro gera slug, envia dados comerciais e mostra loja aguardando aprovação", async () => {
  open(); const user = await fill();
  expect(screen.getByLabelText("Endereço da loja")).toHaveValue("minha-loja");
  await user.click(screen.getByRole("button", { name: "Enviar para análise" }));
  expect(await screen.findByText("Aguardando aprovação")).toBeVisible();
  expect(fake.create).toHaveBeenCalledWith({ name: "Minha Loja", slug: "minha-loja", description: store.description, phone: "11999991234", city: "São Paulo", state: "SP" });
});
it("erro de slug duplicado mantém os campos para correção", async () => {
  fake.create.mockRejectedValue(new Error("Esse endereço de loja já está em uso. Escolha outro."));
  open(); const user = await fill();
  await user.click(screen.getByRole("button", { name: "Enviar para análise" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("já está em uso");
  expect(screen.getByLabelText("Nome da loja")).toHaveValue("Minha Loja");
});
it("não abre o cadastro sem autenticação", () => {
  fake.session = false; open(); expect(screen.getByRole("heading", { name: "Entrar na conta" })).toBeVisible();
});
it("não apresenta falha de consulta como lista vazia", async () => {
  fake.list.mockRejectedValue(new Error("Serviço indisponível")); open("/lojas");
  expect(await screen.findByRole("alert")).toHaveTextContent("Serviço indisponível");
  expect(screen.queryByText("Sua primeira loja começa aqui")).not.toBeInTheDocument();
});