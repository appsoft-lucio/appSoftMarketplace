import { Link } from "react-router-dom";
import { useAuth } from "../../auth/AuthProvider";
import { CartLink } from "../../cart/CartLink";
import { SiteHeader } from "./SiteHeader";
import "./PublicHeader.css";
export function PublicHeader() {
  const { session } = useAuth();
  return <SiteHeader><nav className="public-navigation" aria-label="Navegação principal"><Link to="/catalogo">Produtos</Link><Link to="/lojas">Lojas</Link><CartLink /><Link className="button secondary" to={session ? "/minha-conta" : "/login"}>{session ? "Minha conta" : "Entrar"}</Link></nav></SiteHeader>;
}