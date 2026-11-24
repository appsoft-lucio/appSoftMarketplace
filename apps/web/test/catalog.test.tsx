import { AppearanceProvider } from "../src/appearance/AppearanceProvider";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { CartProvider } from "../src/cart/CartProvider";
import CatalogPage from "../src/pages/CatalogPage";
import App from "../src/App";
const fake = vi.hoisted(() => ({ load: vi.fn() }));
vi.mock("../src/auth/AuthProvider", () => ({ useAuth: () => ({ session: null }) }));
vi.mock("../src/catalog/service", () => ({ loadCatalog: fake.load }));
const category = "00000000-0000-4000-8000-000000000001";
const subcategory = "00000000-0000-4000-8000-000000000002";
const shop = "00000000-0000-4000-8000-000000000003";
const result = { categories: [{ id: category, name: "Moda", parent_id: null }, { id: subcategory, name: "Vestidos", parent_id: category }], stores: [{ id: shop, name: "Loja Ana" }], sizes: ["P", "M"], products: [{ id: "product-1", name: "Vestido floral", description: "Vestido de algodão", store_name: "Loja Ana", price_cents: 12990, image_url: null, sizes: ["P"] }], total: 1, page: 1, pageSize: 24 };
beforeEach(() => {
  vi.resetAllMocks(); fake.load.mockResolvedValue(result);
  HTMLDialogElement.prototype.showModal = function () { this.setAttribute("open", ""); };
  HTMLDialogElement.prototype.close = function () { this.removeAttribute("open"); };
});
function open(query = "") { render(<MemoryRouter initialEntries={[`/catalogo${query}`]}><AppearanceProvider><CartProvider><CatalogPage /></CartProvider></AppearanceProvider></MemoryRouter>); }
function lastParams() { return fake.load.mock.calls.at(-1)![0] as URLSearchParams; }
it("abre a vitrine na home sem conta e o logo retorna à home", async () => {
  const user = userEvent.setup();
  render(<MemoryRouter initialEntries={["/"]}><App /></MemoryRouter>);
  expect(await screen.findByRole("heading", { name: "Vestido floral" })).toBeVisible();
  expect(screen.getByLabelText("Buscar produtos")).toBeVisible();
  expect(screen.getByRole("link", { name: "Já tenho conta" })).toHaveAttribute("href", "/login");
  expect(screen.getByRole("link", { name: "Cadastrar" })).toHaveAttribute("href", "/cadastro");
  expect(screen.queryByText("Um marketplace.")).not.toBeInTheDocument();
  await user.click(screen.getByRole("link", { name: "AppSoft, início" }));
  expect(screen.getByRole("heading", { name: "Vestido floral" })).toBeVisible();
  expect(document.title).toBe("AppSoft Marketplace");
});
it("expande subcategorias e combina categoria, tamanho e loja na URL", async () => {
  const user = userEvent.setup(); open();
  await screen.findByRole("heading", { name: "Vestido floral" });
  const filters = within(screen.getByRole("complementary"));
  await user.click(filters.getByRole("button", { name: "Expandir Moda" }));
  await user.click(filters.getByRole("button", { name: "Vestidos" }));
  await user.click(filters.getByLabelText("P", { exact: true }));
  await user.click(filters.getByLabelText("Loja Ana"));
  await waitFor(() => { expect(lastParams().get("category")).toBe(subcategory); expect(lastParams().getAll("size")).toEqual(["P"]); expect(lastParams().getAll("store")).toEqual([shop]); });
  await user.click(screen.getByRole("button", { name: "Remover Tamanho P" }));
  await waitFor(() => { expect(lastParams().has("size")).toBe(false); expect(lastParams().get("category")).toBe(subcategory); });
});
it("valida preço mínimo e máximo antes de enviar", async () => {
  const user = userEvent.setup(); open(); await screen.findByRole("heading", { name: "Vestido floral" });
  const filters = within(screen.getByRole("complementary"));
  await user.type(filters.getByLabelText("Mínimo (R$)"), "200");
  await user.type(filters.getByLabelText("Máximo (R$)"), "100");
  await user.click(filters.getByRole("button", { name: "Aplicar preço" }));
  expect(await filters.findByRole("alert")).toHaveTextContent("mínimo não pode");
  expect(fake.load).toHaveBeenCalledTimes(1);
});
it("preserva filtros ao recarregar e ordena sem apagar a seleção", async () => {
  const user = userEvent.setup(); open(`?category=${subcategory}&size=P&min=50`);
  await screen.findByRole("heading", { name: "Vestido floral" });
  await user.selectOptions(screen.getByLabelText("Ordenar por"), "price_asc");
  await waitFor(() => { expect(lastParams().get("sort")).toBe("price_asc"); expect(lastParams().get("min")).toBe("50"); expect(lastParams().get("category")).toBe(subcategory); });
});
it("painel móvel aplica filtros e retorna aos resultados", async () => {
  const user = userEvent.setup(); open(); await screen.findByRole("heading", { name: "Vestido floral" });
  await user.click(screen.getByRole("button", { name: "Categorias e filtros" }));
  const panel = within(screen.getByRole("dialog", { name: "Refine sua busca" }));
  await user.click(panel.getByLabelText("M", { exact: true }));
  await user.click(panel.getByRole("button", { name: "Ver resultados" }));
  await waitFor(() => expect(lastParams().getAll("size")).toEqual(["M"]));
  expect(screen.queryByRole("dialog", { name: "Refine sua busca" })).not.toBeInTheDocument();
});
it("distingue catálogo vazio de falha no carregamento", async () => {
  fake.load.mockRejectedValue(new Error("Catálogo indisponível")); open();
  expect(await screen.findByRole("alert")).toHaveTextContent("Catálogo indisponível");
  expect(screen.queryByText("As novidades estão chegando")).not.toBeInTheDocument();
});

afterEach(() => { vi.unstubAllGlobals(); delete document.documentElement.dataset.theme; });
it("mostra a campanha de Natal e aplica o orçamento ao catálogo", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({ theme: "christmas" }) }));
  const user = userEvent.setup();
  render(<MemoryRouter initialEntries={["/"]}><App /></MemoryRouter>);
  expect(await screen.findByRole("heading", { name: /Mais carinho em cada presente/ })).toBeVisible();
  expect(screen.getByRole("link", { name: /Explorar presentes/ })).toHaveAttribute("href", "#catalog-products");
  await user.click(screen.getByRole("link", { name: "Até R$ 50" }));
  await waitFor(() => {
    expect(lastParams().get("max")).toBe("50");
    expect(lastParams().get("sort")).toBe("price_asc");
  });
  await user.click(screen.getByRole("link", { name: "Até R$ 100" }));
  await waitFor(() => expect(lastParams().get("max")).toBe("100"));
  for (const limit of [300, 500]) {
    await user.click(screen.getByRole("link", { name: `Até R$ ${limit}` }));
    await waitFor(() => expect(lastParams().get("max")).toBe(String(limit)));
  }
});
it("não mostra a campanha natalina no tema de Ano Novo", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({ theme: "new-year" }) }));
  render(<MemoryRouter><App /></MemoryRouter>);
  await screen.findByText(/Novos começos/);
  expect(screen.queryByRole("heading", { name: /Mais carinho em cada presente/ })).not.toBeInTheDocument();
  expect(screen.getByRole("heading", { name: "Encontre o que combina com você." })).toBeVisible();
});