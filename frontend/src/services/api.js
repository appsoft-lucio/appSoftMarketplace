const API_URL = (
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV ? "http://localhost:4000/api" : "")
).replace(/\/+$/, "");

export async function apiRequest(path, options = {}) {
  if (!API_URL) {
    throw new Error("O serviço está indisponível no momento. Tente novamente mais tarde.");
  }

  const token = localStorage.getItem("appsoft_token");

  let response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
    });
  } catch (error) {
    if (error.name === "AbortError") throw error;
    throw new Error("Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.");
  }

  if (response.status === 204) return null;

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || "Erro na comunicação com o servidor.");
  }

  return data;
}
