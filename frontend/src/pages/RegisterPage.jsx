import Button from "../components/Button";
import "./AuthPages.css";

function RegisterPage({ onNavigate }) {
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
            <input type="text" placeholder="Seu nome" />
          </label>

          <label className="field-group">
            <span>E-mail</span>
            <input type="email" placeholder="seu@email.com" />
          </label>

          <label className="field-group">
            <span>Senha</span>
            <input type="password" placeholder="Crie uma senha" />
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
