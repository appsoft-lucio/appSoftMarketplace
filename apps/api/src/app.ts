import type { IncomingMessage, ServerResponse } from "node:http";
import { verifyUser, HttpError } from "./auth.ts";
import { storeService } from "./stores/service.ts";
import { validateStore } from "@appsoft/domain/stores";

type Dependencies = { verifyUser: typeof verifyUser; stores: typeof storeService };
function json(response: ServerResponse, status: number, body: unknown) {
  response.writeHead(status);
  response.end(JSON.stringify(body));
}
async function readBody(request: IncomingMessage): Promise<unknown> {
  if (!request.headers["content-type"]?.startsWith("application/json")) throw new HttpError(415, "Envie os dados em JSON.");
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of request) {
    const bytes = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    size += bytes.length;
    if (size > 8192) throw new HttpError(413, "Os dados enviados excedem o limite.");
    chunks.push(bytes);
  }
  try { return JSON.parse(Buffer.concat(chunks).toString("utf8")); }
  catch { throw new HttpError(400, "Os dados enviados são inválidos."); }
}
export function createApp(dependencies: Dependencies = { verifyUser, stores: storeService }) {
  return async (request: IncomingMessage, response: ServerResponse): Promise<void> => {
    response.setHeader("Content-Type", "application/json; charset=utf-8");
    response.setHeader("Cache-Control", "no-store");
    response.setHeader("X-Content-Type-Options", "nosniff");
    try {
      const path = new URL(request.url || "/", "http://localhost").pathname;
      if (request.method === "GET" && path === "/api/health") {
        json(response, 200, { status: "ok", service: "appsoft-api", database: process.env.DATABASE_URL ? "configured" : "not-configured" }); return;
      }
      if (!["/api/stores", "/api/stores/mine"].includes(path)) { json(response, 404, { message: "Rota não encontrada." }); return; }
      const allowed = path === "/api/stores/mine" ? "GET" : "POST";
      if (request.method !== allowed) { response.setHeader("Allow", allowed); json(response, 405, { message: "Método não permitido." }); return; }
      const token = request.headers.authorization?.match(/^Bearer ([^\s]+)$/i)?.[1];
      if (!token) throw new HttpError(401, "Entre na sua conta para continuar.");
      const user = await dependencies.verifyUser(token);
      if (request.method === "GET") { json(response, 200, { stores: await dependencies.stores.list(user) }); return; }
      const body = await readBody(request);
      let input;
      try { input = validateStore(body); } catch (error) { throw new HttpError(400, (error as Error).message); }
      json(response, 201, { store: await dependencies.stores.create(user, input) });
    } catch (error) {
      if (error instanceof HttpError) { json(response, error.status, { message: error.message }); return; }
      const code = error && typeof error === "object" && "code" in error ? String(error.code) : "";
      if (code === "23505" && error && typeof error === "object" && "constraint" in error && error.constraint === "stores_slug_key") { json(response, 409, { message: "Esse endereço de loja já está em uso. Escolha outro." }); return; }
      // Não retornar mensagens do driver: podem conter informações de conexão.
      console.error("Operação de loja indisponível.");
      json(response, 503, { message: "O cadastro de lojas está temporariamente indisponível. Tente novamente mais tarde." });
    }
  };
}
export const app = createApp();