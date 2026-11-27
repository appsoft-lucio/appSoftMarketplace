import { timingSafeEqual } from "node:crypto";
import { productUuid } from "@appsoft/domain/products";
import { HttpError, type Identity } from "../auth.ts";
import { getPool } from "../database.ts";
import type { Database } from "../stores/repository.ts";

const sandbox = "https://sandbox.asaas.com";
const sessionDuration = 10;

function settings() {
  const key = process.env.ASAAS_SANDBOX_API_KEY;
  const token = process.env.ASAAS_WEBHOOK_TOKEN;
  const origin = process.env.ASAAS_RETURN_ORIGIN;
  if (!key || !token || token.length < 32 || !origin) return null;
  try {
    const url = new URL(origin);
    return url.protocol === "https:" && !url.username && !url.password
      ? { key, token, returnUrl: new URL("/meus-pedidos", url).href }
      : null;
  } catch {
    return null;
  }
}

export function asaasEnabled() {
  return settings() !== null;
}

export function authenticateAsaasWebhook(header: string | string[] | undefined) {
  const token = settings()?.token;
  if (!token) throw new HttpError(404, "Pagamento indisponível.");
  const expected = Buffer.from(token);
  const received = Buffer.from(typeof header === "string" ? header : "");
  if (expected.length !== received.length || !timingSafeEqual(expected, received)) {
    throw new HttpError(401, "Webhook não autorizado.");
  }
}

const link = (id: string) => ({ url: `${sandbox}/checkoutSession/show?id=${id}` });

export async function startAsaasCheckout(user: Identity, id: string, database?: Database, send = fetch) {
  const config = settings();
  if (!config) throw new HttpError(404, "Pagamento indisponível.");
  const db = database ?? getPool();
  // Reserve the only creation attempt before making a network request.
  const claim = await db.query<{ total: string }>(`
    UPDATE marketplace_v2.checkouts c SET asaas_status='creating'
    WHERE c.id=$1 AND c.asaas_status IS NULL
      AND c.expires_at > clock_timestamp() + interval '11 minutes'
      AND c.customer_id IN (SELECT id FROM marketplace_v2.users WHERE auth_subject=$2)
      AND EXISTS (SELECT 1 FROM marketplace_v2.store_orders WHERE checkout_id=c.id)
      AND NOT EXISTS (SELECT 1 FROM marketplace_v2.store_orders WHERE checkout_id=c.id AND status<>'pending_payment')
    RETURNING (SELECT sum(total_cents) FROM marketplace_v2.store_orders WHERE checkout_id=c.id) AS total`, [id, user.id]);
  if (!claim.rows.length) {
    const existing = (await db.query<{ asaas_checkout_id: string | null }>(`
      SELECT CASE WHEN c.asaas_status='active' AND LEAST(c.asaas_expires_at,c.expires_at) > clock_timestamp()
        THEN c.asaas_checkout_id END AS asaas_checkout_id
      FROM marketplace_v2.checkouts c JOIN marketplace_v2.users u ON u.id=c.customer_id
      WHERE c.id=$1 AND u.auth_subject=$2`, [id, user.id])).rows[0];
    if (!existing) throw new HttpError(404, "Compra não encontrada.");
    if (existing.asaas_checkout_id) return link(existing.asaas_checkout_id);
    throw new HttpError(409, "O pagamento não está disponível para esta reserva. Atualize seus pedidos.");
  }

  const total = Number(claim.rows[0].total);
  if (!Number.isSafeInteger(total) || total <= 0) {
    await db.query("UPDATE marketplace_v2.checkouts SET asaas_status=NULL WHERE id=$1", [id]);
    throw new HttpError(409, "Esta compra não tem um valor válido para pagamento.");
  }

  let providerId: string;
  const expiresAt = new Date(Date.now() + sessionDuration * 60_000);
  try {
    const response = await send("https://api-sandbox.asaas.com/v3/checkouts", {
      method: "POST",
      redirect: "error",
      signal: AbortSignal.timeout(8000),
      headers: { "Content-Type": "application/json", access_token: config.key, "User-Agent": "AppSoft Marketplace/1.0" },
      body: JSON.stringify({
        billingTypes: ["PIX"], chargeTypes: ["DETACHED"], minutesToExpire: sessionDuration,
        externalReference: id,
        callback: { successUrl: config.returnUrl, cancelUrl: config.returnUrl, expiredUrl: config.returnUrl },
        items: [{ name: "Compra AppSoft Marketplace", description: `Compra ${id}`, quantity: 1, value: total / 100 }],
      }),
    });
    if (!response.ok) throw new Error("Asaas checkout rejected");
    const result = await response.json() as { id?: unknown };
    if (typeof result.id !== "string" || !productUuid.test(result.id)) throw new Error("Asaas checkout ID missing");
    providerId = result.id;
  } catch {
    // A timeout may occur after Asaas creates the checkout. Never retry creation blindly.
    throw new HttpError(502, "O Asaas não confirmou a criação do checkout. Confira seus pedidos antes de iniciar outra reserva.");
  }

  const saved = await db.query<{ active: boolean }>(`
    UPDATE marketplace_v2.checkouts SET asaas_checkout_id=$2, asaas_status='active', asaas_expires_at=$3
    WHERE id=$1 AND asaas_status='creating'
    RETURNING expires_at > clock_timestamp() + interval '10 minutes' AS active`, [id, providerId, expiresAt]);
  if (!saved.rows[0]?.active) throw new HttpError(409, "A reserva não tem mais tempo suficiente para pagamento.");
  return link(providerId);
}

export async function applyAsaasEvent(db: Database, raw: unknown) {
  const body = raw as { event?: unknown; checkout?: { id?: unknown } } | null;
  const event = body?.event;
  if (event !== "CHECKOUT_PAID" && event !== "CHECKOUT_CANCELED" && event !== "CHECKOUT_EXPIRED") return;
  const providerId = body?.checkout?.id;
  if (typeof providerId !== "string" || !productUuid.test(providerId)) {
    throw new HttpError(400, "Identificador do checkout Asaas inválido.");
  }
  const checkout = (await db.query<{ id: string; asaas_status: string }>(`
    SELECT id, asaas_status FROM marketplace_v2.checkouts WHERE asaas_checkout_id=$1 FOR UPDATE`, [providerId])).rows[0];
  if (!checkout || ["paid", "review"].includes(checkout.asaas_status)) return;

  if (event !== "CHECKOUT_PAID") {
    await db.query(`UPDATE marketplace_v2.checkouts SET asaas_status='closed',
      expires_at=LEAST(expires_at, clock_timestamp()) WHERE id=$1 AND asaas_status='active'`, [checkout.id]);
    return;
  }

  const orders = (await db.query<{ id: string; status: string }>(`
    SELECT id, status FROM marketplace_v2.store_orders WHERE checkout_id=$1 ORDER BY store_id,id FOR UPDATE`,
    [checkout.id])).rows;
  if (checkout.asaas_status !== "active" || !orders.length || orders.some(order => order.status !== "pending_payment")) {
    await db.query("UPDATE marketplace_v2.checkouts SET asaas_status='review' WHERE id=$1", [checkout.id]);
    return;
  }
  await db.query("UPDATE marketplace_v2.checkouts SET asaas_status='paid' WHERE id=$1", [checkout.id]);
  await db.query(`
    WITH updated AS (
      UPDATE marketplace_v2.store_orders SET status='processing' WHERE checkout_id=$1 RETURNING id
    )
    INSERT INTO marketplace_v2.order_events(order_id,status,note)
    SELECT id,'processing','Pagamento Pix confirmado no Sandbox Asaas.' FROM updated`, [checkout.id]);
}

export async function receiveAsaasEvent(raw: unknown) {
  const client = await getPool().connect();
  try {
    await client.query("BEGIN");
    await applyAsaasEvent(client, raw);
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
