import Button from "./Button";
import logo from "../assets/logo-appsoft-orange-semFundo.png";

function Header({
  onNavigate,
  cartCount = 0,
  onLogout,
  searchValue = "",
  onSearchChange,
}) {
  const navItems = [
    { label: "Início", screen: "home" },
    { label: "Categorias", screen: "home" },
    { label: "Ofertas", screen: "home" },
    { label: "Vendedores", screen: "vendor" },
  ];

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
            key={item.label}
            type="button"
            className="menu-link menu-button"
            onClick={() => onNavigate(item.screen)}
          >
            {item.label}
          </button>
        ))}
      </nav>

      <label className="search-box" aria-label="Pesquisar produtos">
        <input
          type="search"
          value={searchValue}
          onChange={(event) => onSearchChange?.(event.target.value)}
          placeholder="Pesquisar produtos"
        />
      </label>

      <div className="actions">
        <Button variant="light" onClick={() => onNavigate("profile")}>
          Meu perfil
        </Button>
        <Button
          variant="light"
          onClick={onLogout || (() => onNavigate("login"))}
        >
          Sair
        </Button>
        <Button variant="primary" onClick={() => onNavigate("cart")}>
          Carrinho ({cartCount})
        </Button>
      </div>
    </header>
  );
}

export default Header;
