import { createServer } from "node:http";
import { app } from "./app.ts";

const port = Number(process.env.PORT || 4000);
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error("PORT deve estar entre 1 e 65535.");
}
const server = createServer(app);
server.listen(port, "127.0.0.1", () => console.log(`API local: http://localhost:${port}/api/health`));
for (const signal of ["SIGTERM", "SIGINT"]) {
  process.on(signal, () => server.close());
}
