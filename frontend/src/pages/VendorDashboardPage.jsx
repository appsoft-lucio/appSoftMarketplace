import Button from "../components/Button";
import "./VendorDashboardPage.css";

const metrics = [
  { label: "Vendas do mês", value: "R$ 31.240", delta: "+18%" },
  { label: "Pedidos", value: "1.284", delta: "+12%" },
  { label: "Clientes ativos", value: "842", delta: "+8%" },
  { label: "Taxa de conversão", value: "6,4%", delta: "+1,2%" },
];

const recentOrders = [
  {
    id: "#1048",
    cliente: "Ana M.",
    total: "R$ 1.299,00",
    status: "Em trânsito",
  },
  { id: "#1049", cliente: "Pedro R.", total: "R$ 899,00", status: "Pago" },
  { id: "#1050", cliente: "Lia S.", total: "R$ 349,90", status: "Processando" },
  {
    id: "#1051",
    cliente: "Marcos T.",
    total: "R$ 2.499,00",
    status: "Entregue",
  },
];

const stockItems = [
  { produto: "Smart Watch X", sku: "SWX-204", qtd: 42 },
  { produto: "Notebook Lite", sku: "NBL-092", qtd: 18 },
  { produto: "Caixa de Som Mini", sku: "CSM-774", qtd: 31 },
  { produto: "AirPods Pro", sku: "APP-120", qtd: 16 },
];

const products = [
  { nome: "Smart Watch X", vendas: 312, faturamento: "R$ 18.400" },
  { nome: "Notebook Lite", vendas: 118, faturamento: "R$ 19.200" },
  { nome: "Caixa de Som Mini", vendas: 186, faturamento: "R$ 9.460" },
];

function VendorDashboardPage({ onNavigate }) {
  return (
    <div className="dashboard-page">
      <div className="dashboard-shell">
        <header className="dashboard-header">
          <div>
            <button
              type="button"
              className="back-link"
              onClick={() => onNavigate("vendor")}
            >
              ← Voltar
            </button>
            <h1>Dashboard do vendedor</h1>
          </div>

          <div className="dashboard-actions">
            <Button variant="primary" onClick={() => onNavigate("vendor")}>
              Loja
            </Button>
            <Button variant="light" onClick={() => onNavigate("login")}>
              Sair
            </Button>
          </div>
        </header>

        <section className="metrics-grid">
          {metrics.map((metric) => (
            <article key={metric.label} className="metric-card">
              <span>{metric.label}</span>
              <strong>{metric.value}</strong>
              <small>{metric.delta}</small>
            </article>
          ))}
        </section>

        <section className="dashboard-grid">
          <article className="panel-card orders-panel">
            <div className="panel-header">
              <h2>Pedidos recentes</h2>
              <button
                type="button"
                className="text-link"
                onClick={() => onNavigate("vendor")}
              >
                Ver tudo
              </button>
            </div>

            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Pedido</th>
                    <th>Cliente</th>
                    <th>Total</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((pedido) => (
                    <tr key={pedido.id}>
                      <td>{pedido.id}</td>
                      <td>{pedido.cliente}</td>
                      <td>{pedido.total}</td>
                      <td>
                        <span className="status-badge">{pedido.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </article>

          <article className="panel-card stock-panel">
            <div className="panel-header">
              <h2>Estoque</h2>
              <button
                type="button"
                className="text-link"
                onClick={() => onNavigate("vendor")}
              >
                Ajustar
              </button>
            </div>

            <div className="stock-list">
              {stockItems.map((item) => (
                <div key={item.sku} className="stock-row">
                  <div>
                    <strong>{item.produto}</strong>
                    <span>{item.sku}</span>
                  </div>
                  <span className="stock-qty">{item.qtd} em estoque</span>
                </div>
              ))}
            </div>
          </article>
        </section>

        <section className="panel-card top-products-panel">
          <div className="panel-header">
            <h2>Produtos em alta</h2>
            <button
              type="button"
              className="text-link"
              onClick={() => onNavigate("vendor")}
            >
              Relatório
            </button>
          </div>

          <div className="products-list">
            {products.map((produto) => (
              <div key={produto.nome} className="product-row">
                <div>
                  <h3>{produto.nome}</h3>
                  <span>{produto.vendas} vendas</span>
                </div>
                <strong>{produto.faturamento}</strong>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

export default VendorDashboardPage;
