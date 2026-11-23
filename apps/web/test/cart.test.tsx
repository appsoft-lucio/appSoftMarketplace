import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, expect, it, vi } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { CartProvider, CART_STORAGE_KEY } from "../src/cart/CartProvider";
import { PublicProductPage } from "../src/pages/PublicProductPage";
import CartPage from "../src/pages/CartPage";
const fake = vi.hoisted(() => ({ product: vi.fn(), quote: vi.fn() }));
vi.mock("../src/auth/AuthProvider", () => ({ useAuth: () => ({ session: null }) }));
vi.mock("../src/cart/service", () => ({ publicApi: { product: fake.product, quote: fake.quote } }));
const id = "00000000-0000-4000-8000-000000000001";
const product = { id, name: "Camiseta", description: "Algodão", store_id: "store-1", store_name: "Loja Ana", store_slug: "loja-ana", price_cents: 5990, stock: 0, image_url: null, sizes: ["P"], variants: [{ size: "P", stock: 2 }, { size: "M", stock: 0 }] };
beforeEach(() => {
  vi.resetAllMocks(); localStorage.clear();
  fake.product.mockResolvedValue({ product });
  fake.quote.mockImplementation(async items => ({ items: items.map((item: { productId: string; size: string; quantity: number }) => ({ ...item, product, error: null, maxQuantity: 2, lineTotalCents: product.price_cents * item.quantity })), subtotalCents: items.reduce((sum: number, item: { quantity: number }) => sum + product.price_cents * item.quantity, 0), hasIssues: false }));
});
function open(path = `/produto/${id}`) {
  return render(<MemoryRouter initialEntries={[path]}><CartProvider><Routes><Route path="/produto/:id" element={<PublicProductPage />} /><Route path="/carrinho" element={<CartPage />} /></Routes></CartProvider></MemoryRouter>);
}
it("visitante escolhe tamanho e adiciona sem login, respeitando estoque", async () => {
  const user = userEvent.setup(); open();
  expect(await screen.findByRole("button", { name: "Adicionar ao carrinho" })).toBeDisabled();
  await user.selectOptions(screen.getByLabelText("Tamanho"), "P");
  await user.click(screen.getByRole("button", { name: "Adicionar ao carrinho" }));
  await user.click(screen.getByRole("link", { name: "Ver carrinho" }));
  expect(await screen.findByRole("heading", { name: "Camiseta" })).toBeVisible();
  expect(screen.getByRole("link", { name: "Entrar para continuar" })).toHaveAttribute("href", "/login?next=/finalizar-compra");
  await user.click(screen.getByRole("button", { name: "Aumentar Camiseta, tamanho P" }));
  expect(await screen.findByRole("button", { name: "Aumentar Camiseta, tamanho P" })).toBeDisabled();
  const stored = JSON.parse(localStorage.getItem(CART_STORAGE_KEY)!);
  expect(stored.items).toEqual([{ productId: id, size: "P", quantity: 2 }]);
});
it("carrinho continua disponível após recarregar e permite remover", async () => {
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify({ version: 1, items: [{ productId: id, size: "P", quantity: 1 }] }));
  const user = userEvent.setup(); open("/carrinho");
  await user.click(await screen.findByRole("button", { name: "Remover Camiseta, tamanho P" }));
  expect(await screen.findByRole("heading", { name: "Seu carrinho está vazio" })).toBeVisible();
  expect(JSON.parse(localStorage.getItem(CART_STORAGE_KEY)!).items).toEqual([]);
});
it("produto indisponível é indicado e impede continuar", async () => {
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify({ version: 1, items: [{ productId: id, size: "P", quantity: 1 }] }));
  fake.quote.mockResolvedValue({ items: [{ productId: id, size: "P", quantity: 1, product: null, error: "Produto indisponível", maxQuantity: 0, lineTotalCents: null }], subtotalCents: 0, hasIssues: true });
  open("/carrinho"); expect(await screen.findByRole("alert")).toHaveTextContent("Produto indisponível");
  expect(screen.queryByRole("link", { name: "Entrar para continuar" })).not.toBeInTheDocument();
});
