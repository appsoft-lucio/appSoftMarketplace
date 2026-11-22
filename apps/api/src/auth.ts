export interface Identity { id: string; email: string; name: string }
export class HttpError extends Error {
  constructor(public status: number, message: string) { super(message); }
}
export async function verifyUser(token: string): Promise<Identity> {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new HttpError(503, "O cadastro de lojas está sendo preparado. Tente novamente mais tarde.");
  let response: Response;
  try {
    response = await fetch(`${url.replace(/\/$/, "")}/auth/v1/user`, {
      headers: { apikey: key, Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(10000),
    });
  } catch { throw new HttpError(503, "Não foi possível validar seu acesso. Tente novamente."); }
  if (response.status >= 500 || response.status === 429) throw new HttpError(503, "Não foi possível validar seu acesso. Tente novamente.");
  if (!response.ok) throw new HttpError(401, "Sua sessão expirou. Entre novamente.");
  const user = await response.json() as { id?: string; email?: string; email_confirmed_at?: string; user_metadata?: { name?: unknown } };
  if (!user.id || !user.email) throw new HttpError(401, "Entre novamente para continuar.");
  if (!user.email_confirmed_at) throw new HttpError(403, "Confirme seu e-mail antes de cadastrar uma loja.");
  return { id: user.id, email: user.email.toLowerCase(), name: typeof user.user_metadata?.name === "string" ? user.user_metadata.name.trim().slice(0, 100) || "Lojista" : "Lojista" };
}