import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { AuthProvider } from "../src/auth/AuthProvider";
import App from "../src/App";

const fake = vi.hoisted(() => ({
  configured: true,
  initializationError: null as null | { code: string },
  session: null as unknown,
  listener: null as null | ((event: string, session: unknown) => void),
  signInWithPassword: vi.fn(), signUp: vi.fn(), resetPasswordForEmail: vi.fn(),
  updateUser: vi.fn(), signOut: vi.fn(), resend: vi.fn(),
}));
vi.mock("../src/auth/client", () => ({
  get authConfigured() { return fake.configured; },
  getAuthClient: () => ({ auth: {
    initialize: async () => ({ error: fake.initializationError }),
    getSession: async () => ({ data: { session: fake.session }, error: null }),
    onAuthStateChange: (listener: typeof fake.listener) => {
      fake.listener = listener;
      return { data: { subscription: { unsubscribe: () => { fake.listener = null; } } } };
    },
    signInWithPassword: fake.signInWithPassword, signUp: fake.signUp,
    resetPasswordForEmail: fake.resetPasswordForEmail, updateUser: fake.updateUser,
    signOut: fake.signOut, resend: fake.resend,
  } }),
}));
vi.mock("../src/stores/admin-service", () => ({ adminService: { profile: async () => ({ role: "customer" }) } }));
const session = { user: { id: "user-1", email: "ana@example.test", user_metadata: { name: "Ana", account_type: "seller" } } };
function open(path: string) {
  window.history.replaceState(null, "", path);
  return render(<MemoryRouter initialEntries={[path]}><AuthProvider><App /></AuthProvider></MemoryRouter>);
}
beforeEach(() => {
  vi.resetAllMocks();
  sessionStorage.clear(); localStorage.clear();
  fake.configured = true; fake.initializationError = null; fake.session = null; fake.listener = null;
  fake.signUp.mockResolvedValue({ data: { session: null }, error: null });
  fake.resetPasswordForEmail.mockResolvedValue({ error: null });
  fake.updateUser.mockResolvedValue({ error: null });
  fake.resend.mockResolvedValue({ error: null });
  fake.signInWithPassword.mockImplementation(async () => {
    fake.listener?.("SIGNED_IN", session);
    return { data: { session }, error: null };
  });
  fake.signOut.mockImplementation(async () => {
    fake.listener?.("SIGNED_OUT", null);
    return { error: null };
  });
});

describe("cadastro e login", () => {
  it("envia credenciais ao SDK e mostra a conta; sair remove o acesso", async () => {
    const user = userEvent.setup(); open("/login");
    await user.type(await screen.findByLabelText("E-mail"), "ana@example.test");
    await user.type(screen.getByLabelText("Senha", { exact: true }), "senha-segura-123");
    await user.click(screen.getByRole("button", { name: "Entrar" }));
    expect(await screen.findByRole("heading", { name: "Olá, Ana." })).toBeVisible();
    expect(fake.signInWithPassword).toHaveBeenCalledWith({ email: "ana@example.test", password: "senha-segura-123" });
    await user.click(screen.getByRole("button", { name: "Sair da conta" }));
    expect(await screen.findByRole("heading", { name: "Que bom ter você aqui" })).toBeVisible();
  });
  it("protege a conta sem sessão", async () => {
    open("/minha-conta");
    expect(await screen.findByRole("heading", { name: "Que bom ter você aqui" })).toBeVisible();
  });
  it("não cadastra quando as senhas são diferentes", async () => {
    const user = userEvent.setup(); open("/cadastro");
    await user.type(await screen.findByLabelText("Seu nome"), "Ana");
    await user.type(screen.getByLabelText("E-mail"), "ana@example.test");
    await user.type(screen.getByLabelText("Senha", { exact: true }), "primeira-senha-123");
    await user.type(screen.getByLabelText("Confirme a senha", { exact: true }), "outra-senha-123");
    await user.click(screen.getByRole("button", { name: "Criar conta" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("As senhas precisam ser iguais");
    expect(fake.signUp).not.toHaveBeenCalled();
  });
  it("cadastra lojista como preferência, sem conceder role de autorização", async () => {
    const user = userEvent.setup(); open("/cadastro");
    await user.type(await screen.findByLabelText("Seu nome"), "Ana");
    await user.type(screen.getByLabelText("E-mail"), "ana@example.test");
    await user.selectOptions(screen.getByLabelText("Como quer começar?"), "seller");
    for (const label of ["Senha", "Confirme a senha"]) await user.type(screen.getByLabelText(label, { exact: true }), "minha-senha-segura");
    await user.click(screen.getByRole("button", { name: "Criar conta" }));
    expect(await screen.findByRole("status")).toHaveTextContent("e-mail de confirmação");
    expect(fake.signUp).toHaveBeenCalledWith({ email: "ana@example.test", password: "minha-senha-segura", options: { emailRedirectTo: `${window.location.origin}/auth/confirmar`, data: { name: "Ana", account_type: "seller" } } });
  });
  it("traduz falha de credenciais sem exibir retorno bruto", async () => {
    fake.signInWithPassword.mockResolvedValue({ error: { code: "invalid_credentials", message: "Internal error details" } });
    const user = userEvent.setup(); open("/login");
    await user.type(await screen.findByLabelText("E-mail"), "ana@example.test");
    await user.type(screen.getByLabelText("Senha", { exact: true }), "senha-incorreta");
    await user.click(screen.getByRole("button", { name: "Entrar" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("E-mail ou senha incorretos");
    expect(screen.queryByText("Internal error details")).not.toBeInTheDocument();
  });
  it("sem configuração, bloqueia chamadas e informa indisponibilidade", async () => {
    fake.configured = false; open("/login");
    expect(screen.getByRole("button", { name: "Entrar" })).toBeDisabled();
    expect(screen.getByRole("status")).toHaveTextContent("O acesso está sendo preparado");
    expect(fake.signInWithPassword).not.toHaveBeenCalled();
  });
});

describe("recuperação de senha", () => {
  it("envia o redirect correto sem revelar a existência da conta", async () => {
    const user = userEvent.setup(); open("/recuperar-senha");
    await user.type(await screen.findByLabelText("E-mail"), "ana@example.test");
    await user.click(screen.getByRole("button", { name: "Enviar link de recuperação" }));
    expect(await screen.findByRole("status")).toHaveTextContent("Se houver uma conta");
    expect(fake.resetPasswordForEmail).toHaveBeenCalledWith("ana@example.test", { redirectTo: `${window.location.origin}/redefinir-senha` });
  });
  it("reenvia confirmação com redirect fixo", async () => {
    const user = userEvent.setup(); open("/confirmar-email");
    await user.type(await screen.findByLabelText("E-mail"), "ana@example.test");
    await user.click(screen.getByRole("button", { name: "Reenviar confirmação" }));
    expect(await screen.findByRole("status")).toHaveTextContent("Se a conta estiver aguardando");
    expect(fake.resend).toHaveBeenCalledWith({ type: "signup", email: "ana@example.test", options: { emailRedirectTo: `${window.location.origin}/auth/confirmar` } });
  });
  it("sessão comum não é suficiente para mostrar o formulário de recuperação", async () => {
    fake.session = session; open("/redefinir-senha");
    expect(await screen.findByRole("alert")).toHaveTextContent("O link é inválido");
    expect(screen.queryByLabelText("Nova senha")).not.toBeInTheDocument();
    expect(fake.updateUser).not.toHaveBeenCalled();
  });
  it("erro do link prevalece mesmo com sessão antiga", async () => {
    fake.session = session; sessionStorage.setItem("appsoft.recovery-user", "user-1");
    open("/redefinir-senha?error=access_denied&error_code=otp_expired");
    expect(await screen.findByRole("alert")).toHaveTextContent("O link é inválido");
    expect(fake.updateUser).not.toHaveBeenCalled();
  });
  it("evento de recuperação abre formulário e atualiza a senha pelo SDK", async () => {
    const user = userEvent.setup(); open("/redefinir-senha");
    await waitFor(() => expect(fake.listener).not.toBeNull());
    await act(async () => { fake.listener?.("PASSWORD_RECOVERY", session); });
    await user.type(await screen.findByLabelText("Nova senha", { exact: true }), "nova-senha-segura-123");
    await user.type(screen.getByLabelText("Confirme a nova senha", { exact: true }), "nova-senha-segura-123");
    await user.click(screen.getByRole("button", { name: "Salvar nova senha" }));
    expect(await screen.findByRole("status")).toHaveTextContent("Senha atualizada com sucesso");
    expect(fake.updateUser).toHaveBeenCalledWith({ password: "nova-senha-segura-123" });
    expect(sessionStorage.getItem("appsoft.recovery-user")).toBeNull();
  });
  it("falha na troca do código bloqueia recuperação mesmo com sessão anterior", async () => {
    fake.session = session;
    fake.initializationError = { code: "flow_state_expired" };
    sessionStorage.setItem("appsoft.recovery-user", "user-1");
    open("/redefinir-senha?code=expired-code");
    expect(await screen.findByRole("alert")).toHaveTextContent("O link é inválido");
    expect(screen.queryByLabelText("Nova senha", { exact: true })).not.toBeInTheDocument();
    expect(fake.updateUser).not.toHaveBeenCalled();
  });
  it("recarregar a aba de recuperação preserva o formulário apenas para a mesma conta", async () => {
    fake.session = session; sessionStorage.setItem("appsoft.recovery-user", "user-1");
    open("/redefinir-senha");
    expect(await screen.findByLabelText("Nova senha", { exact: true })).toBeVisible();
  });
});
it("login retorna ao carrinho autenticado sem apagar os itens do visitante", async () => {
  const items = [{ productId: "00000000-0000-4000-8000-000000000001", size: "P", quantity: 2 }];
  localStorage.setItem("appsoft.cart.v1", JSON.stringify({ version: 1, items }));
  const user = userEvent.setup(); open("/login?next=/finalizar-compra");
  await user.type(await screen.findByLabelText("E-mail"), "ana@example.test");
  await user.type(screen.getByLabelText("Senha", { exact: true }), "minha-senha-segura");
  await user.click(screen.getByRole("button", { name: "Entrar" }));
  expect(await screen.findByRole("heading", { name: "Você está conectado" })).toBeVisible();
  expect(JSON.parse(localStorage.getItem("appsoft.cart.v1")!).items).toEqual(items);
});