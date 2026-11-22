import { lazy, Suspense, useEffect, useState } from "react";
import { Link, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { BASIC_PLAN, formatMoney } from "@appsoft/domain";
import { useAuth } from "./auth/AuthProvider";
import { getAuthClient } from "./auth/client";
import { authErrorMessage } from "./auth/errors";
import { AuthPage, ConfirmEmailPage, ResetPasswordPage } from "./pages/AuthPages";
import { MyStoresPage, StoreRegistrationPage } from "./pages/StorePages";
import { AdminAccessLink } from "./components/AdminAccessLink";
const AdminPage = lazy(() => import("./pages/AdminPage"));
import logo from "../../../imagens/logo-appsoft-orange-semFundo.png";

function HomePage() {
  const { session } = useAuth();
  useEffect(() => { document.title = "AppSoft Marketplace"; }, []);
  return <div className="site-shell"><header className="site-header"><Link to="/" aria-label="AppSoft, início"><img src={logo} alt="AppSoft" /></Link><nav aria-label="Conta">{session ? <Link className="button primary" to="/minha-conta">Minha conta</Link> : <><Link className="button secondary" to="/login">Entrar</Link><Link className="button primary" to="/cadastro">Criar conta</Link></>}</nav></header><main className="home-content"><p className="eyebrow">COMÉRCIO LOCAL, NOVAS POSSIBILIDADES</p><h1>Um marketplace.<br />Muitas histórias.</h1><p className="home-description">Estamos preparando um novo espaço para aproximar compradores e lojistas. Crie sua conta e acompanhe esse começo.</p><Link className="button primary" to={session ? "/minha-conta" : "/cadastro"}>{session ? "Acessar minha conta" : "Quero fazer parte"}</Link><section className="plan-card" aria-label="Plano inicial para lojistas"><span className="eyebrow">PARA SUA LOJA</span><h2>Plano {BASIC_PLAN.name}</h2><p><strong>{formatMoney(BASIC_PLAN.monthlyPriceCents)}</strong> / mês</p><p>Até {BASIC_PLAN.activeProductLimit} produtos ativos. Sem comissão por venda.</p><small>As lojas, assinaturas e compras ainda estão em desenvolvimento.</small></section></main><footer>AppSoft Marketplace · Conectando o comércio local</footer></div>;
}

function AccountPage() {
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
  return <div className="site-shell"><header className="site-header"><Link to="/"><img src={logo} alt="AppSoft, início" /></Link><button className="button secondary" onClick={logout} disabled={busy}>{busy ? "Saindo…" : "Sair da conta"}</button></header><main className="account-content"><p className="eyebrow">MINHA CONTA</p><h1>Olá, {name}.</h1><p>Seu acesso ao AppSoft está pronto.</p>{error && <p className="notice error" role="alert">{error}</p>}<section className="account-card"><h2>Seus dados</h2><dl><div><dt>Nome</dt><dd>{name}</dd></div><div><dt>E-mail</dt><dd>{session.user.email}</dd></div></dl></section><AdminAccessLink /><section className="account-card"><h2>Sua loja no AppSoft</h2><p>Envie o cadastro da sua loja para análise e acompanhe o andamento. Nenhuma assinatura será contratada nesta etapa.</p><Link className="button primary" to="/lojas">Minhas lojas</Link><br /><Link to="/recuperar-senha">Solicitar redefinição de senha</Link></section><Link className="back-link" to="/">Voltar ao início</Link></main></div>;
}

export default function App() {
  const { loading, recovery } = useAuth();
  const location = useLocation();
  if (loading) return <main className="loading-screen" role="status">Preparando seu acesso…</main>;
  if (recovery && location.pathname !== "/redefinir-senha") return <Navigate to="/redefinir-senha" replace />;
  return <Routes>
    <Route path="/" element={<HomePage />} />
    <Route path="/login" element={<AuthPage key="login" mode="login" />} />
    <Route path="/cadastro" element={<AuthPage key="register" mode="register" />} />
    <Route path="/recuperar-senha" element={<AuthPage key="forgot" mode="forgot" />} />
    <Route path="/confirmar-email" element={<AuthPage key="resend" mode="resend" />} />
    <Route path="/redefinir-senha" element={<ResetPasswordPage />} />
    <Route path="/auth/confirmar" element={<ConfirmEmailPage />} />
    <Route path="/admin" element={<Suspense fallback={<main className="loading-screen" role="status">Carregando administração…</main>}><AdminPage /></Suspense>} />
    <Route path="/lojas" element={<MyStoresPage />} />
    <Route path="/lojas/nova" element={<StoreRegistrationPage />} />
    <Route path="/minha-conta" element={<AccountPage />} />
    <Route path="*" element={<main className="loading-screen"><h1>Página não encontrada</h1><Link className="button primary" to="/">Voltar ao início</Link></main>} />
  </Routes>;
}