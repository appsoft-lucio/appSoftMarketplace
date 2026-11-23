import { Link } from "react-router-dom";
import "./SiteFooter.css";

export function SiteFooter() {
  const year = new Intl.DateTimeFormat("pt-BR", { year: "numeric", timeZone: "America/Sao_Paulo" }).format(new Date());
  return <footer className="site-footer">
    <div className="site-footer-inner">
      <div className="site-footer-grid">
        <div className="site-footer-brand">
          <p className="eyebrow">O COMÉRCIO LOCAL MAIS PERTO</p>
          <Link className="site-footer-title" to="/">AppSoft<span> Marketplace</span></Link>
          <p>Descubra boas lojas, encontre novos favoritos e valorize os negócios da sua região.</p>
        </div>
        <nav aria-label="Explore o marketplace">
          <h2>Explore</h2>
          <ul>
            <li><Link to="/catalogo">Catálogo de produtos</Link></li>
            <li><Link to="/lojas">Todas as lojas</Link></li>
            <li><Link to="/meus-pedidos">Acompanhar pedidos</Link></li>
          </ul>
        </nav>
        <nav aria-label="Acessos para clientes e lojistas">
          <h2>Faça parte</h2>
          <ul>
            <li><Link to="/minha-conta">Acessar sua conta</Link></li>
            <li><Link to="/minhas-lojas">Área do lojista</Link></li>
            <li><Link to="/minhas-lojas/nova">Começar a vender</Link></li>
          </ul>
        </nav>
      </div>
      <div className="site-footer-bottom">
        <small>© {year} AppSoft Marketplace. Todos os direitos reservados.</small>
        <small>Conectando pessoas e negócios locais.</small>
      </div>
    </div>
  </footer>;
}
