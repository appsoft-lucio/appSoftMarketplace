import { useEffect, useState } from "react";
import Button from "../components/Button";
import { orderService } from "../services/orders";
import "./ProfilePage.css";

const favoritos = ["Smart Watch X", "Relógio Smart", "Notebook Lite"];

const enderecos = [
  "Rua das Flores, 150 - Centro, São Paulo/SP",
  "Avenida Paulista, 820 - Bela Vista, São Paulo/SP",
];

function UserProfilePage({ onNavigate, user, onLogout }) {
  const [pedidos, setPedidos] = useState([]);

  useEffect(() => {
    orderService
      .mine()
      .then((data) => setPedidos(data.orders))
      .catch(() => setPedidos([]));
  }, []);

  const iniciais =
    user?.name
      ?.split(" ")
      .map((parte) => parte[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "US";

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

          <div className="profile-actions">
            <Button variant="primary" onClick={() => onNavigate("home")}>
              Explorar loja
            </Button>
            <Button
              variant="light"
              onClick={onLogout || (() => onNavigate("login"))}
            >
              Sair
            </Button>
          </div>
        </header>

        <div className="profile-layout">
          <aside className="profile-card profile-summary">
            <div className="avatar">{iniciais}</div>

            <div className="profile-meta">
              <h1>{user?.name || "Usuário"}</h1>
              <p>{user?.email || ""}</p>
              <span className="profile-badge">Cliente premium</span>
            </div>

            <div className="profile-stats">
              <div>
                <strong>{pedidos.length}</strong>
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
                {pedidos.map((pedido) => (
                  <div key={pedido.id} className="order-item">
                    <div>
                      <span className="order-id">#{pedido.id}</span>
                      <h3>{pedido.items?.[0]?.product_name || "Pedido"}</h3>
                    </div>

                    <span className="order-status">{pedido.status}</span>
                    <strong>R$ {pedido.total.toFixed(2)}</strong>
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
