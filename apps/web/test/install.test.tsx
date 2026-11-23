import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";
import { InstallPrompt } from "../src/components/pwa/InstallPrompt";
import { authSessionStorage } from "../src/auth/session-storage";

beforeEach(() => { sessionStorage.clear(); localStorage.clear(); vi.restoreAllMocks(); });
it("não recupera login antigo e compartilha somente o verificador do link de e-mail", () => {
  localStorage.setItem("sb-project-auth-token", "old-session");
  expect(authSessionStorage.getItem("sb-project-auth-token")).toBeNull();
  authSessionStorage.setItem("sb-project-auth-token", "session");
  expect(sessionStorage.getItem("sb-project-auth-token")).toBe("session");
  authSessionStorage.setItem("sb-project-auth-token-code-verifier", "verifier");
  sessionStorage.clear();
  expect(authSessionStorage.getItem("sb-project-auth-token")).toBeNull();
  expect(authSessionStorage.getItem("sb-project-auth-token-code-verifier")).toBe("verifier");
});
it("oferece instalação quando disponível e fecha após instalar", async () => {
  render(<InstallPrompt />);
  expect(screen.queryByRole("button", { name: "Instalar app" })).not.toBeInTheDocument();
  const event = new Event("beforeinstallprompt", { cancelable: true });
  const prompt = vi.fn().mockResolvedValue({ outcome: "accepted" });
  Object.assign(event, { prompt });
  act(() => { window.dispatchEvent(event); });
  expect(event.defaultPrevented).toBe(true);
  fireEvent.click(screen.getByRole("button", { name: "Instalar app" }));
  await waitFor(() => expect(screen.queryByLabelText("Instalar AppSoft")).not.toBeInTheDocument());
  expect(prompt).toHaveBeenCalledOnce();
});
it("respeita Agora não durante a sessão", () => {
  const view = render(<InstallPrompt />);
  act(() => { window.dispatchEvent(new Event("beforeinstallprompt")); });
  fireEvent.click(screen.getByRole("button", { name: "Agora não" }));
  view.unmount(); render(<InstallPrompt />);
  act(() => { window.dispatchEvent(new Event("beforeinstallprompt")); });
  expect(screen.queryByLabelText("Instalar AppSoft")).not.toBeInTheDocument();
});
it("não pede instalação quando está em modo instalado", () => {
  vi.stubGlobal("matchMedia", () => ({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() }));
  render(<InstallPrompt />);
  act(() => { window.dispatchEvent(new Event("beforeinstallprompt")); });
  expect(screen.queryByLabelText("Instalar AppSoft")).not.toBeInTheDocument();
  vi.unstubAllGlobals();
});
