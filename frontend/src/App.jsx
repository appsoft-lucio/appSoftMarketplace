import { useEffect, useState } from "react";
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

function App() {
  const [screen, setScreen] = useState("home");
  const [cartItems, setCartItems] = useState([]);
  const [cartSummary, setCartSummary] = useState({
    subtotal: 0,
    shipping: 25,
    total: 0,
  });
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("appsoft_user");
    return saved ? JSON.parse(saved) : null;
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

    cartService
      .list()
      .then(normalizeCart)
      .catch(() => setCartItems([]));
  }, []);

  const logout = () => {
    localStorage.removeItem("appsoft_token");
    localStorage.removeItem("appsoft_user");
    setUser(null);
    setCartItems([]);
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

  if (screen === "login") {
    return (
      <LoginPage
        onNavigate={setScreen}
        onAuthenticated={(authenticatedUser) => setUser(authenticatedUser)}
      />
    );
  }
  if (screen === "register") {
    return (
      <RegisterPage
        onNavigate={setScreen}
        onAuthenticated={(authenticatedUser) => setUser(authenticatedUser)}
      />
    );
  }
  if (screen === "forgot") return <ForgotPasswordPage onNavigate={setScreen} />;
  if (screen === "cart") {
    return (
      <CartPage
        items={cartItems}
        summary={cartSummary}
        onNavigate={setScreen}
        onUpdateQuantity={updateQuantity}
        onRemoveItem={removeItem}
        onCheckout={checkout}
      />
    );
  }

  if (screen === "profile") {
    return (
      <UserProfilePage onNavigate={setScreen} user={user} onLogout={logout} />
    );
  }

  if (screen === "vendor") {
    return <VendorPage onNavigate={setScreen} />;
  }

  if (screen === "vendor-dashboard") {
    return <VendorDashboardPage onNavigate={setScreen} onLogout={logout} />;
  }

  return (
    <HomePage
      onNavigate={setScreen}
      cartCount={cartCount}
      onAddToCart={addToCart}
      onLogout={logout}
    />
  );
}

export default App;
