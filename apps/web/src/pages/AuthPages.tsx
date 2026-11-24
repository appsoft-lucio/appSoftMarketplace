import { normalizeUsername } from "@appsoft/domain/username";
import { loginRequest, LoginRequestError } from "../auth/login-service";
import "./AuthPages.css";
import { useState } from "react";
import type { FormEvent } from "react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { useCart } from "../cart/CartProvider";
import { afterAuthPath } from "@appsoft/domain/cart";
import { AuthLayout } from "../components/auth/AuthLayout";
import { PasswordField } from "../components/forms/PasswordField";
import { useAuth } from "../auth/AuthProvider";
import { authConfigured, getAuthClient } from "../auth/client";
import { authErrorMessage } from "../auth/errors";

type Mode = "login" | "register" | "forgot" | "resend";
const copy = {
  login: ["Que bom ter você aqui", "Entre para acessar sua conta no marketplace.", "Entrar"],
  register: ["Crie sua conta", "Para comprar ou começar sua jornada como lojista.", "Criar conta"],
  forgot: ["Esqueceu sua senha?", "Enviaremos um link para você escolher uma nova senha.", "Enviar link de recuperação"],
  resend: ["Confirme seu e-mail", "Solicite um novo link de confirmação para sua conta.", "Reenviar confirmação"],
};
export function AuthPage({ mode }: { mode: Mode }) {
  const { session, loading } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const cart = useCart();
  const destination = afterAuthPath(params.get("next"), cart.items.length > 0);
  const authSuffix = destination === "/finalizar-compra" ? "?next=/finalizar-compra" : "";
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [title, description, button] = copy[mode];
  if (!loading && session && ["login", "register"].includes(mode)) return <Navigate to={destination} replace />;
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (busy || !authConfigured) return;
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") || "").trim().toLowerCase();
    const password = String(form.get("password") || "");
    setError(""); setMessage("");
    if (mode === "register" && password !== form.get("confirmPassword")) { setError("As senhas precisam ser iguais."); return; }
    if (mode === "register" && (!String(form.get("name") || "").trim() || password.length < 6)) { setError("Informe seu nome e uma senha com pelo menos 6 caracteres."); return; }
    let username = "";
    if (mode === "register") {
      try { username = normalizeUsername(form.get("username")); }
      catch (error) { setError((error as Error).message); return; }
    }
    setBusy(true);
    try {
      const client = getAuthClient();
      if (mode === "login") {
        const result = email.includes("@")
          ? await client.auth.signInWithPassword({ email, password })
          : await client.auth.setSession(await loginRequest<{ access_token: string; refresh_token: string }>("/api/auth/username/login", { username: email, password }));
        if (result.error) throw result.error;
        navigate(destination, { replace: true });
      } else if (mode === "register") {
        const availability = await loginRequest<{ available: boolean }>("/api/auth/username/check", { username });
        if (!availability.available) throw new LoginRequestError("Este nome de usuário já está em uso. Escolha outro.");
        const result = await client.auth.signUp({ email, password, options: {
          emailRedirectTo: `${window.location.origin}/auth/confirmar`,
          // Preferência de uso; não concede papel administrativo nem acesso a lojas.
          data: { username, name: String(form.get("name")).trim(), account_type: form.get("accountType") === "seller" ? "seller" : "customer" },
        } });
        if (result.error) throw result.error;
        if (result.data.session) navigate(destination, { replace: true });
        else setMessage("Se o cadastro puder ser realizado, você receberá um e-mail de confirmação. Abra o link neste mesmo navegador. Confira também a pasta de spam. Já tem conta? Entre ou recupere sua senha.");
      } else if (mode === "forgot") {
        const result = await client.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/redefinir-senha` });
        if (result.error) throw result.error;
        setMessage("Se houver uma conta para esse e-mail, você receberá um link de recuperação. Abra o link neste mesmo navegador. Confira também a pasta de spam.");
      } else {
        const result = await client.auth.resend({ type: "signup", email, options: { emailRedirectTo: `${window.location.origin}/auth/confirmar` } });
        if (result.error) throw result.error;
        setMessage("Se a conta estiver aguardando confirmação, você receberá um novo link. Abra o link neste mesmo navegador.");
      }
    } catch (err) { setError(err instanceof LoginRequestError ? err.message : authErrorMessage(err)); } finally { setBusy(false); }
  };
  return <AuthLayout title={title} description={description}>
    {!authConfigured && <p className="notice warning" role="status">O acesso está sendo preparado. Cadastros e recuperação de senha estarão disponíveis em breve.</p>}
    {error && <p className="notice error" role="alert">{error}</p>}
    {message && <div className="notice success" role="status">{message}</div>}
    {message ? <div className="auth-links"><Link to="/login">Voltar para entrar</Link><button className="text-button" onClick={() => setMessage("")}>Usar outro e-mail</button></div> : <form onSubmit={submit} className="form"><fieldset disabled={busy || !authConfigured || loading}>
      {mode === "register" && <><label>Seu nome<input name="name" autoComplete="name" maxLength={100} required /></label><label>Como quer começar?<select name="accountType" defaultValue="customer"><option value="customer">Quero comprar</option><option value="seller">Quero vender e comprar</option></select></label></>}
      {mode === "register" && <><label>Nome de usuário<input name="username" autoComplete="username" minLength={3} maxLength={30} pattern="[a-zA-Z0-9][a-zA-Z0-9_.\-]{2,29}" required placeholder="ex.: ana.silva" aria-describedby="signup-username-hint" /></label><small id="signup-username-hint">De 3 a 30 caracteres: letras sem acento, números, ponto, hífen ou sublinhado.</small></>}
      <label>{mode === "login" ? "E-mail ou usuário" : "E-mail"}<input name="email" type={mode === "login" ? "text" : "email"} autoComplete={mode === "login" ? "username" : "email"} autoCapitalize="none" spellCheck={false} maxLength={254} required placeholder={mode === "login" ? "Seu e-mail ou nome de usuário" : "voce@exemplo.com"} /></label>
      {mode === "register" && <p className="fine-print">Uma única conta para comprar e vender. Use um e-mail único; se já tem cadastro, entre com ele.</p>}
      {(mode === "login" || mode === "register") && <PasswordField strong={mode === "register"} autoComplete={mode === "register" ? "new-password" : "current-password"} />}
      {mode === "register" && <PasswordField label="Confirme a senha" name="confirmPassword" autoComplete="new-password" />}
      {mode === "login" && <Link className="forgot-link" to="/recuperar-senha">Esqueci minha senha</Link>}
      <button className="button primary full" type="submit">{busy ? "Aguarde…" : button}</button>
    </fieldset></form>}
    <div className="auth-links">{mode === "login" ? <><p>Ainda não tem conta? <Link to={`/cadastro${authSuffix}`}>Cadastre-se</Link></p><Link to="/confirmar-email">Reenviar confirmação de e-mail</Link></> : <p>Já tem conta? <Link to={`/login${authSuffix}`}>Entrar</Link></p>}</div>
    {mode === "register" && <p className="fine-print">A conta de lojista também pode comprar como cliente. A escolha de lojista não ativa uma loja nem inicia uma cobrança. Após entrar, você poderá enviar o cadastro da loja para análise.</p>}
  </AuthLayout>;
}

export function ResetPasswordPage() {
  const { session, loading, recovery, linkError, finishRecovery } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!session || !recovery || linkError || busy) return;
    const form = new FormData(event.currentTarget);
    const password = String(form.get("password") || "");
    if (password.length < 6) { setError("Use pelo menos 6 caracteres."); return; }
    if (password !== form.get("confirmPassword")) { setError("As senhas precisam ser iguais."); return; }
    setBusy(true); setError("");
    try {
      const { error } = await getAuthClient().auth.updateUser({ password });
      if (error) throw error;
      finishRecovery(); setDone(true);
      // Sair desta sessão é conveniência: a troca de senha já foi concluída.
      await getAuthClient().auth.signOut({ scope: "local" });
    } catch (err) { setError(err instanceof LoginRequestError ? err.message : authErrorMessage(err)); } finally { setBusy(false); }
  };
  return <AuthLayout title="Escolha uma nova senha" description="Use uma senha diferente, que você não utiliza em outros sites.">
    {done ? <><p className="notice success" role="status">Senha atualizada com sucesso. Você já pode entrar com a nova senha.</p><Link className="button primary" to="/login">Entrar</Link></> : loading ? <p role="status">Validando seu link…</p> : !session || !recovery || linkError ? <><p className="notice warning" role="alert">O link é inválido, expirou ou foi aberto em outro navegador. Solicite um novo e abra no mesmo navegador em que fez a solicitação.</p><Link className="button primary" to="/recuperar-senha">Solicitar novo link</Link></> : <form onSubmit={submit} className="form">{error && <p className="notice error" role="alert">{error}</p>}<fieldset disabled={busy}><PasswordField label="Nova senha" strong autoComplete="new-password" /><PasswordField label="Confirme a nova senha" name="confirmPassword" autoComplete="new-password" /><button className="button primary full" type="submit">{busy ? "Salvando…" : "Salvar nova senha"}</button></fieldset></form>}
  </AuthLayout>;
}

export function ConfirmEmailPage() {
  const { items } = useCart();
  const { session, loading, linkError } = useAuth();
  return <AuthLayout title="Confirmação de e-mail" description="Estamos concluindo a verificação da sua conta.">{loading ? <p role="status">Validando seu link…</p> : session && !linkError ? <><p className="notice success" role="status">Seu e-mail foi confirmado.</p><Link className="button primary" to={items.length ? "/finalizar-compra" : "/minha-conta"}>{items.length ? "Continuar com meu carrinho" : "Acessar minha conta"}</Link></> : <><p className="notice warning" role="alert">Não foi possível confirmar este link. Ele pode ter expirado, já ter sido usado ou ter sido aberto em outro navegador.</p><Link className="button primary" to="/confirmar-email">Solicitar nova confirmação</Link><p className="auth-links"><Link to="/login">Já confirmei, quero entrar</Link></p></>}</AuthLayout>;
}