import { useEffect, useState } from "react";
import "./InstallPrompt.css";

interface InstallEvent extends Event {
  prompt(): Promise<{ outcome: "accepted" | "dismissed" }>;
}
const dismissedKey = "appsoft.install-dismissed";
function standalone() {
  return window.matchMedia?.("(display-mode: standalone)").matches || Boolean((navigator as Navigator & { standalone?: boolean }).standalone);
}
function dismissed() { try { return sessionStorage.getItem(dismissedKey) === "1"; } catch { return false; } }
export function InstallPrompt() {
  const [event, setEvent] = useState<InstallEvent | null>(null);
  const [hidden, setHidden] = useState(() => standalone() || dismissed());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  useEffect(() => {
    const offer = (event: Event) => { event.preventDefault(); setEvent(event as InstallEvent); };
    const installed = () => { setHidden(true); setEvent(null); };
    const media = window.matchMedia?.("(display-mode: standalone)");
    const changed = () => { if (standalone()) installed(); };
    window.addEventListener("beforeinstallprompt", offer);
    window.addEventListener("appinstalled", installed);
    media?.addEventListener("change", changed);
    return () => { window.removeEventListener("beforeinstallprompt", offer); window.removeEventListener("appinstalled", installed); media?.removeEventListener("change", changed); };
  }, []);
  const dismiss = () => { setHidden(true); try { sessionStorage.setItem(dismissedKey, "1"); } catch { /* Still dismiss for this page. */ } };
  const install = async () => {
    if (!event || busy) return;
    setBusy(true); setError("");
    try { const result = await event.prompt(); setEvent(null); if (result.outcome === "accepted") setHidden(true); else dismiss(); }
    catch { setEvent(null); setError("Não foi possível abrir a instalação. Use a opção de instalar no menu do navegador."); }
    finally { setBusy(false); }
  };
  if (hidden || (!event && !ios && !error)) return null;
  return <aside className="install-prompt" aria-label="Instalar AppSoft"><div><h2>Tenha a AppSoft na sua tela inicial</h2><p>{ios ? "No Safari, toque em Compartilhar e depois em Adicionar à Tela de Início." : "Instale para acessar suas lojas e produtos com mais facilidade."}</p>{error && <p role="status">{error}</p>}</div><div className="install-actions">{event && <button className="button primary" disabled={busy} onClick={() => void install()}>{busy ? "Abrindo…" : "Instalar app"}</button>}<button className="button secondary" onClick={dismiss}>Agora não</button></div></aside>;
}
