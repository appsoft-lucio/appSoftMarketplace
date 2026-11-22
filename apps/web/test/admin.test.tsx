import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import AdminPage from "../src/pages/AdminPage";
import { ApiError } from "../src/stores/service";
const fake = vi.hoisted(() => ({ list: vi.fn(), history: vi.fn(), review: vi.fn() }));
vi.mock("../src/auth/AuthProvider", () => ({ useAuth: () => ({ session: { user: { id: "admin" } } }) }));
vi.mock("../src/stores/admin-service", () => ({ adminService: { list: fake.list, history: fake.history, review: fake.review } }));
const store = { id: "store-1", name: "Loja Revisão", slug: "loja-revisao", description: "Uma loja em análise.", phone: "11999999999", city: "São Paulo", state: "SP", status: "pending", created_at: "2026-11-22T12:00:00Z", owners: [{ name: "Ana", email: "ana@example.test" }] };
beforeEach(() => {
  vi.resetAllMocks();
  HTMLDialogElement.prototype.showModal = function () { this.setAttribute("open", ""); };
  fake.list.mockResolvedValue({ stores: [store], total: 1, page: 1, pageSize: 20, counts: { pending: 1, approved: 0, suspended: 0 } });
  fake.history.mockResolvedValue({ reviews: [] }); fake.review.mockResolvedValue({});
});
function open() { render(<MemoryRouter><AdminPage /></MemoryRouter>); }
it("não expõe a lista quando a API recusa permissão", async () => {
  fake.list.mockRejectedValue(new ApiError(403, "Esta área é exclusiva da administração."));
  open(); expect(await screen.findByRole("heading", { name: "Acesso restrito" })).toBeVisible();
  expect(screen.queryByRole("button", { name: "Analisar Loja Revisão" })).not.toBeInTheDocument();
});
it("aprovação envia status esperado e observação e atualiza a lista", async () => {
  const user = userEvent.setup(); open();
  await user.click(await screen.findByRole("button", { name: "Analisar Loja Revisão" }));
  expect(await screen.findByText("ana@example.test")).toBeVisible();
  await user.type(screen.getByLabelText("Observação (opcional)"), "Dados conferidos");
  await user.click(screen.getByRole("button", { name: "Confirmar aprovação" }));
  expect(await screen.findByText("Decisão salva e registrada no histórico.")).toBeVisible();
  expect(fake.review).toHaveBeenCalledWith("store-1", { status: "approved", expectedStatus: "pending", reason: "Dados conferidos" });
});
it("suspensão exige motivo e não assume sucesso quando há conflito", async () => {
  fake.review.mockRejectedValue(new ApiError(409, "O status desta loja mudou. Atualize a lista antes de continuar."));
  const user = userEvent.setup(); open();
  await user.click(await screen.findByRole("button", { name: "Analisar Loja Revisão" }));
  await user.selectOptions(screen.getByLabelText("Ação"), "suspended");
  await user.type(screen.getByLabelText("Motivo da suspensão"), "Dados precisam de revisão");
  await user.click(screen.getByRole("button", { name: "Confirmar suspensão" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("O status desta loja mudou");
  expect(screen.getByRole("dialog")).toBeVisible();
});