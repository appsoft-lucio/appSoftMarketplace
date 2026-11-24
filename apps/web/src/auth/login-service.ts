export class LoginRequestError extends Error {}
export async function loginRequest<T>(path: string, body: unknown): Promise<T> {
  let response: Response;
  try {
    response = await fetch(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body), signal: AbortSignal.timeout(10_000) });
  } catch { throw new LoginRequestError("Não foi possível conectar. Verifique sua conexão e tente novamente."); }
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new LoginRequestError(typeof data?.message === "string" ? data.message : "Não foi possível concluir. Tente novamente.");
  return data as T;
}
