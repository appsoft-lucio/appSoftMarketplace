import "./App.css";

// Lista de categorias do marketplace
const categorias = [
  "Eletrônicos",
  "Casa",
  "Moda",
  "Esportes",
  "Beleza",
  "Livros",
];

// Lista de produtos em destaque
const produtos = [
  {
    id: 1,
    nome: "AirPods Pro",
    preco: 1299.0,
    categoria: "Eletrônicos",
    cor: "azul",
  },
  {
    id: 2,
    nome: "Cafeteira Deluxe",
    preco: 499.9,
    categoria: "Casa",
    cor: "laranja",
  },
  {
    id: 3,
    nome: "Tênis Runner",
    preco: 329.9,
    categoria: "Esportes",
    cor: "verde",
  },
  {
    id: 4,
    nome: "Relógio Smart",
    preco: 899.0,
    categoria: "Moda",
    cor: "roxo",
  },
];

function App() {
  return (
    <div className="marketplace">
      {/* Cabeçalho principal da página */}
      <header className="topbar">
        {/* Logo da marca */}
        <div className="logo">AppSoft</div>

        {/* Menu de navegação */}
        <nav className="menu">
          <a href="#">Início</a>
          <a href="#">Categorias</a>
          <a href="#">Ofertas</a>
          <a href="#">Vendedores</a>
        </nav>

        {/* Área de ações: login e carrinho */}
        <div className="actions">
          <button className="btn btn-light">Entrar</button>
          <button className="btn btn-primary">Carrinho (2)</button>
        </div>
      </header>

      {/* Conteúdo principal da página */}
      <main className="container">
        {/* Banner principal com apresentação da loja */}
        <section className="hero">
          <div className="hero-text">
            <span className="badge">Loja digital</span>

            <h1>Seu marketplace favorito em um só lugar</h1>

            <p>
              Encontre produtos incríveis, ofertas exclusivas e vendedores
              confiáveis.
            </p>

            <div className="hero-actions">
              <button className="btn btn-primary">Comprar agora</button>
              <button className="btn btn-light">Ver ofertas</button>
            </div>

            <div className="stats">
              <div>
                <strong>20k+</strong>
                <span>clientes</span>
              </div>

              <div>
                <strong>1.2k</strong>
                <span>produtos</span>
              </div>

              <div>
                <strong>4.9/5</strong>
                <span>avaliação</span>
              </div>
            </div>
          </div>

          {/* Card lateral com oferta do dia */}
          <div className="hero-card">
            <div className="card-header">
              <span>Oferta do dia</span>
              <span className="discount">-30%</span>
            </div>

            <div className="product-preview">
              <div className="product-image azul"></div>

              <div className="product-info">
                <h3>Smart Watch X</h3>
                <p>R$ 899,00</p>
              </div>
            </div>

            <div className="mini-list">
              <span>Entrega em 48h</span>
              <span>Pagamento seguro</span>
            </div>
          </div>
        </section>

        {/* Seção de categorias */}
        <section className="categories">
          <div className="section-title">
            <h2>Categorias</h2>
          </div>

          <div className="category-grid">
            {categorias.map((categoria) => (
              <div key={categoria} className="category-item">
                {categoria}
              </div>
            ))}
          </div>
        </section>

        {/* Seção de produtos em destaque */}
        <section className="products">
          <div className="section-title">
            <h2>Produtos em destaque</h2>
            <a href="#">Ver todos</a>
          </div>

          <div className="product-grid">
            {produtos.map((produto) => (
              <article key={produto.id} className="product-card">
                {/* Área que simula a imagem do produto */}
                <div className={`product-thumb ${produto.cor}`}></div>

                <div className="product-body">
                  <span className="tag">{produto.categoria}</span>
                  <h3>{produto.nome}</h3>

                  <div className="product-footer">
                    <strong>R$ {produto.preco.toFixed(2)}</strong>
                    <button>Comprar</button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;
