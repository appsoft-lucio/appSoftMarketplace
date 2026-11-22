const messages: Record<string, string> = {
  invalid_credentials: "E-mail ou senha incorretos.",
  email_not_confirmed: "Confirme seu e-mail antes de entrar. Você pode solicitar outro link abaixo.",
  weak_password: "Escolha uma senha mais forte, com pelo menos 12 caracteres.",
  same_password: "A nova senha deve ser diferente da senha atual.",
  over_email_send_rate_limit: "Aguarde alguns minutos antes de solicitar outro e-mail.",
  over_request_rate_limit: "Muitas tentativas. Aguarde alguns minutos e tente novamente.",
  otp_expired: "O link expirou ou já foi utilizado. Solicite um novo link.",
  flow_state_expired: "O link expirou. Solicite outro e abra no mesmo navegador.",
  flow_state_not_found: "Abra o link no navegador em que você fez a solicitação ou solicite outro.",
  bad_code_verifier: "Abra o link no navegador em que você fez a solicitação ou solicite outro.",
  signup_disabled: "Novos cadastros estão temporariamente indisponíveis.",
  email_address_invalid: "Informe um endereço de e-mail válido.",
  user_already_exists: "Não foi possível concluir o cadastro. Tente entrar ou recuperar sua senha.",
};
export function authErrorMessage(error: unknown): string {
  const code = typeof error === "object" && error !== null && "code" in error ? String(error.code) : "";
  return messages[code] || "Não foi possível concluir. Verifique sua conexão e tente novamente.";
}