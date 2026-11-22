import { useEffect } from "react";
import { Link } from "react-router-dom";
import { BASIC_PLAN, formatMoney } from "@appsoft/domain";
import { useAuth } from "../auth/AuthProvider";
import logo from "../../../../imagens/logo-appsoft-orange-semFundo.png";
import "./HomePage.css";

export default function HomePage() {
  const { session } = useAuth();
  useEffect(() => { document.title = "AppSoft Marketplace"; }, []);
  return <div className="site-shell"><header className="site-header"><Link to="/" aria-label="AppSoft, início"><img src={logo} alt="AppSoft" /></Link><nav aria-label="Conta"><Link className="button secondary" to="/catalogo">Explorar produtos</Link>{session ? <Link className="button primary" to="/minha-conta">Minha conta</Link> : <><Link className="button secondary" to="/login">Entrar</Link><Link className="button primary" to="/cadastro">Criar conta</Link></>}</nav></header><main className="home-content"><p className="eyebrow">COMÉRCIO LOCAL, NOVAS POSSIBILIDADES</p><h1>Um marketplace.<br />Muitas histórias.</h1><p className="home-description">Estamos preparando um novo espaço para aproximar compradores e lojistas. Crie sua conta e acompanhe esse começo.</p><Link className="button primary" to={session ? "/minha-conta" : "/cadastro"}>{session ? "Acessar minha conta" : "Quero fazer parte"}</Link><section className="plan-card" aria-label="Plano inicial para lojistas"><span className="eyebrow">PARA SUA LOJA</span><h2>Plano {BASIC_PLAN.name}</h2><p><strong>{formatMoney(BASIC_PLAN.monthlyPriceCents)}</strong> / mês</p><p>Até {BASIC_PLAN.activeProductLimit} produtos ativos. Sem comissão por venda.</p><small>As lojas, assinaturas e compras ainda estão em desenvolvimento.</small></section></main><footer className="site-footer">AppSoft Marketplace · Conectando o comércio local</footer></div>;
}
