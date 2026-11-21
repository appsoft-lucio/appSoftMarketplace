import { useEffect, useState } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import Button from "../components/Button";
import ProductCard from "../components/ProductCard";
import { productService } from "../services/products";
import "./HomePage.css";

const categorias = [
  "Eletrônicos",
  "Casa",
  "Moda",
  "Esportes",
  "Beleza",
  "Livros",
];

const ofertas = [
  {
    id: 1,
    nome: "Smart Watch X",
    preco: "R$ 899,00",
    desconto: "-30%",
    cor: "azul",
    entrega: "Entrega em 48h",
    pagamento: "Pagamento seguro",
  },
  {
    id: 2,
    nome: "Cafeteira Deluxe",
    preco: "R$ 499,90",
    desconto: "-20%",
    cor: "laranja",
    entrega: "Frete grátis",
    pagamento: "Parcelamento em até 12x",
  },
  {
    id: 3,
    nome: "Tênis Runner",
    preco: "R$ 329,90",
    desconto: "-25%",
    cor: "verde",
    entrega: "Entrega em 24h",
    pagamento: "Compra protegida",
  },
];

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

const lojas = [
  {
    id: 1,
    nome: "TechNova",
    categoria: "Eletrônicos",
    destaque: "A melhor seleção em tecnologia",
    cor: "azul",
  },
  {
    id: 2,
    nome: "HomeStyle",
    categoria: "Casa",
    destaque: "Design e conforto para sua casa",
    cor: "laranja",
  },
  {
    id: 3,
    nome: "SportLife",
    categoria: "Esportes",
    destaque: "Performance para viver ativo",
    cor: "verde",
  },
  {
    id: 4,
    nome: "Fashion Hub",
    categoria: "Moda",
    destaque: "Estilo que acompanha você",
    cor: "roxo",
  },
];

const marcasParceiras = [
  "Samsung",
  "Apple",
  "Nike",
  "Adidas",
  "Sony",
  "Xiaomi",
  "Intel",
  "Amazon",
];

const avaliacoes = [
  {
    id: 1,
    nome: "Ana M.",
    produto: "AirPods Pro",
    texto: "Entrega rápida, produto impecável e atendimento muito ágil.",
    nota: 5,
  },
  {
    id: 2,
    nome: "Carlos S.",
    produto: "Cafeteira Deluxe",
    texto: "A loja entregou exatamente o que prometeu. Ótima qualidade!",
    nota: 5,
  },
  {
    id: 3,
    nome: "Paula R.",
    produto: "Tênis Runner",
    texto: "Compra simples, preço justo e a experiência foi muito boa.",
    nota: 4,
  },
];

function HomePage({ onNavigate, cartCount, onAddToCart, onLogout }) {
  const [slideAtivo, setSlideAtivo] = useState(0);
  const [produtosApi, setProdutosApi] = useState([]);
  const [termoBusca, setTermoBusca] = useState("");
  const [indiceProdutos, setIndiceProdutos] = useState(0);
  const [indiceLojas, setIndiceLojas] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setSlideAtivo((atual) => (atual + 1) % ofertas.length);
    }, 3000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    productService
      .list()
      .then((data) => {
        const reais = data.products.map((produto) => ({
          id: produto.id,
          nome: produto.name,
          preco: produto.price,
          categoria: produto.category,
          cor: "azul",
          stock: produto.stock,
          descricao: produto.description || "",
        }));
        setProdutosApi(reais);
      })
      .catch(() => setProdutosApi([]));
  }, []);

  useEffect(() => {
    if (termoBusca.trim()) return;
    const base = produtosApi.length > 0 ? produtosApi : produtos;
    const timer = setInterval(() => {
      setIndiceProdutos((atual) => (atual + 1) % base.length);
    }, 5000);

    return () => clearInterval(timer);
  }, [produtosApi, termoBusca]);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndiceLojas((atual) => (atual + 1) % lojas.length);
    }, 4500);

    return () => clearInterval(timer);
  }, []);

  const atualizarBusca = (value) => {
    setTermoBusca(value);
    setIndiceProdutos(0);
  };

  const ofertaAtual = ofertas[slideAtivo];
  const produtosBaseCompletos = produtosApi.length > 0 ? produtosApi : produtos;
  const termoNormalizado = termoBusca.trim().toLowerCase();
  const produtosBase = termoNormalizado
    ? produtosBaseCompletos.filter((produto) =>
        `${produto.nome} ${produto.categoria} ${produto.descricao || ""}`
          .toLowerCase()
          .includes(termoNormalizado),
      )
    : produtosBaseCompletos;
  const quantidadeVisivel = Math.min(4, produtosBase.length);
  const produtosVisiveis = termoNormalizado ? produtosBase : Array.from(
    { length: quantidadeVisivel },
    (_, index) => {
      return produtosBase[(indiceProdutos + index) % produtosBase.length];
    },
  );
  const lojasVisiveis = Array.from({ length: 4 }, (_, index) => {
    return lojas[(indiceLojas + index) % lojas.length];
  });

  return (
    <div className="marketplace">
      <Header
        onNavigate={onNavigate}
        cartCount={cartCount}
        onLogout={onLogout}
        searchValue={termoBusca}
        onSearchChange={atualizarBusca}
      />

      <main className="container">
        {!termoNormalizado && <>
        <section className="hero">
          <div className="hero-text">
            <span className="badge">Loja digital</span>
            <h1>Seu marketplace favorito em um só lugar</h1>
            <p>
              Encontre produtos incríveis, suporte rápido e ofertas exclusivas
              de vendedores confiáveis.
            </p>

            <div className="hero-actions">
              <Button variant="primary" onClick={() => onNavigate("cart")}>
                Comprar agora
              </Button>
              <Button variant="light" onClick={() => onNavigate("home")}>
                Ver ofertas
              </Button>
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

          <div className="hero-card">
            <div className="card-header">
              <span>Oferta do dia</span>
              <span className="discount">{ofertaAtual.desconto}</span>
            </div>

            <div className="carousel-panel">
              <div className="product-preview">
                <div className={`product-image ${ofertaAtual.cor}`}></div>

                <div className="product-info">
                  <h3>{ofertaAtual.nome}</h3>
                  <p>{ofertaAtual.preco}</p>
                </div>
              </div>
            </div>

            <div className="mini-list">
              <span>{ofertaAtual.entrega}</span>
              <span>{ofertaAtual.pagamento}</span>
            </div>

            <div className="carousel-dots" aria-label="Indicadores de oferta">
              {ofertas.map((oferta, index) => (
                <button
                  key={oferta.id}
                  type="button"
                  className={`dot ${index === slideAtivo ? "active" : ""}`}
                  aria-label={`Ver oferta ${index + 1}`}
                  onClick={() => setSlideAtivo(index)}
                />
              ))}
            </div>
          </div>
        </section>

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

        </>}

        <section className="products" aria-labelledby="products-heading">
          <div className="section-title">
            <div>
              <h2 id="products-heading">{termoNormalizado ? "Resultados da busca" : "Produtos em destaque"}</h2>
              {termoNormalizado && <p role="status">{produtosBase.length} {produtosBase.length === 1 ? "produto encontrado" : "produtos encontrados"} para ?{termoBusca.trim()}?</p>}
            </div>

            {!termoNormalizado && <div className="products-actions">
              <button
                type="button"
                className="carousel-btn"
                aria-label="Produto anterior"
                onClick={() =>
                  setIndiceProdutos(
                    (atual) =>
                      (atual - 1 + produtosBase.length) % produtosBase.length,
                  )
                }
              >
                ←
              </button>

              <a href="#">Ver todos</a>

              <button
                type="button"
                className="carousel-btn"
                aria-label="Próximo produto"
                onClick={() =>
                  setIndiceProdutos((atual) =>
                    produtosBase.length ? (atual + 1) % produtosBase.length : 0,
                  )
                }
              >
                →
              </button>
            </div>}
          </div>

          <div className="product-grid">
            {produtosVisiveis.length === 0 && (
              <p className="search-empty">
                Nenhum produto encontrado para “{termoBusca}”.
              </p>
            )}
            {produtosVisiveis.map((produto) => (
              <ProductCard
                key={`${produto.id}-${produto.nome}`}
                produto={produto}
                onAddToCart={onAddToCart}
              />
            ))}
          </div>
        </section>

        {!termoNormalizado && <>
        <section className="stores">
          <div className="section-title">
            <h2>Lojas em destaque</h2>

            <div className="products-actions">
              <button
                type="button"
                className="carousel-btn"
                aria-label="Loja anterior"
                onClick={() =>
                  setIndiceLojas(
                    (atual) => (atual - 1 + lojas.length) % lojas.length,
                  )
                }
              >
                ←
              </button>

              <button
                type="button"
                className="carousel-btn"
                aria-label="Próxima loja"
                onClick={() =>
                  setIndiceLojas((atual) => (atual + 1) % lojas.length)
                }
              >
                →
              </button>
            </div>
          </div>

          <div className="store-grid">
            {lojasVisiveis.map((loja) => (
              <article key={loja.id} className="store-card">
                <div className={`store-cover ${loja.cor}`}>
                  <span>{loja.categoria}</span>
                </div>

                <div className="store-body">
                  <h3>{loja.nome}</h3>
                  <p>{loja.destaque}</p>
                  <button type="button" className="btn btn-dark store-button">
                    Ver loja
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="brands-section">
          <div className="section-title">
            <h2>Marcas parceiras</h2>
          </div>

          <div className="brands-strip">
            {marcasParceiras.map((marca) => (
              <div key={marca} className="brand-pill">
                {marca}
              </div>
            ))}
          </div>
        </section>

        <section className="reviews-section">
          <div className="section-title">
            <h2>Avaliações</h2>
          </div>

          <div className="reviews-grid">
            {avaliacoes.map((avaliacao) => (
              <article key={avaliacao.id} className="review-card">
                <div className="review-header">
                  <div>
                    <h3>{avaliacao.nome}</h3>
                    <span>{avaliacao.produto}</span>
                  </div>
                  <div
                    className="stars"
                    aria-label={`${avaliacao.nota} estrelas`}
                  >
                    {"★".repeat(avaliacao.nota)}
                  </div>
                </div>

                <p>{avaliacao.texto}</p>
              </article>
            ))}
          </div>
        </section>
        </>}
      </main>

      <Footer />
    </div>
  );
}

export default HomePage;
