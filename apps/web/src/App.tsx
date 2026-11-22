import { lazy, Suspense } from "react";
import { Link, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { useAuth } from "./auth/AuthProvider";
import { AuthPage, ConfirmEmailPage, ResetPasswordPage } from "./pages/AuthPages";
import { MyStoresPage, StoreRegistrationPage } from "./pages/StorePages";
const CatalogPage = lazy(() => import("./pages/CatalogPage"));
const AdminPage = lazy(() => import("./pages/AdminPage"));

import HomePage from "./pages/HomePage";
import AccountPage from "./pages/AccountPage";

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
    <Route path="/catalogo" element={<Suspense fallback={<main className="loading-screen" role="status">Carregando catálogo…</main>}><CatalogPage /></Suspense>} />
    <Route path="/admin" element={<Suspense fallback={<main className="loading-screen" role="status">Carregando administração…</main>}><AdminPage /></Suspense>} />
    <Route path="/lojas" element={<MyStoresPage />} />
    <Route path="/lojas/nova" element={<StoreRegistrationPage />} />
    <Route path="/minha-conta" element={<AccountPage />} />
    <Route path="*" element={<main className="loading-screen"><h1>Página não encontrada</h1><Link className="button primary" to="/">Voltar ao início</Link></main>} />
  </Routes>;
}