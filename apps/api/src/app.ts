import type { IncomingMessage, ServerResponse } from "node:http";
import { publicService } from "./public/service.ts";
import { parseCart } from "@appsoft/domain/cart";
import { catalogService } from "./catalog/service.ts";
import { parseCatalogQuery } from "@appsoft/domain/catalog";
import { verifyUser, HttpError } from "./auth.ts";
import { storeService } from "./stores/service.ts";
import { adminService } from "./admin/service.ts";
import { validateStore } from "@appsoft/domain/stores";
import { validateStoreReview } from "@appsoft/domain/admin";
import type { AdminStoreQuery } from "@appsoft/domain/admin";

type Dependencies = { verifyUser: typeof verifyUser; stores: typeof storeService; admin?: typeof adminService; catalog?: typeof catalogService; public?: typeof publicService };
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
function adminQuery(url: URL): AdminStoreQuery {
  const status = url.searchParams.get("status") || "pending";
  const search = (url.searchParams.get("q") || "").trim();
  const page = Number(url.searchParams.get("page") || 1);
  if (!["pending", "approved", "suspended", "all"].includes(status) || search.length > 100 || !Number.isInteger(page) || page < 1 || page > 100000) throw new HttpError(400, "Filtros inválidos.");
  return { status: status as AdminStoreQuery["status"], search, page };
}
export function createApp(dependencies: Dependencies = { verifyUser, stores: storeService, admin: adminService }) {
  const admin = dependencies.admin || adminService;
  return async (request: IncomingMessage, response: ServerResponse): Promise<void> => {
    response.setHeader("Content-Type", "application/json; charset=utf-8");
    response.setHeader("Cache-Control", "no-store");
    response.setHeader("X-Content-Type-Options", "nosniff");
    try {
      const url = new URL(request.url || "/", "http://localhost");
      const path = url.pathname;
      if (request.method === "GET" && path === "/api/health") {
        json(response, 200, { status: "ok", service: "appsoft-api", database: process.env.DATABASE_URL ? "configured" : "not-configured" }); return;
      }
      if (path === "/api/catalog") {
        if (request.method !== "GET") { response.setHeader("Allow", "GET"); json(response, 405, { message: "Método não permitido." }); return; }
        let query;
        try { query = parseCatalogQuery(url.searchParams); } catch (error) { throw new HttpError(400, (error as Error).message); }
        json(response, 200, await (dependencies.catalog || catalogService).list(query)); return;
      }
      if (path.startsWith("/api/public/")) {
        const service = dependencies.public || publicService;
        const storeMatch = path.match(/^\/api\/public\/stores\/([a-z0-9]+(?:-[a-z0-9]+)*)$/);
        const productMatch = path.match(/^\/api\/public\/products\/([a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12})$/i);
        const quote = path === "/api/public/cart/quote";
        if (!quote && path !== "/api/public/stores" && !storeMatch && !productMatch) { json(response, 404, { message: "Página não encontrada." }); return; }
        const allowed = quote ? "POST" : "GET";
        if (request.method !== allowed) { response.setHeader("Allow", allowed); json(response, 405, { message: "Método não permitido." }); return; }
        if (quote) {
          const body = await readBody(request);
          let items;
          try { items = parseCart(body); } catch (error) { throw new HttpError(400, (error as Error).message); }
          json(response, 200, await service.quote(items)); return;
        }
        if (productMatch) {
          const product = await service.product(productMatch[1]);
          if (!product) throw new HttpError(404, "Produto não encontrado ou indisponível.");
          json(response, 200, { product }); return;
        }
        if (storeMatch) {
          const store = await service.store(storeMatch[1]);
          if (!store) throw new HttpError(404, "Loja não encontrada ou indisponível.");
          json(response, 200, { store }); return;
        }
        const search = (url.searchParams.get("q") || "").trim();
        const page = Number(url.searchParams.get("page") || 1);
        if (search.length > 100 || !Number.isInteger(page) || page < 1 || page > 100000) throw new HttpError(400, "Filtros inválidos.");
        json(response, 200, await service.stores(search, page)); return;
      }
      const adminAction = path.match(/^\/api\/admin\/stores\/([^/]+)\/(status|history)$/);
      const isList = path === "/api/admin/stores";
      const isCustomers = path === "/api/admin/customers";
      const isProfile = path === "/api/me";
      if (!["/api/stores", "/api/stores/mine"].includes(path) && !isList && !isCustomers && !isProfile && !adminAction) { json(response, 404, { message: "Rota não encontrada." }); return; }
      const allowed = path === "/api/stores" ? "POST" : adminAction?.[2] === "status" ? "PATCH" : "GET";
      if (request.method !== allowed) { response.setHeader("Allow", allowed); json(response, 405, { message: "Método não permitido." }); return; }
      const token = request.headers.authorization?.match(/^Bearer ([^\s]+)$/i)?.[1];
      if (!token) throw new HttpError(401, "Entre na sua conta para continuar.");
      const user = await dependencies.verifyUser(token);
      if (isCustomers) {
        const search = (url.searchParams.get("q") || "").trim();
        const page = Number(url.searchParams.get("page") || 1);
        if (search.length > 100 || !Number.isInteger(page) || page < 1 || page > 100000) throw new HttpError(400, "Filtros inválidos.");
        json(response, 200, await admin.customers(user, { search, page })); return;
      }
      if (isProfile) { json(response, 200, { role: await admin.profile(user) }); return; }
      if (isList) { json(response, 200, await admin.list(user, adminQuery(url))); return; }
      if (adminAction) {
        const storeId = adminAction[1];
        if (!/^[a-f0-9]{8}(-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(storeId)) throw new HttpError(400, "Identificador de loja inválido.");
        if (adminAction[2] === "history") { json(response, 200, { reviews: await admin.history(user, storeId) }); return; }
        const body = await readBody(request);
        let input;
        try { input = validateStoreReview(body); } catch (error) { throw new HttpError(400, (error as Error).message); }
        json(response, 200, { store: await admin.review(user, storeId, input) }); return;
      }
      if (request.method === "GET") { json(response, 200, { stores: await dependencies.stores.list(user) }); return; }
      const body = await readBody(request);
      let input;
      try { input = validateStore(body); } catch (error) { throw new HttpError(400, (error as Error).message); }
      json(response, 201, { store: await dependencies.stores.create(user, input) });
    } catch (error) {
      if (error instanceof HttpError) { json(response, error.status, { message: error.message }); return; }
      const code = error && typeof error === "object" && "code" in error ? String(error.code) : "";
      if (code === "23505" && error && typeof error === "object" && "constraint" in error && error.constraint === "stores_slug_key") { json(response, 409, { message: "Esse endereço de loja já está em uso. Escolha outro." }); return; }
      console.error("Operação do marketplace indisponível.");
      json(response, 503, { message: "O serviço está temporariamente indisponível. Tente novamente mais tarde." });
    }
  };
}
export const app = createApp();
