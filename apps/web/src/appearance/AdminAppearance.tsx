import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { themes, parseAppearance } from "@appsoft/domain/appearance";
import type { Theme } from "@appsoft/domain/appearance";
import { request } from "../stores/service";
import { themeDetails, useAppearance } from "./AppearanceProvider";

export function AdminAppearance() {
  const { apply } = useAppearance();
  const [selected, setSelected] = useState<Theme>("original");
  const [saved, setSaved] = useState<Theme | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setError("");
    void request("/api/admin/appearance", { signal: controller.signal }).then(data => {
      if (!controller.signal.aborted) {
        const value = parseAppearance(data);
        setSelected(value.theme); setSaved(value.theme);
      }
    }).catch(error => { if (!controller.signal.aborted) setError(error.message); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [attempt]);
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (busy || loading || !saved) return;
    setBusy(true); setError(""); setNotice("");
    try {
      const result = parseAppearance(await request("/api/admin/appearance", { method: "PUT", body: JSON.stringify({ theme: selected }) }));
      setSaved(result.theme); apply(result.theme);
      setNotice(`Tema ${themeDetails[result.theme].name} aplicado ao marketplace.`);
    } catch (error) { setError((error as Error).message); }
    finally { setBusy(false); }
  };
  return <section className="admin-appearance">
    <div className="page-heading"><p className="eyebrow">IDENTIDADE DO MARKETPLACE</p><h1>Aparência</h1><p>Escolha o tema que todos os visitantes verão. Você pode voltar ao original quando quiser.</p></div>
    {error && <p role="alert" className="notice error">{error}</p>}
    {notice && <p role="status" className="notice success">{notice}</p>}
    {loading ? <p role="status">Carregando aparência…</p> : !saved ? <button className="button secondary" onClick={() => setAttempt(value => value + 1)}>Tentar novamente</button> : <form onSubmit={submit}>
      <fieldset disabled={busy} className="appearance-options"><legend>Tema do marketplace</legend>
        {themes.map(value => <label key={value} className={`appearance-option ${selected === value ? "is-selected" : ""}`}>
          <span className={`theme-preview theme-preview-${value}`}><img src={`/icons/${value}/icon-192.png`} alt="" /><span>AppSoft<br /><small>Marketplace</small></span><span aria-hidden="true">{value === "christmas" ? "✦" : value === "new-year" ? "✧" : "</>"}</span></span>
          <span className="theme-option-title"><input type="radio" aria-label={themeDetails[value].name} name="theme" value={value} checked={selected === value} onChange={() => { setSelected(value); setNotice(""); }} /> {themeDetails[value].name} {saved === value && <small>Ativo</small>}</span>
          <span>{themeDetails[value].description}</span>
        </label>)}
      </fieldset>
      <p className="fine-print">Altera as cores, a faixa de celebração e o ícone. Visitantes recebem o tema ao abrir ou voltar ao app e na verificação a cada 10 minutos.</p>
      <button className="button primary" disabled={busy || selected === saved}>{busy ? "Aplicando tema…" : "Aplicar tema"}</button>
    </form>}
  </section>;
}
