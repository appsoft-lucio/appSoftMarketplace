import Button from "../components/Button";
import "./VendorPage.css";

const produtosVendidos = [
  { id: 1, nome: "Smart Watch X", preco: "R$ 899,00", status: "Mais vendido" },
  { id: 2, nome: "Notebook Lite", preco: "R$ 2.499,00", status: "Novo" },
  { id: 3, nome: "Caixa de Som Mini", preco: "R$ 349,90", status: "Trending" },
];

const metragem = [
  { label: "Vendas no mês", value: "1.284" },
  { label: "Avaliação", value: "4.9/5" },
  { label: "Tempo médio", value: "24h" },
];

function VendorPage({ onNavigate }) {
  return (
    <div className="vendor-page">
      <div className="vendor-shell">
        <header className="vendor-topbar">
          <button
            type="button"
            className="back-link"
            onClick={() => onNavigate("home")}
          >
            ← Voltar
          </button>

          <div className="profile-actions">
            <Button
              variant="primary"
              onClick={() => onNavigate("vendor-dashboard")}
            >
              Dashboard
            </Button>
            <Button variant="light" onClick={() => onNavigate("home")}>
              Ver catálogo
            </Button>
            <Button variant="light" onClick={() => onNavigate("login")}>
              Sair
            </Button>
          </div>
        </header>

        <section className="vendor-hero">
          <div className="vendor-cover">
            <span>Loja oficial</span>
          </div>

          <div className="vendor-main">
            <div className="vendor-brand">
              <div className="vendor-logo">TN</div>
              <div>
                <h1>TechNova</h1>
                <p>Eletrônicos e gadgets premium</p>
              </div>
            </div>

            <div className="vendor-stats">
              {metragem.map((item) => (
                <div key={item.label} className="vendor-stat">
                  <strong>{item.value}</strong>
                  <span>{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <div className="vendor-layout">
          <section className="vendor-card vendor-about">
            <h2>Sobre a loja</h2>
            <p>
              A TechNova combina tecnologia, design e atendimento de alto nível,
              com foco em produtos inovadores para o dia a dia digital.
            </p>

            <ul>
              <li>Entrega em até 48h para capitais</li>
              <li>Suporte técnico por chat e WhatsApp</li>
              <li>Garantia oficial em todos os itens</li>
            </ul>
          </section>

          <section className="vendor-card vendor-products">
            <div className="section-header">
              <h2>Produtos mais vendidos</h2>
              <button
                type="button"
                className="text-link"
                onClick={() => onNavigate("home")}
              >
                Ver todos
              </button>
            </div>

            <div className="product-list">
              {produtosVendidos.map((produto) => (
                <article key={produto.id} className="vendor-product-item">
                  <div className="vendor-product-thumb" />
                  <div className="vendor-product-copy">
                    <span>{produto.status}</span>
                    <h3>{produto.nome}</h3>
                    <strong>{produto.preco}</strong>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

export default VendorPage;
