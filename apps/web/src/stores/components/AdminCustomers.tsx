import { useEffect, useState } from "react";
import type { AdminCustomerList } from "@appsoft/domain/admin";
import { adminService } from "../admin-service";
import { ApiError } from "../service";
import "./AdminCustomers.css";

const formatDate = (value: string) => new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" }).format(new Date(value));

export function AdminCustomers() {
  const [query, setQuery] = useState({ search: "", page: 1 });
  const [search, setSearch] = useState("");
  const [data, setData] = useState<AdminCustomerList | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [denied, setDenied] = useState(false);
  const [refresh, setRefresh] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setError(""); setDenied(false); setData(null);
    void adminService.customers(query, controller.signal).then(result => {
      if (!controller.signal.aborted) setData(result);
    }).catch(error => {
      if (!controller.signal.aborted) { setError(error.message); setDenied(error instanceof ApiError && error.status === 403); }
    }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [query, refresh]);
  return <section aria-labelledby="admin-customers-title">
    <div className="page-heading-row"><div className="page-heading"><h2 id="admin-customers-title">Clientes cadastrados</h2><p>Consulte as contas do marketplace, incluindo clientes que ainda não cadastraram loja.</p></div><button className="button secondary" disabled={loading} onClick={() => setRefresh(value => value + 1)}>Atualizar clientes</button></div>
    {denied ? <p className="notice error" role="alert">{error}</p> : <div className="panel-card">
      <form className="admin-customer-search" onSubmit={event => { event.preventDefault(); setQuery({ search: search.trim(), page: 1 }); }}>
        <label>Buscar cliente<input type="search" value={search} maxLength={100} placeholder="Nome ou e-mail" onChange={event => setSearch(event.target.value)} /></label><button className="button secondary" type="submit">Buscar clientes</button>
      </form>
      {loading ? <p role="status">Carregando clientes…</p> : error ? <p className="notice error" role="alert">{error}</p> : data && <>
        <p role="status">{data.total} conta(s) encontrada(s)</p>
        {data.customers.length ? <ul className="admin-customer-list">{data.customers.map(customer => <li key={customer.id}>
          <div><h3>{customer.name}</h3><p className="admin-customer-email">{customer.email || "Sem e-mail informado"}</p><p className="fine-print">Cadastro em {formatDate(customer.created_at)}</p></div>
          <div><p>{customer.email_confirmed ? "E-mail confirmado" : "Aguardando confirmação"}</p><p>{customer.role === "admin" ? "Administrador" : customer.store_count ? "Cliente e lojista" : "Cliente"}{customer.store_count > 0 && ` · ${customer.store_count} loja(s)`}</p></div>
        </li>)}</ul> : <p>Nenhum cliente encontrado. Ajuste a busca para consultar outras contas.</p>}
        <nav className="pagination" aria-label="Paginação de clientes"><button className="button secondary" disabled={data.page <= 1} onClick={() => setQuery({ ...query, page: query.page - 1 })}>Anterior</button><span>Página {data.page} de {Math.max(1, Math.ceil(data.total / data.pageSize))}</span><button className="button secondary" disabled={data.page * data.pageSize >= data.total} onClick={() => setQuery({ ...query, page: query.page + 1 })}>Próxima</button></nav>
      </>}
    </div>}
  </section>;
}
