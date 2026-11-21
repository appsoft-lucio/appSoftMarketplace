import { useState } from "react";
import Button from "../components/Button";
import { login } from "../services/auth";
import "./AuthPages.css";

function LoginPage({ onNavigate }) {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("cliente@appsoft.com");
  const [password, setPassword] = useState("123456");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const data = await login(email, password);
      localStorage.setItem("appsoft_token", data.token);
      localStorage.setItem("appsoft_user", JSON.stringify(data.user));
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

        <h1>Entrar</h1>
        <p>Bem-vindo de volta ao AppSoft.</p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label className="field-group">
            <span>E-mail</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </label>

          <label className="field-group">
            <span>Senha</span>
            <div className="password-wrap">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
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

          {error && <p className="auth-error">{error}</p>}

          <div className="auth-row">
            <label className="checkbox">
              <input type="checkbox" defaultChecked />
              Lembrar-me
            </label>

            <button
              type="button"
              className="text-link"
              onClick={() => onNavigate("forgot")}
            >
              Esqueci a senha
            </button>
          </div>

          <Button
            variant="primary"
            type="submit"
            loading={loading}
            disabled={loading}
          >
            {loading ? "Entrando..." : "Entrar"}
          </Button>
        </form>

        <div className="auth-links">
          <span>Ainda não tem conta?</span>
          <button
            type="button"
            className="text-link"
            onClick={() => onNavigate("register")}
          >
            Criar conta
          </button>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
