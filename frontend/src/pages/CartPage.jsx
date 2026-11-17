import Button from "../components/Button";
import "./AuthPages.css";

function CartPage({ items, onNavigate, onUpdateQuantity, onRemoveItem }) {
  const subtotal = items.reduce(
    (total, item) => total + item.preco * item.quantity,
    0,
  );

  return (
    <div className="cart-page">
      <div className="cart-shell">
        <div className="cart-header">
          <button
            type="button"
            className="back-link"
            onClick={() => onNavigate("home")}
          >
            ← Continuar comprando
          </button>
          <h1>Carrinho</h1>
        </div>

        {items.length === 0 ? (
          <div className="empty-cart">
            <h3>Seu carrinho está vazio.</h3>
            <p>Adicione alguns itens para começar suas compras.</p>
            <Button variant="primary" onClick={() => onNavigate("home")}>
              Explorar produtos
            </Button>
          </div>
        ) : (
          <div className="cart-layout">
            <div className="cart-items">
              {items.map((item) => (
                <div key={item.id} className="cart-item">
                  <div className={`cart-thumb ${item.cor}`}></div>

                  <div>
                    <h3>{item.nome}</h3>
                    <p>{item.categoria}</p>

                    <div className="cart-controls">
                      <button
                        type="button"
                        className="quantity-btn"
                        onClick={() =>
                          onUpdateQuantity(item.id, item.quantity - 1)
                        }
                      >
                        −
                      </button>

                      <span>{item.quantity}</span>

                      <button
                        type="button"
                        className="quantity-btn"
                        onClick={() =>
                          onUpdateQuantity(item.id, item.quantity + 1)
                        }
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div className="item-total">
                    <strong>
                      R$ {(item.preco * item.quantity).toFixed(2)}
                    </strong>
                    <button
                      type="button"
                      className="remove-btn"
                      onClick={() => onRemoveItem(item.id)}
                    >
                      Remover
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <aside className="summary-card">
              <h3>Resumo</h3>

              <div className="summary-row">
                <span>Subtotal</span>
                <strong>R$ {subtotal.toFixed(2)}</strong>
              </div>

              <div className="summary-row">
                <span>Frete</span>
                <strong>R$ 25,00</strong>
              </div>

              <div className="summary-row total">
                <span>Total</span>
                <strong>R$ {(subtotal + 25).toFixed(2)}</strong>
              </div>

              <Button variant="primary" onClick={() => onNavigate("login")}>
                Finalizar compra
              </Button>
            </aside>
          </div>
        )}
      </div>
    </div>
  );
}

export default CartPage;
