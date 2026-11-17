import { useState } from "react";
import Button from "../components/Button";
import "./AuthPages.css";

function LoginPage({ onNavigate }) {
  const [showPassword, setShowPassword] = useState(false);

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

        <form className="auth-form">
          <label className="field-group">
            <span>E-mail</span>
            <input type="email" value="cliente@appsoft.com" readOnly />
          </label>

          <label className="field-group">
            <span>Senha</span>
            <div className="password-wrap">
              <input
                type={showPassword ? "text" : "password"}
                value="123456"
                readOnly
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
            type="button"
            onClick={() => onNavigate("home")}
          >
            Entrar
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
