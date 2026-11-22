import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import { useCart } from "../cart/CartProvider";
import logo from "../../../../imagens/logo-appsoft-orange-semFundo.png";
import "./PublicHeader.css";
export function CartLink() { const { count } = useCart(); return <Link className="button secondary" to="/carrinho">Carrinho ({count})</Link>; }
export function PublicHeader() {
  const { session } = useAuth();
  return <header className="site-header"><Link to="/"><img src={logo} alt="AppSoft, início" /></Link><nav className="public-navigation" aria-label="Navegação principal"><Link to="/catalogo">Produtos</Link><Link to="/lojas">Lojas</Link><CartLink /><Link className="button secondary" to={session ? "/minha-conta" : "/login"}>{session ? "Minha conta" : "Entrar"}</Link></nav></header>;
}