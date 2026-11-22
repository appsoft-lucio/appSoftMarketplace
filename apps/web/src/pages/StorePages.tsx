import { useEffect, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { BRAZIL_STATES, storeSlug, validateStore } from "@appsoft/domain/stores";
import type { Store } from "@appsoft/domain/stores";
import { useAuth } from "../auth/AuthProvider";
import { storesService } from "../stores/service";
import logo from "../../../../imagens/logo-appsoft-orange-semFundo.png";

function StoreLayout({ children }: { children: ReactNode }) {
  return <div className="site-shell"><header className="site-header"><Link to="/"><img src={logo} alt="AppSoft, início" /></Link><Link className="button secondary" to="/minha-conta">Minha conta</Link></header><main className="store-content">{children}</main></div>;
}

export function StoreRegistrationPage() {
  const { session } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [customSlug, setCustomSlug] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => { document.title = "Cadastrar loja · AppSoft Marketplace"; }, []);
  if (!session) return <Navigate to="/login" replace />;
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (busy) return;
    setError("");
    const form = new FormData(event.currentTarget);
    let input;
    try { input = validateStore(Object.fromEntries(form)); }
    catch (error) { setError((error as Error).message); return; }
    setBusy(true);
    try { await storesService.create(input); navigate("/lojas", { replace: true }); }
    catch (error) { setError((error as Error).message); } finally { setBusy(false); }
  };
  return <StoreLayout><Link className="back-link" to="/lojas">Voltar para minhas lojas</Link><div className="store-heading"><p className="eyebrow">SEU NEGÓCIO NA APPSOFT</p><h1>Vamos conhecer sua loja</h1><p>Preencha os dados para enviar o cadastro para análise.</p></div><div className="store-registration"><section className="account-card"><h2>Dados da loja</h2>{error && <p className="notice error" role="alert">{error}</p>}<form className="auth-form" onSubmit={submit}><fieldset disabled={busy}>
    <label>Nome da loja<input name="name" autoComplete="organization" value={name} minLength={3} maxLength={120} required onChange={event => { setName(event.target.value); if (!customSlug) setSlug(storeSlug(event.target.value)); }} /></label>
    <label>Endereço da loja<input aria-label="Endereço da loja" name="slug" value={slug} minLength={3} maxLength={64} pattern="[a-z0-9]+(-[a-z0-9]+)*" required aria-describedby="slug-help" onChange={event => { setCustomSlug(true); setSlug(event.target.value.toLowerCase()); }} /><small id="slug-help">Um identificador exclusivo, como minha-loja. Use letras sem acentos, números e hífens.</small></label>
    <label>Sobre a loja<textarea name="description" rows={4} minLength={20} maxLength={1000} required placeholder="Conte o que sua loja oferece e o que a torna especial." /></label>
    <label>Telefone comercial com DDD<input aria-label="Telefone comercial com DDD" name="phone" type="tel" autoComplete="tel-national" maxLength={20} required placeholder="(11) 99999-9999" /><small>Informe um contato comercial. Não será usado para envio de mensagens nesta etapa.</small></label>
    <div className="store-form-row"><label>Cidade<input name="city" autoComplete="address-level2" minLength={2} maxLength={100} required /></label><label>Estado<select name="state" autoComplete="address-level1" defaultValue="" required><option value="" disabled>Selecione</option>{BRAZIL_STATES.map(state => <option key={state} value={state}>{state}</option>)}</select></label></div>
    <button className="button primary full" type="submit">{busy ? "Enviando cadastro…" : "Enviar para análise"}</button>
  </fieldset></form></section><aside className="store-info"><h2>Como funciona</h2><ol><li>Você envia os dados da loja.</li><li>A AppSoft analisa e aprova o cadastro.</li><li>Depois, você poderá ativar a assinatura e preparar seu catálogo.</li></ol><div className="notice warning">A loja começa aguardando aprovação e ainda não aparece na vitrine.</div><p>Plano Básico: <strong>R$ 200/mês</strong>, com até 50 produtos ativos. Nenhuma cobrança será feita neste cadastro.</p></aside></div></StoreLayout>;
}

export function MyStoresPage() {
  const { session } = useAuth();
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  useEffect(() => { document.title = "Minhas lojas · AppSoft Marketplace"; }, []);
  useEffect(() => {
    if (!session) return;
    const controller = new AbortController();
    setLoading(true); setError("");
    void storesService.list(controller.signal).then(data => { if (!controller.signal.aborted) setStores(data.stores); }).catch(error => { if (!controller.signal.aborted) setError(error.message); }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [session?.user.id, attempt]);
  if (!session) return <Navigate to="/login" replace />;
  const labels = { pending: "Aguardando aprovação", approved: "Cadastro aprovado", suspended: "Loja suspensa" };
  return <StoreLayout><div className="store-list-heading"><div className="store-heading"><p className="eyebrow">ÁREA DO LOJISTA</p><h1>Minhas lojas</h1><p>Acompanhe os cadastros vinculados à sua conta.</p></div><Link className="button primary" to="/lojas/nova">Cadastrar loja</Link></div>{loading ? <p role="status">Carregando suas lojas…</p> : error ? <div><p className="notice error" role="alert">{error}</p><button className="button secondary" onClick={() => setAttempt(attempt + 1)}>Tentar novamente</button></div> : stores.length ? <div className="store-cards">{stores.map(store => <article className="account-card" key={store.id}><span className={`store-status ${store.status}`}>{labels[store.status]}</span><h2>{store.name}</h2><p>{store.description}</p><dl><div><dt>Endereço</dt><dd>{store.slug}</dd></div><div><dt>Localização</dt><dd>{store.city} / {store.state}</dd></div><div><dt>Telefone</dt><dd>{store.phone}</dd></div></dl><p className="store-note">{store.status === "pending" ? "Seu cadastro foi recebido e aguarda análise da AppSoft. Nenhuma assinatura foi contratada." : store.status === "approved" ? "Seu cadastro está aprovado. A entrada na vitrine depende também de uma assinatura ativa." : "Sua loja está suspensa. Entre em contato com a AppSoft para mais informações."}</p></article>)}</div> : <section className="account-card empty-store"><h2>Sua primeira loja começa aqui</h2><p>Cadastre sua loja para iniciar a análise. Você não será cobrado nesta etapa.</p><Link className="button primary" to="/lojas/nova">Começar cadastro</Link></section>}</StoreLayout>;
}