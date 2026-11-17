import { useState } from "react";
import Button from "../components/Button";
import "./AuthPages.css";

function RegisterPage({ onNavigate }) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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

        <form className="auth-form">
          <label className="field-group">
            <span>Nome completo</span>
            <input type="text" value="Maria Silva" readOnly />
          </label>

          <label className="field-group">
            <span>E-mail</span>
            <input type="email" value="maria@appsoft.com" readOnly />
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

          <label className="field-group">
            <span>Confirmar senha</span>
            <div className="password-wrap">
              <input
                type={showConfirmPassword ? "text" : "password"}
                value="123456"
                readOnly
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

          <Button
            variant="primary"
            type="button"
            onClick={() => onNavigate("home")}
          >
            Cadastrar
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
