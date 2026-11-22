import { getPool } from "../src/database.ts";
// Comando de manutenção local. Não existe endpoint público para promover contas.
const emailIndex = process.argv.indexOf("--email");
const email = emailIndex >= 0 ? process.argv[emailIndex + 1]?.trim().toLowerCase() : "";
if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
  console.error("Informe --email com o e-mail exato de uma conta já sincronizada.");
  process.exitCode = 1;
} else {
  const pool = getPool();
  try {
    const result = await pool.query("UPDATE marketplace_v2.users SET role = 'admin' WHERE lower(email) = $1 RETURNING id", [email]);
    if (result.rowCount !== 1) throw new Error("ACCOUNT_NOT_FOUND");
    console.log("Acesso de administrador concedido à conta selecionada.");
  } catch {
    console.error("Não foi possível conceder acesso. Verifique a conexão e se a conta já está sincronizada no marketplace.");
    process.exitCode = 1;
  } finally { await pool.end(); }
}