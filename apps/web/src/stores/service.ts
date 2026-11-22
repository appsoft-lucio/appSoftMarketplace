import type { Store, StoreInput } from "@appsoft/domain/stores";
import { getAuthClient } from "../auth/client";
async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const { data, error } = await getAuthClient().auth.getSession();
  if (error || !data.session) throw new Error("Sua sessão expirou. Entre novamente.");
  let response: Response;
  try {
    response = await fetch(path, { ...options, headers: { "Content-Type": "application/json", Authorization: `Bearer ${data.session.access_token}` } });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") throw error;
    throw new Error("Não foi possível conectar. Verifique sua conexão e tente novamente.");
  }
  const body = await response.json().catch(() => null);
  if (!response.ok) throw new Error(body?.message || "Não foi possível concluir. Tente novamente.");
  return body as T;
}
export const storesService = {
  list: (signal?: AbortSignal) => request<{ stores: Store[] }>("/api/stores/mine", { signal }),
  create: (input: StoreInput) => request<{ store: Store }>("/api/stores", { method: "POST", body: JSON.stringify(input) }),
};