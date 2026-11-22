import { useEffect } from "react";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import logo from "../../../../imagens/logo-appsoft-orange-semFundo.png";
export function AuthLayout({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  useEffect(() => { document.title = `${title} · AppSoft Marketplace`; }, [title]);
  return <main className="auth-shell"><aside className="auth-brand"><Link to="/" aria-label="AppSoft, página inicial"><img src={logo} alt="AppSoft" /></Link><div><p className="eyebrow">PERTO DE VOCÊ</p><h2>Boas lojas.<br />Novas conexões.</h2><p>Seu próximo encontro com o comércio local começa aqui.</p></div><small>AppSoft Marketplace</small></aside><section className="auth-panel" aria-labelledby="auth-title"><Link className="back-link" to="/">Voltar ao início</Link><div className="auth-heading"><p className="eyebrow">SUA CONTA APPSOFT</p><h1 id="auth-title">{title}</h1><p>{description}</p></div>{children}</section></main>;
}