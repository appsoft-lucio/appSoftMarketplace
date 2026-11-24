import { afterEach, expect, it, vi } from "vitest";
import { startAutoUpdate } from "../src/autoUpdate";

let stop = () => {};
afterEach(() => {
  stop();
  vi.unstubAllGlobals();
  vi.useRealTimers();
  document.body.innerHTML = "";
  window.history.replaceState({}, "", "/");
});
function setup(latest: string) {
  document.body.innerHTML = '<script type="module" src="/assets/old.js"></script>';
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
    ok: true, text: async () => latest,
  }));
  return vi.fn();
}
async function settle() {
  await Promise.resolve(); await Promise.resolve(); await Promise.resolve();
}
it("recarrega automaticamente ao encontrar uma nova versão", async () => {
  const reload = setup('<script type="module" src="/assets/new.js"></script>');
  stop = startAutoUpdate(reload);
  await settle();
  expect(reload).toHaveBeenCalledOnce();
  expect(fetch).toHaveBeenCalledWith("/index.html", expect.objectContaining({ cache: "no-store" }));
});
it("não recarrega a mesma versão nem uma resposta sem o bundle", async () => {
  const reload = setup('<script type="module" src="/assets/old.js"></script>');
  stop = startAutoUpdate(reload);
  await settle();
  expect(reload).not.toHaveBeenCalled();
  stop();
  vi.mocked(fetch).mockResolvedValue({ ok: true, text: async () => "<html>indisponível</html>" } as Response);
  stop = startAutoUpdate(reload);
  await settle();
  expect(reload).not.toHaveBeenCalled();
});
it("adia a atualização durante checkout e retoma após sair", async () => {
  vi.useFakeTimers();
  const reload = setup('<script type="module" src="/assets/new.js"></script>');
  window.history.replaceState({}, "", "/finalizar-compra");
  stop = startAutoUpdate(reload, 1000);
  await settle();
  expect(reload).not.toHaveBeenCalled();
  window.history.replaceState({}, "", "/catalogo");
  await vi.advanceTimersByTimeAsync(1000);
  expect(reload).toHaveBeenCalledOnce();
});
it("preserva formulário editado e tolera falha de rede", async () => {
  vi.useFakeTimers();
  const reload = setup('<script type="module" src="/assets/old.js"></script>');
  stop = startAutoUpdate(reload, 1000);
  await settle();
  document.body.insertAdjacentHTML("beforeend", "<form><input /></form>");
  document.querySelector("input")!.dispatchEvent(new Event("input", { bubbles: true }));
  vi.mocked(fetch).mockResolvedValue({ ok: true, text: async () => '<script type="module" src="/assets/new.js"></script>' } as Response);
  await vi.advanceTimersByTimeAsync(1000);
  expect(reload).not.toHaveBeenCalled();
  vi.mocked(fetch).mockRejectedValue(new Error("offline"));
  await vi.advanceTimersByTimeAsync(1000);
  expect(reload).not.toHaveBeenCalled();
});
