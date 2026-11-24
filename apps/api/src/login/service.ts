import { createHash } from "node:crypto";
import { normalizeUsername } from "@appsoft/domain/username";
import type { Database } from "../stores/repository.ts";
import { getPool } from "../database.ts";
import { HttpError } from "../auth.ts";
import type { Identity } from "../auth.ts";

function parse(value: unknown) {
  try { return normalizeUsername(value); }
  catch (error) { throw new HttpError(400, (error as Error).message); }
}
export function createLoginService(database: () => Database, authenticate: (email: string, password: string) => Promise<{ access_token: string; refresh_token: string }>) {
  return {
    async available(body: unknown) {
      const username = parse((body as { username?: unknown } | null)?.username);
      const result = await database().query("SELECT 1 FROM marketplace_v2.login_names WHERE username = $1", [username]);
      return { available: result.rows.length === 0 };
    },
    async profile(user: Identity) {
      const result = await database().query<{ username: string }>("SELECT username FROM marketplace_v2.login_names WHERE auth_subject = $1", [user.id]);
      return { username: result.rows[0]?.username || null };
    },
    async save(user: Identity, body: unknown) {
      const username = parse((body as { username?: unknown } | null)?.username);
      try {
        await database().query("INSERT INTO marketplace_v2.login_names(auth_subject,username) VALUES ($1,$2) ON CONFLICT (auth_subject) DO UPDATE SET username=EXCLUDED.username, updated_at=now()", [user.id, username]);
        return { username };
      } catch (error) {
        if ((error as { code?: string }).code === "23505") throw new HttpError(409, "Este nome de usuário já está em uso. Escolha outro.");
        throw error;
      }
    },
    async login(body: unknown) {
      const input = body as { username?: unknown; password?: unknown } | null;
      const username = parse(input?.username);
      if (typeof input?.password !== "string" || !input.password || input.password.length > 128) throw new HttpError(400, "Informe sua senha.");
      const db = database();
      const hash = createHash("sha256").update(username).digest("hex");
      await db.query("DELETE FROM marketplace_v2.username_login_limits WHERE expires_at < now()");
      const limit = await db.query<{ attempts: number }>(
        "INSERT INTO marketplace_v2.username_login_limits(identifier_hash,attempts,expires_at) VALUES ($1,1,now()+interval '1 minute') ON CONFLICT (identifier_hash) DO UPDATE SET attempts=username_login_limits.attempts+1 RETURNING attempts", [hash]);
      if (limit.rows[0].attempts > 10) throw new HttpError(429, "Muitas tentativas. Aguarde um minuto e tente novamente.");
      const result = await db.query<{ email: string }>(
        "SELECT u.email FROM marketplace_v2.login_names n JOIN auth.users u ON u.id=n.auth_subject WHERE n.username=$1 AND u.deleted_at IS NULL AND NOT coalesce(u.is_sso_user,false)", [username]);
      // Unknown names still go through the provider's password verification.
      const tokens = await authenticate(result.rows[0]?.email || "unknown-login@appsoft.invalid", input.password);
      if (!result.rows.length) throw new HttpError(401, "Usuário ou senha incorretos.");
      return tokens;
    },
  };
}
async function authenticate(email: string, password: string) {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new HttpError(503, "O acesso está temporariamente indisponível.");
  let response: Response;
  try {
    response = await fetch(new URL("/auth/v1/token?grant_type=password", url), {
      method: "POST", headers: { apikey: key, "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }), signal: AbortSignal.timeout(10_000),
    });
  } catch { throw new HttpError(503, "Não foi possível conectar. Tente novamente."); }
  if (response.status === 429) throw new HttpError(429, "Muitas tentativas. Aguarde alguns minutos.");
  if (response.status >= 500) throw new HttpError(503, "O acesso está temporariamente indisponível.");
  if (!response.ok) throw new HttpError(401, "Usuário ou senha incorretos.");
  const data = await response.json();
  if (typeof data.access_token !== "string" || typeof data.refresh_token !== "string") throw new HttpError(503, "Não foi possível concluir o acesso.");
  return { access_token: data.access_token, refresh_token: data.refresh_token };
}
export const loginService = createLoginService(() => getPool() as unknown as Database, authenticate);
