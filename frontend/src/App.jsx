import { useState } from "react";
import "./App.css";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import CartPage from "./pages/CartPage";
import UserProfilePage from "./pages/UserProfilePage";
import VendorPage from "./pages/VendorPage";
import VendorDashboardPage from "./pages/VendorDashboardPage";

const initialCart = [
  {
    id: 1,
    nome: "AirPods Pro",
    preco: 1299.0,
    categoria: "Eletrônicos",
    cor: "azul",
    quantity: 1,
  },
  {
    id: 3,
    nome: "Tênis Runner",
    preco: 329.9,
    categoria: "Esportes",
    cor: "verde",
    quantity: 1,
  },
];

function App() {
  const [screen, setScreen] = useState("home");
  const [cartItems, setCartItems] = useState(initialCart);

  const cartCount = cartItems.reduce((total, item) => total + item.quantity, 0);

  const addToCart = (produto) => {
    setCartItems((current) => {
      const alreadyExists = current.find((item) => item.id === produto.id);

      if (alreadyExists) {
        return current.map((item) =>
          item.id === produto.id
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        );
      }

      return [...current, { ...produto, quantity: 1 }];
    });

    setScreen("cart");
  };

  const updateQuantity = (id, nextQuantity) => {
    if (nextQuantity <= 0) {
      setCartItems((current) => current.filter((item) => item.id !== id));
      return;
    }

    setCartItems((current) =>
      current.map((item) =>
        item.id === id ? { ...item, quantity: nextQuantity } : item,
      ),
    );
  };

  const removeItem = (id) => {
    setCartItems((current) => current.filter((item) => item.id !== id));
  };

  if (screen === "login") return <LoginPage onNavigate={setScreen} />;
  if (screen === "register") return <RegisterPage onNavigate={setScreen} />;
  if (screen === "forgot") return <ForgotPasswordPage onNavigate={setScreen} />;
  if (screen === "cart") {
    return (
      <CartPage
        items={cartItems}
        onNavigate={setScreen}
        onUpdateQuantity={updateQuantity}
        onRemoveItem={removeItem}
      />
    );
  }

  if (screen === "profile") {
    return <UserProfilePage onNavigate={setScreen} />;
  }

  if (screen === "vendor") {
    return <VendorPage onNavigate={setScreen} />;
  }

  if (screen === "vendor-dashboard") {
    return <VendorDashboardPage onNavigate={setScreen} />;
  }

  return (
    <HomePage
      onNavigate={setScreen}
      cartCount={cartCount}
      onAddToCart={addToCart}
    />
  );
}

export default App;
