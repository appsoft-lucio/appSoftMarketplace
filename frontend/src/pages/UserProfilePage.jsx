import Button from "../components/Button";
import "./ProfilePage.css";

const pedidosRecentes = [
  {
    id: "#1048",
    produto: "AirPods Pro",
    status: "Em trânsito",
    valor: "R$ 1.299,00",
  },
  {
    id: "#2041",
    produto: "Tênis Runner",
    status: "Entregue",
    valor: "R$ 329,90",
  },
  {
    id: "#3099",
    produto: "Cafeteira Deluxe",
    status: "Em preparo",
    valor: "R$ 499,90",
  },
];

const favoritos = ["Smart Watch X", "Relógio Smart", "Notebook Lite"];

const enderecos = [
  "Rua das Flores, 150 - Centro, São Paulo/SP",
  "Avenida Paulista, 820 - Bela Vista, São Paulo/SP",
];

function UserProfilePage({ onNavigate }) {
  return (
    <div className="profile-page">
      <div className="profile-shell">
        <header className="profile-topbar">
          <button
            type="button"
            className="back-link"
            onClick={() => onNavigate("home")}
          >
            ← Voltar
          </button>

          <Button variant="primary" onClick={() => onNavigate("home")}>
            Explorar loja
          </Button>
        </header>

        <div className="profile-layout">
          <aside className="profile-card profile-summary">
            <div className="avatar">AM</div>

            <div className="profile-meta">
              <h1>Ana Maria</h1>
              <p>ana.maria@appsoft.com</p>
              <span className="profile-badge">Cliente premium</span>
            </div>

            <div className="profile-stats">
              <div>
                <strong>24</strong>
                <span>pedidos</span>
              </div>
              <div>
                <strong>8</strong>
                <span>avaliações</span>
              </div>
              <div>
                <strong>1.280</strong>
                <span>pontos</span>
              </div>
            </div>
          </aside>

          <main className="profile-main">
            <section className="profile-card">
              <div className="section-header">
                <h2>Pedidos recentes</h2>
                <button
                  type="button"
                  className="text-link"
                  onClick={() => onNavigate("home")}
                >
                  Ver todos
                </button>
              </div>

              <div className="orders-list">
                {pedidosRecentes.map((pedido) => (
                  <div key={pedido.id} className="order-item">
                    <div>
                      <span className="order-id">{pedido.id}</span>
                      <h3>{pedido.produto}</h3>
                    </div>

                    <span className="order-status">{pedido.status}</span>
                    <strong>{pedido.valor}</strong>
                  </div>
                ))}
              </div>
            </section>

            <section className="profile-card">
              <div className="section-header">
                <h2>Favoritos</h2>
                <button
                  type="button"
                  className="text-link"
                  onClick={() => onNavigate("home")}
                >
                  Ver mais
                </button>
              </div>

              <div className="favorites-list">
                {favoritos.map((item) => (
                  <div key={item} className="favorite-item">
                    <span className="favorite-dot" />
                    {item}
                  </div>
                ))}
              </div>
            </section>
          </main>

          <aside className="profile-card address-panel">
            <div className="section-header">
              <h2>Endereços</h2>
              <button
                type="button"
                className="text-link"
                onClick={() => onNavigate("home")}
              >
                Novo
              </button>
            </div>

            <ul className="address-list">
              {enderecos.map((endereco) => (
                <li key={endereco}>{endereco}</li>
              ))}
            </ul>
          </aside>
        </div>
      </div>
    </div>
  );
}

export default UserProfilePage;
