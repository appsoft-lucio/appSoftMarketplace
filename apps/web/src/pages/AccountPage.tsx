import { useEffect, useState } from "react";
import { Link, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import { getAuthClient } from "../auth/client";
import { authErrorMessage } from "../auth/errors";
import { CartLink } from "../cart/CartLink";
import { AdminAccessLink } from "../stores/components/AdminAccessLink";
import { SiteHeader } from "../components/layout/SiteHeader";
import "./AccountPage.css";

export default function AccountPage() {
  const { session } = useAuth();
  const navigateLocation = useLocation();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => { document.title = "Minha conta · AppSoft Marketplace"; }, []);
  if (!session) return <Navigate to="/login" replace state={{ from: navigateLocation.pathname }} />;
  const rawName: unknown = session.user.user_metadata.name;
  const name = typeof rawName === "string" && rawName.trim() ? rawName : "Boas-vindas";
  const logout = async () => {
    setBusy(true); setError("");
    try { const { error } = await getAuthClient().auth.signOut({ scope: "local" }); if (error) throw error; }
    catch (err) { setError(authErrorMessage(err)); } finally { setBusy(false); }
  };
  return <div className="site-shell"><SiteHeader><CartLink /><button className="button secondary" onClick={logout} disabled={busy}>{busy ? "Saindo…" : "Sair da conta"}</button></SiteHeader><main className="account-content"><p className="eyebrow">MINHA CONTA</p><h1>Olá, {name}.</h1><p>Seu acesso ao AppSoft está pronto.</p>{error && <p className="notice error" role="alert">{error}</p>}<section className="panel-card"><h2>Seus dados</h2><dl className="definition-list"><div><dt>Nome</dt><dd>{name}</dd></div><div><dt>E-mail</dt><dd>{session.user.email}</dd></div></dl></section><AdminAccessLink /><section className="panel-card"><h2>Sua loja no AppSoft</h2><p>Envie o cadastro da sua loja para análise e acompanhe o andamento. Nenhuma assinatura será contratada nesta etapa.</p><Link className="button primary" to="/minhas-lojas">Minhas lojas</Link><br /><Link to="/recuperar-senha">Solicitar redefinição de senha</Link></section><Link className="back-link" to="/">Voltar ao início</Link></main></div>;
}
