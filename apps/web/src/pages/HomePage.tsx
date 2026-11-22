import { useEffect } from "react";
import { Link } from "react-router-dom";
import { BASIC_PLAN, formatMoney } from "@appsoft/domain";
import { PublicHeader } from "../components/PublicHeader";
import "./HomePage.css";

export default function HomePage() {
  useEffect(() => { document.title = "AppSoft Marketplace"; }, []);
  return <div className="site-shell"><PublicHeader /><main className="home-content"><p className="eyebrow">COMÉRCIO LOCAL, NOVAS POSSIBILIDADES</p><h1>Um marketplace.<br />Muitas histórias.</h1><p className="home-description">Estamos preparando um novo espaço para aproximar compradores e lojistas. Explore as lojas e seus produtos, mesmo sem criar conta.</p><Link className="button primary" to="/catalogo">Explorar produtos</Link><section className="plan-card" aria-label="Plano inicial para lojistas"><span className="eyebrow">PARA SUA LOJA</span><h2>Plano {BASIC_PLAN.name}</h2><p><strong>{formatMoney(BASIC_PLAN.monthlyPriceCents)}</strong> / mês</p><p>Até {BASIC_PLAN.activeProductLimit} produtos ativos. Sem comissão por venda.</p><small>As lojas, assinaturas e compras ainda estão em desenvolvimento.</small></section></main><footer className="site-footer">AppSoft Marketplace · Conectando o comércio local</footer></div>;
}
