import { useEffect, useState } from "react";
import { Navigate, Route, Routes, useNavigate } from "react-router-dom";

import { cartService } from "./services/cart";
import { orderService } from "./services/orders";
import "./App.css";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import CartPage from "./pages/CartPage";
import UserProfilePage from "./pages/UserProfilePage";
import VendorPage from "./pages/VendorPage";
import VendorDashboardPage from "./pages/VendorDashboardPage";

const screenPaths = {
  home: "/", login: "/login", register: "/cadastro",
  forgot: "/recuperar-senha", cart: "/carrinho", profile: "/perfil",
  vendor: "/vendedor", "vendor-dashboard": "/vendedor/painel",
};

function App() {
  const navigate = useNavigate();
  const setScreen = (screen) => navigate(screenPaths[screen] || "/");
  const [cartItems, setCartItems] = useState([]);
  const [cartSummary, setCartSummary] = useState({
    subtotal: 0,
    shipping: 25,
    total: 0,
  });
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("appsoft_user");
    try {
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const normalizeCart = (data) => {
    setCartItems(
      data.items.map((item) => ({
        id: item.id,
        nome: item.name,
        preco: item.price,
        categoria: item.category,
        cor: "azul",
        quantity: item.quantity,
      })),
    );
    setCartSummary({
      subtotal: data.subtotal,
      shipping: data.shipping,
      total: data.total,
    });
  };

  useEffect(() => {
    if (!localStorage.getItem("appsoft_token")) return;

    let active = true;
    cartService
      .list()
      .then((data) => { if (active) normalizeCart(data); })
      .catch(() => {
        if (active) {
          setCartItems([]);
          setCartSummary({ subtotal: 0, shipping: 25, total: 25 });
        }
      });
    return () => { active = false; };
  }, [user]);

  const logout = () => {
    localStorage.removeItem("appsoft_token");
    localStorage.removeItem("appsoft_user");
    setUser(null);
    setCartItems([]);
    setCartSummary({ subtotal: 0, shipping: 25, total: 25 });
    setScreen("login");
  };

  const cartCount = cartItems.reduce((total, item) => total + item.quantity, 0);

  const addToCart = async (produto) => {
    try {
      if (!localStorage.getItem("appsoft_token")) {
        setScreen("login");
        return;
      }
      const data = await cartService.add(produto.id, 1);
      normalizeCart(data);
      setScreen("cart");
    } catch (error) {
      alert(error.message);
    }
  };

  const updateQuantity = async (id, nextQuantity) => {
    try {
      if (nextQuantity <= 0) {
        const data = await cartService.remove(id);
        normalizeCart(data);
        return;
      }
      const data = await cartService.update(id, nextQuantity);
      normalizeCart(data);
    } catch (error) {
      alert(error.message);
    }
  };

  const removeItem = async (id) => {
    try {
      const data = await cartService.remove(id);
      normalizeCart(data);
    } catch (error) {
      alert(error.message);
    }
  };

  const checkout = async () => {
    try {
      await orderService.checkout();
      setCartItems([]);
      setCartSummary({ subtotal: 0, shipping: 25, total: 25 });
      setScreen("profile");
    } catch (error) {
      alert(error.message);
    }
  };

  const authenticated = Boolean(user && localStorage.getItem("appsoft_token"));
  const protect = (page, vendorOnly = false) => {
    if (!authenticated) return <Navigate to="/login" replace />;
    if (vendorOnly && user.role !== "vendor") return <Navigate to="/" replace />;
    return page;
  };

  return (
    <Routes>
      <Route path="/" element={<HomePage onNavigate={setScreen} cartCount={cartCount} onAddToCart={addToCart} onLogout={logout} />} />
      <Route path="/login" element={<LoginPage onNavigate={setScreen} onAuthenticated={setUser} />} />
      <Route path="/cadastro" element={<RegisterPage onNavigate={setScreen} onAuthenticated={setUser} />} />
      <Route path="/recuperar-senha" element={<ForgotPasswordPage onNavigate={setScreen} />} />
      <Route path="/carrinho" element={protect(<CartPage items={cartItems} summary={cartSummary} onNavigate={setScreen} onUpdateQuantity={updateQuantity} onRemoveItem={removeItem} onCheckout={checkout} />)} />
      <Route path="/perfil" element={protect(<UserProfilePage onNavigate={setScreen} user={user} onLogout={logout} />)} />
      <Route path="/vendedor" element={<VendorPage onNavigate={setScreen} user={user} onLogout={logout} />} />
      <Route path="/vendedor/painel" element={protect(<VendorDashboardPage onNavigate={setScreen} onLogout={logout} user={user} />, true)} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
