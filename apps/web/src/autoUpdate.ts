export function startAutoUpdate(
  reload: () => void = () => window.location.reload(),
  interval = 10 * 60_000,
) {
  const current = document.querySelector<HTMLScriptElement>('script[type="module"][src]')?.getAttribute("src");
  if (!current) return () => {};
  let checking = false;
  let stopped = false;
  let reloading = false;
  let editing = false;
  let editingPath = window.location.pathname;
  const markEditing = (event: Event) => { if (event.target instanceof Element && event.target.closest("form")) { editing = true; editingPath = window.location.pathname; } };
  const resetEditing = () => { editing = false; };
  const check = async () => {
    if (stopped || checking || reloading || document.visibilityState === "hidden" || !navigator.onLine) return;
    checking = true;
    try {
      const response = await fetch("/index.html", { cache: "no-store", signal: AbortSignal.timeout(10_000) });
      if (!response.ok) return;
      const html = new DOMParser().parseFromString(await response.text(), "text/html");
      const latest = html.querySelector<HTMLScriptElement>('script[type="module"][src]')?.getAttribute("src");
      if (editingPath !== window.location.pathname) editing = false;
      const busy = editing || document.activeElement?.matches("input, textarea, select, [contenteditable]") ||
        /^\/(finalizar-compra|login|cadastro|recuperar-senha|redefinir-senha|confirmar-email|auth)(\/|$)/.test(window.location.pathname);
      if (!stopped && latest && latest !== current && !busy) {
        reloading = true;
        reload();
      }
    } catch {
      // Offline or a failed deployment check: keep the current app usable.
    } finally {
      checking = false;
    }
  };
  document.addEventListener("input", markEditing);
  document.addEventListener("change", markEditing);
  window.addEventListener("popstate", resetEditing);
  window.addEventListener("focus", check);
  window.addEventListener("online", check);
  document.addEventListener("visibilitychange", check);
  const timer = window.setInterval(check, interval);
  void check();
  return () => {
    stopped = true;
    window.clearInterval(timer);
    document.removeEventListener("input", markEditing);
    document.removeEventListener("change", markEditing);
    window.removeEventListener("popstate", resetEditing);
    window.removeEventListener("focus", check);
    window.removeEventListener("online", check);
    document.removeEventListener("visibilitychange", check);
  };
}
