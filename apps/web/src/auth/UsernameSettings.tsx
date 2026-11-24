import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { normalizeUsername } from "@appsoft/domain/username";
import { request } from "../stores/service";

export function UsernameSettings() {
  const [username, setUsername] = useState("");
  const [saved, setSaved] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setError("");
    void request<{ username: string | null }>("/api/me/username", { signal: controller.signal }).then(data => {
      if (!controller.signal.aborted) { setSaved(data.username); setUsername(data.username || ""); }
    }).catch(error => { if (!controller.signal.aborted) setError(error.message); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [attempt]);
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (loading || busy) return;
    setError(""); setNotice("");
    let chosen: string;
    try { chosen = normalizeUsername(username); }
    catch (error) { setError((error as Error).message); return; }
    setBusy(true);
    try {
      const result = await request<{ username: string }>("/api/me/username", { method: "PUT", body: JSON.stringify({ username: chosen }) });
      setSaved(result.username); setUsername(result.username); setNotice("Nome de usuário salvo. Você já pode entrar com ele ou com seu e-mail.");
    } catch (error) { setError((error as Error).message); }
    finally { setBusy(false); }
  };
  return <section className="panel-card"><h2>Nome de usuário</h2><p>Escolha um nome único para entrar. Seu e-mail também continua funcionando.</p>
    {error && <p role="alert" className="notice error">{error}</p>}
    {notice && <p role="status" className="notice success">{notice}</p>}
    {loading ? <p>Carregando nome de usuário…</p> : <form className="form" onSubmit={submit}><fieldset disabled={busy}>
      <label>Nome de usuário<input name="username" autoComplete="username" value={username} onChange={event => setUsername(event.target.value)} required minLength={3} maxLength={30} pattern="[a-zA-Z0-9][a-zA-Z0-9_.\-]{2,29}" aria-describedby="account-username-hint" /></label>
      <small id="account-username-hint">De 3 a 30 caracteres. Use letras sem acento, números, ponto, hífen ou sublinhado.</small>
      <button className="button primary" disabled={busy || username.trim().toLowerCase() === saved}>{busy ? "Salvando…" : "Salvar nome de usuário"}</button>
      {error && <button className="button secondary" type="button" onClick={() => setAttempt(value => value + 1)}>Recarregar</button>}
    </fieldset></form>}
  </section>;
}
