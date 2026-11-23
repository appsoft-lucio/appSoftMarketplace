const CheckoutPage = lazy(() => import("./pages/CheckoutPage"));
const ShippingPage = lazy(() => import("./pages/ShippingPage"));
const OrdersPage = lazy(() => import("./pages/OrdersPage"));
const ProductsPage = lazy(() => import("./pages/ProductsPage"));
import { lazy, Suspense } from "react";
import { Link, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { CartProvider } from "./cart/CartProvider";
import { useAuth } from "./auth/AuthProvider";
import { AuthPage, ConfirmEmailPage, ResetPasswordPage } from "./pages/AuthPages";
import { MyStoresPage, StoreRegistrationPage } from "./pages/StorePages";
const CatalogPage = lazy(() => import("./pages/CatalogPage"));
const AdminPage = lazy(() => import("./pages/AdminPage"));

import CartPage from "./pages/CartPage";
import { StoreDirectoryPage } from "./pages/StoreDirectoryPage";
import { PublicStorePage } from "./pages/PublicStorePage";
import { PublicProductPage } from "./pages/PublicProductPage";
import HomePage from "./pages/HomePage";
import AccountPage from "./pages/AccountPage";

function AppRoutes() {
  const { loading, recovery } = useAuth();
  const location = useLocation();
  const publicPath = location.pathname === "/" || location.pathname === "/catalogo" || location.pathname === "/lojas" || location.pathname.startsWith("/loja/") || location.pathname.startsWith("/produto/") || location.pathname === "/carrinho";
  if (loading && !publicPath) return <main className="loading-screen" role="status">Preparando seu acesso…</main>;
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
    <Route path="/lojas" element={<StoreDirectoryPage />} />
    <Route path="/loja/:slug" element={<PublicStorePage />} />
    <Route path="/produto/:id" element={<PublicProductPage />} />
    <Route path="/carrinho" element={<CartPage />} />
    <Route path="/finalizar-compra" element={<Suspense fallback={<main role="status">Carregando...</main>}><CheckoutPage /></Suspense>} />
    <Route path="/meus-pedidos" element={<Suspense fallback={<main role="status">Carregando...</main>}><OrdersPage /></Suspense>} />
    <Route path="/minhas-lojas/:storeId/frete" element={<Suspense fallback={<main role="status">Carregando...</main>}><ShippingPage /></Suspense>} />
    <Route path="/minhas-lojas/:storeId/pedidos" element={<Suspense fallback={<main role="status">Carregando...</main>}><OrdersPage /></Suspense>} />
    <Route path="/minhas-lojas" element={<MyStoresPage />} />
    <Route path="/minhas-lojas/:storeId/produtos" element={<Suspense fallback={<main role="status">Carregando produtos…</main>}><ProductsPage /></Suspense>} />
    <Route path="/minhas-lojas/nova" element={<StoreRegistrationPage />} />
    <Route path="/lojas/nova" element={<Navigate to="/minhas-lojas/nova" replace />} />
    <Route path="/minha-conta" element={<AccountPage />} />
    <Route path="*" element={<main className="loading-screen"><h1>Página não encontrada</h1><Link className="button primary" to="/">Voltar ao início</Link></main>} />
  </Routes>;
}
export default function App() { return <CartProvider><AppRoutes /></CartProvider>; }
