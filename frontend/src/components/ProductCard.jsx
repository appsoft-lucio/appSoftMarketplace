import Button from "./Button";

function ProductCard({ produto, onAddToCart }) {
  return (
    <article className="product-card">
      <div className={`product-thumb ${produto.cor}`}></div>

      <div className="product-body">
        <span className="tag">{produto.categoria}</span>
        <h3>{produto.nome}</h3>

        <div className="product-footer">
          <strong>R$ {produto.preco.toFixed(2)}</strong>
          <Button variant="dark" onClick={() => onAddToCart(produto)}>
            Comprar
          </Button>
        </div>
      </div>
    </article>
  );
}

export default ProductCard;
