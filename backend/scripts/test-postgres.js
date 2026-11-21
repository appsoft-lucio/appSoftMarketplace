import "dotenv/config";
import { spawn } from "node:child_process";

if (!process.env.DATABASE_URL) {
  console.error(
    "Configure DATABASE_URL para executar os testes no PostgreSQL real.",
  );
  process.exitCode = 1;
} else {
  const child = spawn(process.execPath, ["--test", "tests/checkout.test.js"], {
    stdio: "inherit",
    env: { ...process.env, TEST_DATABASE_URL: process.env.DATABASE_URL },
  });
  child.on("exit", (code) => {
    process.exitCode = code ?? 1;
  });
}
