import Header from '../components/Header';
import Footer from '../components/Footer';
import Button from '../components/Button';
import ProductCard from '../components/ProductCard';
import './HomePage.css';

const categorias = [
  'Eletrônicos',
  'Casa',
  'Moda',
  'Esportes',
  'Beleza',
  'Livros',
];

const produtos = [
  {
    id: 1,
    nome: 'AirPods Pro',
    preco: 1299.0,
    categoria: 'Eletrônicos',
    cor: 'azul',
  },
  {
    id: 2,
    nome: 'Cafeteira Deluxe',
    preco: 499.9,
    categoria: 'Casa',
    cor: 'laranja',
  },
  {
    id: 3,
    nome: 'Tênis Runner',
    preco: 329.9,
    categoria: 'Esportes',
    cor: 'verde',
  },
  {
    id: 4,
    nome: 'Relógio Smart',
    preco: 899.0,
    categoria: 'Moda',
    cor: 'roxo',
  },
];

function HomePage() {
  return (
    <div className="marketplace">
      <Header />

      <main className="container">
        <section className="hero">
          <div className="hero-text">
            <span className="badge">Loja digital</span>
            <h1>Seu marketplace favorito em um só lugar</h1>
            <p>
              Encontre produtos incríveis, suporte rápido e ofertas exclusivas de
              vendedores confiáveis.
            </p>

            <div className="hero-actions">
              <Button variant="primary">Comprar agora</Button>
              <Button variant="light">Ver ofertas</Button>
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

        <section className="products">
          <div className="section-title">
            <h2>Produtos em destaque</h2>
            <a href="#">Ver todos</a>
          </div>

          <div className="product-grid">
            {produtos.map((produto) => (
              <ProductCard key={produto.id} produto={produto} />
            ))}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

export default HomePage;
