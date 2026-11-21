import { useEffect, useRef, useState } from "react";
import { productService } from "../services/products";
import { orderService } from "../services/orders";
import "./VendorDashboardPage.css";

const money = (value) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(value) || 0);
const date = (value) => value ? new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(value)) : "—";
const statuses = { processando: "Processando", pago: "Pago", em_transito: "Em trânsito", entregue: "Entregue", cancelado: "Cancelado" };
const blank = { name: "", description: "", price: "", category: "", stock: "", imageUrl: "", active: true };
const vendorTotal = (order) => (order.items || []).reduce((sum, item) => sum + Number(item.subtotal), 0);

function ProductEditor({ product, onClose, onSaved }) {
  const [form, setForm] = useState(product ? { ...product, imageUrl: product.image_url || "", active: Boolean(product.active) } : { ...blank });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const dialog = useRef(null);
  useEffect(() => { dialog.current.showModal(); }, []);
  const change = (event) => setForm({ ...form, [event.target.name]: event.target.type === "checkbox" ? event.target.checked : event.target.value });
  const submit = async (event) => {
    event.preventDefault();
    setSaving(true); setError("");
    try {
      const payload = { ...form, price: Number(form.price), stock: Number(form.stock) };
      if (product) await productService.update(product.id, payload);
      else await productService.create(payload);
      onSaved();
    } catch (err) { setError(err.message); } finally { setSaving(false); }
  };
  return <dialog className="seller-dialog" ref={dialog} aria-labelledby="editor-title" onCancel={(event) => { event.preventDefault(); if (!saving) onClose(); }}>
    <form onSubmit={submit}>
      <div className="seller-section-heading"><div><p className="seller-eyebrow">CATÁLOGO</p><h2 id="editor-title">{product ? "Editar produto" : "Novo produto"}</h2></div><button type="button" className="seller-button" disabled={saving} onClick={onClose}>Fechar</button></div>
      {error && <p className="seller-notice error" role="alert">{error}</p>}
      <fieldset disabled={saving} className="seller-fields">
        <label>Nome do produto<input name="name" value={form.name} onChange={change} required autoFocus maxLength={160} /></label>
        <label>Descrição<textarea name="description" rows="3" value={form.description} onChange={change} /></label>
        <label>Categoria<input name="category" value={form.category} onChange={change} required /></label>
        <div className="seller-field-pair"><label>Preço (R$)<input name="price" type="number" min="0" step="0.01" value={form.price} onChange={change} required /></label><label>Unidades em estoque<input name="stock" type="number" min="0" step="1" value={form.stock} onChange={change} required /></label></div>
        <label>Endereço da imagem (opcional)<input name="imageUrl" type="url" placeholder="https://…" value={form.imageUrl} onChange={change} /></label>
        {product && <label className="seller-checkbox"><input name="active" type="checkbox" checked={form.active} onChange={change} />Produto ativo no catálogo</label>}
      </fieldset>
      <div className="seller-dialog-footer"><button className="seller-button" type="button" disabled={saving} onClick={onClose}>Cancelar</button><button className="seller-button primary" disabled={saving}>{saving ? "Salvando…" : "Salvar produto"}</button></div>
    </form>
  </dialog>;
}

function OrderDetails({ order, onClose, onSaved }) {
  const [status, setStatus] = useState(order.status);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const dialog = useRef(null);
  useEffect(() => { dialog.current.showModal(); }, []);
  const terminal = ["entregue", "cancelado"].includes(order.status);
  const multiVendor = Number(order.vendor_count) > 1;
  const choices = { processando: ["pago", "cancelado"], pago: ["em_transito", "cancelado"], em_transito: ["entregue"], entregue: [], cancelado: [] };
  const submit = async (event) => {
    event.preventDefault(); setSaving(true); setError("");
    try { await orderService.updateStatus(order.id, status); onSaved(); }
    catch (err) { setError(err.message); } finally { setSaving(false); }
  };
  return <dialog className="seller-dialog" ref={dialog} aria-labelledby="order-title" onCancel={(event) => { event.preventDefault(); if (!saving) onClose(); }}>
    <div className="seller-section-heading"><div><p className="seller-eyebrow">{date(order.created_at)}</p><h2 id="order-title">Pedido #{order.id}</h2></div><button className="seller-button" disabled={saving} onClick={onClose}>Fechar</button></div>
    <p>{order.customer_name || `Cliente #${order.customer_id}`}</p>
    <div className="seller-order-items">{(order.items || []).map(item => <div key={item.id}><span><strong>{item.product_name}</strong><small>{item.quantity} × {money(item.unit_price)}</small></span><strong>{money(item.subtotal)}</strong></div>)}</div>
    <div className="seller-section-heading"><span>Total dos seus produtos</span><strong>{money(vendorTotal(order))}</strong></div>
    <p className="seller-muted">Sem frete e sem itens de outras lojas.</p>
    {multiVendor && <p className="seller-notice">Este pedido envolve outras lojas. A alteração de status por loja ainda não está disponível.</p>}
    {error && <p role="alert" className="seller-notice error">{error}</p>}
    <form onSubmit={submit} className="seller-status-form"><label>Status do pedido<select value={status} onChange={e => setStatus(e.target.value)} disabled={saving || terminal || multiVendor}><option value={order.status}>{statuses[order.status]}</option>{(choices[order.status] || []).map(s => <option key={s} value={s}>{statuses[s]}</option>)}</select></label>
      {!terminal && !multiVendor && <><p className="seller-muted">Marque como pago apenas após confirmar o recebimento. Cancelar não repõe o estoque automaticamente.</p><button className="seller-button primary" disabled={saving || status === order.status}>{saving ? "Atualizando…" : "Atualizar status"}</button></>}
    </form>
  </dialog>;
}

export default function VendorDashboardPage({ onNavigate, onLogout, user }) {
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [tab, setTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [editor, setEditor] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [query, setQuery] = useState("");
  const [productFilter, setProductFilter] = useState("all");
  const [orderFilter, setOrderFilter] = useState("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const load = async () => {
    setLoading(true); setError("");
    try { const [p, o] = await Promise.all([productService.mine(), orderService.mineVendor()]); setProducts(p.products); setOrders(o.orders); }
    catch (err) { setError(err.message); } finally { setLoading(false); }
  };
  useEffect(() => { let active = true; Promise.all([productService.mine(), orderService.mineVendor()]).then(([p, o]) => { if (active) { setProducts(p.products); setOrders(o.orders); } }).catch(err => { if (active) setError(err.message); }).finally(() => { if (active) setLoading(false); }); return () => { active = false; }; }, []);
  const saved = (message) => { setEditor(null); setSelectedOrder(null); setNotice(message); void load(); };
  const activeProducts = products.filter(p => Boolean(p.active));
  const lowStock = activeProducts.filter(p => p.stock <= 5).sort((a, b) => a.stock - b.stock);
  const openOrders = orders.filter(o => !["cancelado", "entregue"].includes(o.status));
  const value = orders.filter(o => o.status !== "cancelado").reduce((sum, o) => sum + vendorTotal(o), 0);
  const filteredProducts = products.filter(p => `${p.name} ${p.category}`.toLocaleLowerCase("pt-BR").includes(query.toLocaleLowerCase("pt-BR")) && (productFilter === "all" || (productFilter === "active" && p.active) || (productFilter === "inactive" && !p.active) || (productFilter === "low" && p.active && p.stock <= 5)));
  const filteredOrders = orders.filter(o => (orderFilter === "all" || o.status === orderFilter) && (!from || new Date(o.created_at) >= new Date(`${from}T00:00:00`)) && (!to || new Date(o.created_at) <= new Date(`${to}T23:59:59.999`)));
  const shownOrders = tab === "overview" ? orders.slice(0, 5) : filteredOrders;
  const metrics = [["Pedidos em aberto", openOrders.length, "Aguardando conclusão"], ["Valor dos pedidos", money(value), "Seus itens • sem frete e cancelados"], ["Produtos ativos", activeProducts.length, `${products.length} cadastrados no total`], ["Estoque baixo", lowStock.length, "Produtos com até 5 unidades"]];
  return <div className="seller-page"><div className="seller-shell">
    <header className="seller-header"><div className="seller-identity"><span className="seller-avatar">{(user?.name || "Loja").slice(0, 2).toUpperCase()}</span><div><p className="seller-eyebrow">CENTRAL DO VENDEDOR</p><h1>{user?.name || "Minha loja"}</h1></div></div><div className="seller-actions"><button className="seller-button" onClick={() => onNavigate("vendor")}>Ver loja</button><button className="seller-button primary" onClick={() => setEditor({ product: null })}>+ Novo produto</button><button className="seller-button quiet" onClick={onLogout}>Sair</button></div></header>
    <nav className="seller-nav" aria-label="Painel do vendedor">{[["overview", "Visão geral"], ["orders", "Pedidos"], ["products", "Produtos"]].map(([key, label]) => <button key={key} aria-current={tab === key ? "page" : undefined} onClick={() => setTab(key)}>{label}</button>)}</nav>
    <div className="seller-title"><div><h2>{({ overview: "Sua loja em um só lugar", orders: "Gerencie seus pedidos", products: "Seu catálogo de produtos" })[tab]}</h2><p className="seller-muted">{tab === "overview" ? "Acompanhe a operação e veja o que precisa da sua atenção." : "Consulte os dados e mantenha sua loja atualizada."}</p></div><button className="seller-button" disabled={loading} onClick={load}>{loading ? "Carregando…" : "Atualizar dados"}</button></div>
    {error && <p className="seller-notice error" role="alert">{error} Tente atualizar os dados.</p>}
    {notice && <p className="seller-notice success" role="status">{notice}<button onClick={() => setNotice("")} aria-label="Fechar mensagem">×</button></p>}
    {loading ? <div className="seller-empty" role="status">Carregando produtos e pedidos…</div> : error ? null : <>
    {tab === "overview" && <section className="seller-metrics" aria-label="Resumo de todo o período">{metrics.map(([label, count, detail]) => <article key={label}><p>{label}</p><strong>{count}</strong><small>{detail}</small></article>)}</section>}
    <div className={tab === "overview" ? "seller-overview" : ""}>
    {tab !== "products" && <section className="seller-panel"><div className="seller-section-heading"><div><h3>{tab === "overview" ? "Pedidos recentes" : "Pedidos"}</h3><p className="seller-muted">Valores dos seus produtos, sem frete.</p></div>{tab === "overview" && <button className="seller-link" onClick={() => setTab("orders")}>Ver todos ({orders.length})</button>}</div>
      {tab === "orders" && <div className="seller-filters"><label>Status<select value={orderFilter} onChange={e => setOrderFilter(e.target.value)}><option value="all">Todos os status</option>{Object.entries(statuses).map(([s, label]) => <option key={s} value={s}>{label}</option>)}</select></label><label>De<input type="date" value={from} max={to || undefined} onChange={e => setFrom(e.target.value)} /></label><label>Até<input type="date" value={to} min={from || undefined} onChange={e => setTo(e.target.value)} /></label></div>}
      {shownOrders.length ? <div className="seller-orders">{shownOrders.map(o => <article className="seller-order" key={o.id}><div><strong>Pedido #{o.id}</strong><small>{o.customer_name || `Cliente #${o.customer_id}`}</small><small>{date(o.created_at)}</small></div><span className={`seller-badge ${o.status}`}>{statuses[o.status] || o.status}</span><strong>{money(vendorTotal(o))}</strong><button className="seller-button" onClick={() => setSelectedOrder(o)}>Detalhes</button></article>)}</div> : <div className="seller-empty"><h3>{orders.length ? "Nenhum pedido neste filtro" : "Seus pedidos aparecerão aqui"}</h3><p>Quando uma compra for registrada, acompanhe os itens e o andamento por aqui.</p></div>}
    </section>}
    {tab === "overview" && <aside className="seller-panel"><div className="seller-section-heading"><h3>Atenção ao estoque</h3><span className="seller-count">{lowStock.length}</span></div><p className="seller-muted">Produtos ativos com até 5 unidades.</p>{lowStock.length ? <div className="seller-stock">{lowStock.slice(0, 5).map(p => <div key={p.id}><span><strong>{p.name}</strong><small className={p.stock === 0 ? "seller-danger" : ""}>{p.stock === 0 ? "Esgotado" : `${p.stock} unidades disponíveis`}</small></span><button className="seller-link" onClick={() => setEditor({ product: p })}>Repor</button></div>)}<button className="seller-button" onClick={() => { setProductFilter("low"); setTab("products"); }}>Ver produtos com estoque baixo</button></div> : <div className="seller-empty"><h3>{products.length ? "Estoque em dia" : "Comece pelo primeiro produto"}</h3><p>{products.length ? "Nenhum produto ativo precisa de reposição." : "Cadastre nome, preço e quantidade para começar."}</p>{!products.length && <button className="seller-button primary" onClick={() => setEditor({ product: null })}>Cadastrar produto</button>}</div>}</aside>}
    </div>
    {tab === "products" && <section className="seller-panel"><div className="seller-filters"><label className="seller-search">Buscar produto<input type="search" placeholder="Nome ou categoria" value={query} onChange={e => setQuery(e.target.value)} /></label><label>Disponibilidade<select value={productFilter} onChange={e => setProductFilter(e.target.value)}><option value="all">Todos os produtos</option><option value="active">Ativos</option><option value="inactive">Inativos</option><option value="low">Estoque baixo / esgotado</option></select></label></div><p className="seller-muted">{filteredProducts.length} produto(s) encontrado(s)</p><div className="seller-products">{filteredProducts.map(p => <article className="seller-product" key={p.id}><div className="seller-thumbnail">{p.image_url ? <img src={p.image_url} alt="" loading="lazy" onError={e => { e.currentTarget.style.display = "none"; }} /> : <span aria-hidden="true">▧</span>}</div><div className="seller-product-info"><h3>{p.name}</h3><p>{p.category}</p><span className={`seller-badge ${!p.active ? "cancelado" : p.stock === 0 ? "processando" : "entregue"}`}>{!p.active ? "Inativo" : p.stock === 0 ? "Esgotado" : "Ativo"}</span></div><div><strong>{money(p.price)}</strong><small>{p.stock} em estoque</small></div><button className="seller-button" onClick={() => setEditor({ product: p })}>Editar produto</button></article>)}</div>{!filteredProducts.length && <div className="seller-empty"><h3>{products.length ? "Nenhum produto encontrado" : "Seu catálogo começa aqui"}</h3><p>{products.length ? "Ajuste a busca ou o filtro de disponibilidade." : "Use Novo produto para cadastrar o primeiro item da loja."}</p></div>}</section>}
    </>}
    <footer className="seller-footer">AppSoft Marketplace · Central do vendedor</footer>
    {editor && <ProductEditor product={editor.product} onClose={() => setEditor(null)} onSaved={() => saved("Produto salvo com sucesso.")} />}
    {selectedOrder && <OrderDetails order={selectedOrder} onClose={() => setSelectedOrder(null)} onSaved={() => saved("Status do pedido atualizado.")} />}
  </div></div>;
}
