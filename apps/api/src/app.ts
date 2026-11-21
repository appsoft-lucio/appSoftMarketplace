import type { IncomingMessage, ServerResponse } from "node:http";

export function app(request: IncomingMessage, response: ServerResponse): void {
  const url = new URL(request.url || "/", "http://localhost");
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  response.setHeader("Cache-Control", "no-store");
  response.setHeader("X-Content-Type-Options", "nosniff");

  if (request.method === "GET" && url.pathname === "/api/health") {
    // Liveness da API, não atesta conexão com banco ou pagamentos.
    response.writeHead(200);
    response.end(JSON.stringify({ status: "ok", service: "appsoft-api", database: "not-configured" }));
    return;
  }
  response.writeHead(404);
  response.end(JSON.stringify({ message: "Rota não encontrada." }));
}
