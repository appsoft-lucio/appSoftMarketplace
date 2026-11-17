import Button from "./Button";
import logo from "../assets/logo-appsoft-orange-semFundo.png";

function Header({ onNavigate, cartCount = 0 }) {
  const navItems = ["Início", "Categorias", "Ofertas", "Vendedores"];

  return (
    <header className="topbar">
      <div className="brand-block">
        <button
          type="button"
          className="brand-button"
          onClick={() => onNavigate("home")}
        >
          <div className="logo">
            <img
              src={logo}
              alt="AppSoft logo"
              style={{ height: "120px", width: "auto", display: "block" }}
            />
          </div>
        </button>

        <span className="brand-tagline">Seu marketplace de confiança</span>
      </div>

      <nav className="menu" aria-label="Menu principal">
        {navItems.map((item) => (
          <button
            key={item}
            type="button"
            className="menu-link menu-button"
            onClick={() => onNavigate("home")}
          >
            {item}
          </button>
        ))}
      </nav>

      <div className="actions">
        <Button variant="light" onClick={() => onNavigate("login")}>
          Entrar
        </Button>
        <Button variant="primary" onClick={() => onNavigate("cart")}>
          Carrinho ({cartCount})
        </Button>
      </div>
    </header>
  );
}

export default Header;
