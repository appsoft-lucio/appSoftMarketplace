import { useEffect, useState } from "react";
import Button from "../components/Button";
import { productService } from "../services/products";
import "./VendorPage.css";

const money = value => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(value));
export default function VendorPage({ onNavigate, user, onLogout }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const isVendor = user?.role === "vendor";
  useEffect(() => {
    let active = true;
    if (!isVendor) { setLoading(false); return; }
    productService.mine().then(data => { if (active) setProducts(data.products.filter(p => p.active)); }).catch(err => { if (active) setError(err.message); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [isVendor, user?.id]);
  return <div className="vendor-page"><div className="vendor-shell">
    <header className="vendor-topbar"><button className="back-link" onClick={() => onNavigate("home")}>Voltar ao marketplace</button><div className="profile-actions">{isVendor && <Button onClick={() => onNavigate("vendor-dashboard")}>Gerenciar loja</Button>}<Button variant="light" onClick={() => onNavigate("home")}>Ver catálogo</Button>{user && <Button variant="light" onClick={onLogout}>Sair</Button>}</div></header>
    {isVendor ? <><section className="vendor-hero"><div className="vendor-cover"><span>Minha loja</span></div><div className="vendor-main"><div className="vendor-brand"><div className="vendor-logo">{(user.name || "Loja").slice(0, 2).toUpperCase()}</div><div><h1>{user.name}</h1><p>Confira os produtos ativos da sua loja.</p></div></div><div className="vendor-stats"><div className="vendor-stat"><strong>{products.length}</strong><span>Produtos ativos</span></div></div></div></section>
    <section className="vendor-card"><div className="section-header"><h2>Produtos da loja</h2><Button onClick={() => onNavigate("vendor-dashboard")}>Gerenciar produtos</Button></div>{error && <p role="alert">{error}</p>}{loading ? <p role="status">Carregando produtos…</p> : !products.length && !error ? <p>Nenhum produto ativo. Cadastre seu primeiro produto no painel.</p> : <div className="product-list">{products.map(p => <article className="vendor-product-item" key={p.id}>{p.image_url ? <img className="vendor-product-thumb" src={p.image_url} alt="" loading="lazy" /> : <div className="vendor-product-thumb" />}<div className="vendor-product-copy"><span>{p.category}</span><h3>{p.name}</h3><strong>{money(p.price)}</strong><p>{p.stock > 0 ? `${p.stock} em estoque` : "Esgotado"}</p></div></article>)}</div>}</section></> : <section className="vendor-card"><h1>Área do vendedor</h1><p>Acesse sua conta de vendedor para gerenciar os produtos e pedidos da sua loja.</p><Button onClick={() => onNavigate("login")}>Entrar</Button></section>}
  </div></div>;
}
