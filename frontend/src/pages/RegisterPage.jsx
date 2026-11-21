import { useState } from "react";
import Button from "../components/Button";
import { register } from "../services/auth";
import "./AuthPages.css";

function RegisterPage({ onNavigate, onAuthenticated }) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState("customer");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("As senhas não conferem.");
      return;
    }

    setLoading(true);
    try {
      const data = await register({ name, email, password, role });
      localStorage.setItem("appsoft_token", data.token);
      localStorage.setItem("appsoft_user", JSON.stringify(data.user));
      onAuthenticated?.(data.user);
      onNavigate(data.user.role === "vendor" ? "vendor-dashboard" : "home");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-topbar">
          <button
            type="button"
            className="back-link"
            onClick={() => onNavigate("home")}
          >
            ← Voltar
          </button>
        </div>

        <h1>Criar conta</h1>
        <p>Cadastre-se e aproveite ofertas exclusivas.</p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label className="field-group">
            <span>Nome completo</span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </label>

          <label className="field-group">
            <span>E-mail</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>

          <label className="field-group">
            <span>Senha</span>
            <div className="password-wrap">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="toggle-password"
                onClick={() => setShowPassword((value) => !value)}
              >
                {showPassword ? "Ocultar" : "Mostrar"}
              </button>
            </div>
          </label>

          <label className="field-group">
            <span>Confirmar senha</span>
            <div className="password-wrap">
              <input
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="toggle-password"
                onClick={() => setShowConfirmPassword((value) => !value)}
              >
                {showConfirmPassword ? "Ocultar" : "Mostrar"}
              </button>
            </div>
          </label>

          <label className="field-group">
            <span>Tipo de conta</span>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              required
            >
              <option value="customer">Cliente</option>
              <option value="vendor">Vendedor</option>
            </select>
          </label>

          {error && <p className="error-message">{error}</p>}

          <Button
            variant="primary"
            type="submit"
            loading={loading}
            disabled={loading}
          >
            {loading ? "Aguarde..." : "Cadastrar"}
          </Button>
        </form>

        <div className="auth-links">
          <span>Já tem conta?</span>
          <button
            type="button"
            className="text-link"
            onClick={() => onNavigate("login")}
          >
            Fazer login
          </button>
        </div>
      </div>
    </div>
  );
}

export default RegisterPage;
