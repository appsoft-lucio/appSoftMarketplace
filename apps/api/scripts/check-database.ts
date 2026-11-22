import { getPool } from "../src/database.ts";
const pool = getPool();
try {
  const migrations = await pool.query("SELECT name FROM appsoft_internal.migrations ORDER BY name");
  const plan = await pool.query("SELECT monthly_price_cents, active_product_limit FROM marketplace_v2.plans WHERE code = 'basic'");
  const counts = await pool.query("SELECT (SELECT count(*)::int FROM marketplace_v2.users) AS users, (SELECT count(*)::int FROM marketplace_v2.stores) AS stores");
  const policies = await pool.query("SELECT count(*)::int AS tables, count(*) FILTER (WHERE rowsecurity)::int AS protected_tables FROM pg_tables WHERE schemaname = 'marketplace_v2'");
  console.log(JSON.stringify({ migrations: migrations.rows.map(row => row.name), basicPlan: plan.rows[0], records: counts.rows[0], security: policies.rows[0] }, null, 2));
} catch {
  console.error("Não foi possível verificar o banco. Confira a conexão, o certificado e as migrações.");
  process.exitCode = 1;
} finally { await pool.end(); }
