import Button from "../components/Button";
import "./AuthPages.css";

function ForgotPasswordPage({ onNavigate }) {
  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-topbar">
          <button
            type="button"
            className="back-link"
            onClick={() => onNavigate("login")}
          >
            ← Voltar
          </button>
        </div>

        <h1>Esqueci a senha</h1>
        <p>Digite seu e-mail para receber as instruções de recuperação.</p>

        <form className="auth-form">
          <label className="field-group">
            <span>E-mail</span>
            <input type="email" placeholder="seu@email.com" />
          </label>

          <Button
            variant="primary"
            type="button"
            onClick={() => onNavigate("login")}
          >
            Enviar link
          </Button>
        </form>

        <div className="auth-links">
          <button
            type="button"
            className="text-link"
            onClick={() => onNavigate("login")}
          >
            Voltar para login
          </button>
        </div>
      </div>
    </div>
  );
}

export default ForgotPasswordPage;
