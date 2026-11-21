import { useEffect, useState } from "react";
import Button from "../components/Button";
import { productService } from "../services/products";
import { orderService } from "../services/orders";
import "./VendorDashboardPage.css";

function VendorDashboardPage({ onNavigate, onLogout }) {
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "",
    category: "",
    stock: "",
  });
  const [error, setError] = useState("");

  const loadDashboard = async () => {
    try {
      const [productData, orderData] = await Promise.all([
        productService.mine(),
        orderService.mineVendor(),
      ]);
      setProducts(productData.products);
      setOrders(orderData.orders);
      setError("");
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      await productService.create({
        ...form,
        price: Number(form.price),
        stock: Number(form.stock),
      });
      setForm({
        name: "",
        description: "",
        price: "",
        category: "",
        stock: "",
      });
      setShowForm(false);
      await loadDashboard();
    } catch (requestError) {
      setError(requestError.message);
    }
  };

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
            <Button variant="primary" onClick={() => setShowForm(true)}>
              Novo produto
            </Button>
            <Button variant="primary" onClick={() => onNavigate("vendor")}>
              Loja
            </Button>
            <Button
              variant="light"
              onClick={onLogout || (() => onNavigate("login"))}
            >
              Sair
            </Button>
          </div>
        </header>

        {error && <p className="error-message">{error}</p>}

        {showForm && (
          <section className="panel-card product-form-panel">
            <div className="panel-header">
              <h2>Cadastrar produto</h2>
              <button
                type="button"
                className="text-link"
                onClick={() => setShowForm(false)}
              >
                Fechar
              </button>
            </div>

            <form className="auth-form" onSubmit={handleSubmit}>
              <label className="field-group">
                <span>Nome</span>
                <input
                  value={form.name}
                  onChange={(event) =>
                    setForm({ ...form, name: event.target.value })
                  }
                  required
                />
              </label>
              <label className="field-group">
                <span>Descrição</span>
                <input
                  value={form.description}
                  onChange={(event) =>
                    setForm({ ...form, description: event.target.value })
                  }
                />
              </label>
              <label className="field-group">
                <span>Categoria</span>
                <input
                  value={form.category}
                  onChange={(event) =>
                    setForm({ ...form, category: event.target.value })
                  }
                  required
                />
              </label>
              <label className="field-group">
                <span>Preço</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.price}
                  onChange={(event) =>
                    setForm({ ...form, price: event.target.value })
                  }
                  required
                />
              </label>
              <label className="field-group">
                <span>Estoque</span>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={form.stock}
                  onChange={(event) =>
                    setForm({ ...form, stock: event.target.value })
                  }
                  required
                />
              </label>
              <Button variant="primary" type="submit">
                Cadastrar
              </Button>
            </form>
          </section>
        )}

        <section className="metrics-grid">
          <article className="metric-card">
            <span>Produtos cadastrados</span>
            <strong>{products.length}</strong>
            <small>Estoque ativo</small>
          </article>
          <article className="metric-card">
            <span>Pedidos</span>
            <strong>{orders.length}</strong>
            <small>Pedidos recebidos</small>
          </article>
          <article className="metric-card">
            <span>Itens em estoque</span>
            <strong>
              {products.reduce((total, product) => total + product.stock, 0)}
            </strong>
            <small>Disponíveis</small>
          </article>
          <article className="metric-card">
            <span>Faturamento</span>
            <strong>
              R${" "}
              {orders
                .reduce((total, order) => total + order.total, 0)
                .toFixed(2)}
            </strong>
            <small>Pedidos registrados</small>
          </article>
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
                  {orders.map((pedido) => (
                    <tr key={pedido.id}>
                      <td>{pedido.id}</td>
                      <td>Cliente #{pedido.customer_id}</td>
                      <td>R$ {pedido.total.toFixed(2)}</td>
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
              {products.map((item) => (
                <div key={item.id} className="stock-row">
                  <div>
                    <strong>{item.name}</strong>
                    <span>
                      #{item.id} • {item.category}
                    </span>
                  </div>
                  <span className="stock-qty">{item.stock} em estoque</span>
                </div>
              ))}
            </div>
          </article>
        </section>

        <section className="panel-card top-products-panel">
          <div className="panel-header">
            <h2>Meus produtos</h2>
          </div>

          <div className="products-list">
            {products.map((produto) => (
              <div key={produto.id} className="product-row">
                <div>
                  <h3>{produto.name}</h3>
                  <span>{produto.category}</span>
                </div>
                <strong>R$ {produto.price.toFixed(2)}</strong>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

export default VendorDashboardPage;
