import "./AdminPage.css";
import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { Link, Navigate } from "react-router-dom";
import type { AdminStore, AdminStoreList, AdminStoreQuery, StoreReview } from "@appsoft/domain/admin";
import { validateStoreReview } from "@appsoft/domain/admin";
import { useAuth } from "../auth/AuthProvider";
import { adminService } from "../stores/admin-service";
import { ApiError } from "../stores/service";
import { SiteHeader } from "../components/layout/SiteHeader";
import { AdminCustomers } from "../stores/components/AdminCustomers";

const labels = { pending: "Aguardando aprovação", approved: "Cadastro aprovado", suspended: "Suspensa" };
const date = (value: string) => new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(value));

function ReviewDialog({ store, onClose, onSaved }: { store: AdminStore; onClose: () => void; onSaved: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [target, setTarget] = useState<"approved" | "suspended">(store.status === "approved" ? "suspended" : "approved");
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [history, setHistory] = useState<StoreReview[]>([]);
  const [historyState, setHistoryState] = useState<"loading" | "ready" | "error">("loading");
  useEffect(() => {
    dialog.current?.showModal();
    const controller = new AbortController();
    void adminService.history(store.id, controller.signal).then(data => { if (!controller.signal.aborted) { setHistory(data.reviews); setHistoryState("ready"); } }).catch(() => { if (!controller.signal.aborted) setHistoryState("error"); });
    return () => controller.abort();
  }, [store.id]);
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); if (busy) return;
    setError("");
    let input;
    try { input = validateStoreReview({ status: target, expectedStatus: store.status, reason }); }
    catch (error) { setError((error as Error).message); return; }
    setBusy(true);
    try { await adminService.review(store.id, input); onSaved(); }
    catch (error) { setError((error as Error).message); } finally { setBusy(false); }
  };
  return <dialog className="admin-dialog" ref={dialog} aria-labelledby="review-title" onCancel={event => { event.preventDefault(); if (!busy) onClose(); }}>
    <header className="admin-dialog-heading"><div><p className="eyebrow">ANÁLISE DO CADASTRO</p><h2 id="review-title">{store.name}</h2></div><button className="button secondary" onClick={onClose} disabled={busy}>Fechar</button></header>
    <span className={`status-badge ${store.status}`}>{labels[store.status]}</span><p className="admin-description">{store.description}</p>
    <dl className="definition-list"><div><dt>Endereço</dt><dd>{store.slug}</dd></div><div><dt>Localização</dt><dd>{store.city} / {store.state}</dd></div><div><dt>Telefone</dt><dd>{store.phone}</dd></div><div><dt>Cadastro</dt><dd>{date(store.created_at)}</dd></div></dl>
    <section className="admin-owners"><h3>Responsáveis</h3>{store.owners.map(owner => <p key={owner.email}><strong>{owner.name}</strong><br />{owner.email}</p>)}</section>
    <form className="form admin-decision" onSubmit={submit}><h3>Decisão</h3>{error && <p className="notice error" role="alert">{error}</p>}<fieldset disabled={busy}>
      <label>Ação<select value={target} onChange={event => setTarget(event.target.value as "approved" | "suspended")}>
        {store.status !== "approved" && <option value="approved">{store.status === "suspended" ? "Reativar cadastro" : "Aprovar cadastro"}</option>}
        {store.status !== "suspended" && <option value="suspended">Suspender loja</option>}
      </select></label>
      <label>{target === "suspended" ? "Motivo da suspensão" : "Observação (opcional)"}<textarea rows={3} value={reason} onChange={event => setReason(event.target.value)} maxLength={500} minLength={target === "suspended" ? 10 : undefined} required={target === "suspended"} /></label>
      <p className="notice warning">{target === "approved" ? "A aprovação valida o cadastro. A loja só entra na vitrine com uma assinatura ativa. Nenhuma cobrança será feita." : "A suspensão retira a loja da vitrine. Os dados e pedidos existentes serão preservados."}</p>
      <button type="submit" className={`button ${target === "suspended" ? "danger" : "primary"}`}>{busy ? "Salvando decisão…" : target === "suspended" ? "Confirmar suspensão" : "Confirmar aprovação"}</button>
    </fieldset></form>
    <section className="admin-history"><h3>Histórico de decisões</h3>{historyState === "loading" ? <p role="status">Carregando histórico…</p> : historyState === "error" ? <p>Não foi possível carregar o histórico. Feche e abra a análise para tentar novamente.</p> : history.length ? <ol>{history.map(review => <li key={review.id}><strong>{labels[review.previous_status]} → {labels[review.new_status]}</strong><p>{review.actor_name} · {date(review.created_at)}</p>{review.reason && <p>{review.reason}</p>}</li>)}</ol> : <p>Nenhuma decisão registrada.</p>}</section>
  </dialog>;
}

export default function AdminPage() {
  const [section, setSection] = useState<"stores" | "customers">("stores");
  const { session } = useAuth();
  const [query, setQuery] = useState<AdminStoreQuery>({ status: "pending", search: "", page: 1 });
  const [search, setSearch] = useState("");
  const [data, setData] = useState<AdminStoreList | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [denied, setDenied] = useState(false);
  const [refresh, setRefresh] = useState(0);
  const [selected, setSelected] = useState<AdminStore | null>(null);
  const [notice, setNotice] = useState("");
  useEffect(() => { document.title = "Administração · AppSoft Marketplace"; }, []);
  useEffect(() => {
    if (!session || section !== "stores") return;
    const controller = new AbortController();
    setLoading(true); setError(""); setDenied(false);
    void adminService.list(query, controller.signal).then(result => { if (!controller.signal.aborted) setData(result); }).catch(error => {
      if (!controller.signal.aborted) { setError(error.message); setDenied(error instanceof ApiError && error.status === 403); setData(null); }
    }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [session?.user.id, query, refresh, section]);
  if (!session) return <Navigate to="/login" replace />;
  const searchStores = (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); setQuery({ ...query, search: search.trim(), page: 1 }); };
  const saved = () => { setSelected(null); setNotice("Decisão salva e registrada no histórico."); setRefresh(value => value + 1); };
  return <div className="site-shell"><SiteHeader><Link className="button secondary" to="/minha-conta">Minha conta</Link></SiteHeader><main className="page-content"><nav className="admin-sections" aria-label="Áreas da administração"><button className={`button ${section === "stores" ? "primary" : "secondary"}`} aria-pressed={section === "stores"} onClick={() => setSection("stores")}>Lojas</button><button className={`button ${section === "customers" ? "primary" : "secondary"}`} aria-pressed={section === "customers"} onClick={() => setSection("customers")}>Clientes</button></nav>{section === "customers" ? <AdminCustomers /> : <>
    <div className="page-heading-row"><div className="page-heading"><p className="eyebrow">ADMINISTRAÇÃO</p><h1>Gestão de lojas</h1><p>Analise os cadastros e acompanhe a situação de cada loja.</p></div><button className="button secondary" disabled={loading} onClick={() => setRefresh(value => value + 1)}>Atualizar lista</button></div>
    {notice && <p className="notice success" role="status">{notice}</p>}
    {denied ? <section className="panel-card"><h2>Acesso restrito</h2><p role="alert">{error}</p><Link to="/minha-conta">Voltar para minha conta</Link></section> : <>
      {data && <section className="admin-metrics" aria-label="Resumo de todas as lojas">{(["pending", "approved", "suspended"] as const).map(status => <article key={status}><p>{labels[status]}</p><strong>{data.counts[status]}</strong></article>)}</section>}
      <section className="panel-card"><form className="admin-filters" onSubmit={searchStores}><label>Buscar loja<input type="search" placeholder="Nome ou endereço da loja" value={search} maxLength={100} onChange={event => setSearch(event.target.value)} /></label><label>Situação<select value={query.status} onChange={event => setQuery({ ...query, status: event.target.value as AdminStoreQuery["status"], page: 1 })}><option value="all">Todas as lojas</option>{Object.entries(labels).map(([key, text]) => <option key={key} value={key}>{text}</option>)}</select></label><button className="button secondary" type="submit">Buscar</button></form>
      {loading ? <p role="status">Carregando lojas…</p> : error ? <p className="notice error" role="alert">{error}</p> : data && <><p className="fine-print">{data.total} loja(s) encontrada(s)</p>{data.stores.length ? <div className="admin-store-list">{data.stores.map(store => <article key={store.id}><div><h2>{store.name}</h2><p>{store.city} / {store.state} · {store.slug}</p><small>{date(store.created_at)}</small></div><span className={`status-badge ${store.status}`}>{labels[store.status]}</span><button className="button secondary" onClick={() => setSelected(store)} aria-label={`Analisar ${store.name}`}>Analisar</button></article>)}</div> : <div className="empty-state"><h2>Nenhuma loja neste filtro</h2><p>Ajuste a busca ou a situação para consultar outros cadastros.</p></div>}
      <nav className="pagination" aria-label="Paginação de lojas"><button className="button secondary" disabled={query.page <= 1} onClick={() => setQuery({ ...query, page: query.page - 1 })}>Anterior</button><span>Página {data.page} de {Math.max(1, Math.ceil(data.total / data.pageSize))}</span><button className="button secondary" disabled={query.page * data.pageSize >= data.total} onClick={() => setQuery({ ...query, page: query.page + 1 })}>Próxima</button></nav></>}
      </section><p className="fine-print">Aprovação de cadastro e assinatura são etapas diferentes. O painel não gera cobranças.</p>
    </>}
    {selected && <ReviewDialog store={selected} onClose={() => setSelected(null)} onSaved={saved} />}
  </>}</main></div>;
}
