import Button from "./Button";
import logo from "../assets/logo-appsoft-orange-semFundo.png";

function Header() {
  const navItems = ["Início", "Categorias", "Ofertas", "Vendedores"];

  return (
    <header className="topbar">
      <div className="brand-block">
        <div className="logo">
          <img
            src={logo}
            alt="AppSoft logo"
            style={{ height: "120px", width: "auto", display: "block" }}
          />
        </div>
        <span className="brand-tagline">Seu marketplace de confiança</span>
      </div>

      <nav className="menu" aria-label="Menu principal">
        {navItems.map((item) => (
          <a key={item} href="#" className="menu-link">
            {item}
          </a>
        ))}
      </nav>

      <div className="actions">
        <Button variant="light">Entrar</Button>
        <Button variant="primary">Carrinho (2)</Button>
      </div>
    </header>
  );
}

export default Header;
