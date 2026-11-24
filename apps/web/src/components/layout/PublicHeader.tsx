import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../../auth/AuthProvider";
import { CartLink } from "../../cart/CartLink";
import { SiteHeader } from "./SiteHeader";
import "./PublicHeader.css";
export function PublicHeader() {
  const { session } = useAuth();
  return <SiteHeader><nav className="public-navigation" aria-label="Navegação principal"><NavLink to="/catalogo">Produtos</NavLink><NavLink to="/lojas">Lojas</NavLink><CartLink />{session ? <Link className="button primary" to="/minha-conta">Minha conta</Link> : <><Link className="button secondary" to="/login">Já tenho conta</Link><Link className="button primary" to="/cadastro">Cadastrar</Link></>}</nav></SiteHeader>;
}
