export function normalizeUsername(value: unknown): string {
  if (typeof value !== "string") throw new Error("Informe um nome de usuário.");
  const username = value.trim().toLowerCase();
  if (!/^[a-z0-9][a-z0-9_.-]{2,29}$/.test(username)) {
    throw new Error("Use de 3 a 30 caracteres: letras sem acento, números, ponto, hífen ou sublinhado.");
  }
  return username;
}
