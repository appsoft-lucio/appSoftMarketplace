import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { isTheme } from "@appsoft/domain/appearance";
import type { Theme } from "@appsoft/domain/appearance";
import "./appearance.css";

export const themeDetails = {
  original: { name: "Original", color: "#c3520a", message: "", description: "A identidade AppSoft em laranja, branco e grafite." },
  christmas: { name: "Natal", color: "#a82c35", message: "Boas festas! Encontre o presente ideal no comércio local.", description: "Vermelho, verde e detalhes de Natal com o ícone de gorro." },
  "new-year": { name: "Ano Novo", color: "#795717", message: "Novos começos, boas escolhas. Feliz Ano Novo!", description: "Dourado, grafite e estrelas para celebrar um novo ciclo." },
};
const AppearanceContext = createContext<{ theme: Theme; apply: (theme: Theme) => void } | null>(null);

export function AppearanceProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>("original");
  const revision = useRef(0);
  const apply = useCallback((value: Theme) => {
    revision.current += 1;
    setTheme(value);
    document.documentElement.dataset.theme = value;
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", themeDetails[value].color);
    for (const selector of ['link[rel="icon"]', 'link[rel="apple-touch-icon"]']) {
      document.querySelector(selector)?.setAttribute("href", `/icons/${value}/icon-192.png`);
    }
  }, []);
  useEffect(() => {
    let disposed = false;
    let checking = false;
    const controller = new AbortController();
    const refresh = async () => {
      if (checking || document.visibilityState === "hidden" || !navigator.onLine) return;
      checking = true;
      const startedAt = revision.current;
      try {
        const response = await fetch("/api/appearance", { cache: "no-store", signal: AbortSignal.any([controller.signal, AbortSignal.timeout(10_000)]) });
        if (!response.ok) return;
        const data = await response.json();
        if (!disposed && startedAt === revision.current && isTheme(data?.theme)) apply(data.theme);
      } catch { /* Keep the last working theme if the service is unavailable. */ }
      finally { checking = false; }
    };
    void refresh();
    const timer = window.setInterval(refresh, 10 * 60_000);
    window.addEventListener("focus", refresh);
    window.addEventListener("online", refresh);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      disposed = true;
      controller.abort();
      window.clearInterval(timer);
      window.removeEventListener("focus", refresh);
      window.removeEventListener("online", refresh);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [apply]);
  return <AppearanceContext.Provider value={{ theme, apply }}>
    {theme !== "original" && <div className="seasonal-banner"><span aria-hidden="true">{theme === "christmas" ? "✦" : "✧"}</span> {themeDetails[theme].message}</div>}
    {children}
  </AppearanceContext.Provider>;
}
export function useAppearance() {
  const context = useContext(AppearanceContext);
  if (!context) throw new Error("AppearanceProvider não encontrado.");
  return context;
}
