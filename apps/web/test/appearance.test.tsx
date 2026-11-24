import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { AdminAppearance } from "../src/appearance/AdminAppearance";
import { AppearanceProvider } from "../src/appearance/AppearanceProvider";
const fake = vi.hoisted(() => ({ request: vi.fn() }));
vi.mock("../src/stores/service", () => ({ request: fake.request }));
beforeEach(() => {
  vi.resetAllMocks();
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({ theme: "original" }) }));
  fake.request.mockResolvedValue({ theme: "original" });
});
afterEach(() => {
  vi.unstubAllGlobals();
  delete document.documentElement.dataset.theme;
});
const open = () => render(<AppearanceProvider><AdminAppearance /></AppearanceProvider>);
it("salva o tema global, altera o visual e permite voltar ao original", async () => {
  const user = userEvent.setup(); open();
  const christmas = await screen.findByRole("radio", { name: "Natal" });
  await user.click(christmas);
  expect(document.documentElement.dataset.theme).toBe("original");
  fake.request.mockResolvedValueOnce({ theme: "christmas" });
  await user.click(screen.getByRole("button", { name: "Aplicar tema" }));
  expect(await screen.findByRole("status")).toHaveTextContent("Tema Natal aplicado");
  expect(document.documentElement.dataset.theme).toBe("christmas");
  expect(fake.request).toHaveBeenLastCalledWith("/api/admin/appearance", { method: "PUT", body: '{"theme":"christmas"}' });
  await user.click(screen.getByRole("radio", { name: "Original" }));
  fake.request.mockResolvedValueOnce({ theme: "original" });
  await user.click(screen.getByRole("button", { name: "Aplicar tema" }));
  await waitFor(() => expect(document.documentElement.dataset.theme).toBe("original"));
  expect(screen.queryByText(/Boas festas/)).not.toBeInTheDocument();
});
it("mantém o tema ativo se o salvamento falhar", async () => {
  const user = userEvent.setup(); open();
  await user.click(await screen.findByRole("radio", { name: "Ano Novo" }));
  fake.request.mockRejectedValueOnce(new Error("Sem permissão para alterar."));
  await user.click(screen.getByRole("button", { name: "Aplicar tema" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("Sem permissão");
  expect(document.documentElement.dataset.theme).toBe("original");
});
it("não oferece edição se o servidor negar acesso", async () => {
  fake.request.mockRejectedValueOnce(new Error("Área exclusiva da administração."));
  open();
  expect(await screen.findByRole("alert")).toHaveTextContent("exclusiva");
  expect(screen.queryByRole("radio")).not.toBeInTheDocument();
});
it("aplica o tema público sem login e atualiza o favicon", async () => {
  document.head.insertAdjacentHTML("beforeend", '<link rel="icon" href="/icons/original/icon-192.png" />');
  vi.mocked(fetch).mockResolvedValue({ ok: true, json: async () => ({ theme: "new-year" }) } as Response);
  render(<AppearanceProvider><p>Vitrine pública</p></AppearanceProvider>);
  expect(await screen.findByText(/Novos começos/)).toBeVisible();
  expect(document.querySelector('link[rel="icon"]')).toHaveAttribute("href", "/icons/new-year/icon-192.png");
  document.querySelector('link[rel="icon"]')?.remove();
});
