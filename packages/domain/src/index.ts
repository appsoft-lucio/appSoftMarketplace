export const BASIC_PLAN = Object.freeze({
  code: "basic",
  name: "Básico",
  monthlyPriceCents: 20000,
  activeProductLimit: 50,
});

// Sem descontos definidos: cada período usa o preço mensal integral.
export const BILLING_MONTHS = Object.freeze([1, 3, 6, 12]);

export interface Store { id: string; status: string }
export interface Subscription { storeId: string; status: string; startsAt: string; endsAt: string }
export interface Actor {
  id: string;
  role: string;
  memberships?: ReadonlyArray<{ storeId: string; role: string }>;
}

export function subscriptionPriceCents(months: number): number {
  if (!BILLING_MONTHS.includes(months)) {
    throw new RangeError("Período de assinatura inválido.");
  }
  return BASIC_PLAN.monthlyPriceCents * months;
}

export function isStoreVisible(store: Store | null, subscription: Subscription | null, now: Date | string = new Date()): boolean {
  if (store?.status !== "approved" || subscription?.status !== "active") {
    return false;
  }
  if (subscription.storeId !== store.id) return false;
  const startsAt = Date.parse(subscription.startsAt);
  const endsAt = Date.parse(subscription.endsAt);
  const time = new Date(now).getTime();
  return startsAt <= time && time < endsAt;
}

// actor deve vir da autenticação e de associações lidas no servidor.
export function canManageStore(actor: Actor | null, storeId: string): boolean {
  if (!actor?.id) return false;
  return actor.role === "admin" || (actor.memberships || []).some(
    (membership) => membership.storeId === storeId && membership.role === "owner",
  );
}

export function canActivateProduct(activeProductCount: number, limit: number = BASIC_PLAN.activeProductLimit): boolean {
  if (!Number.isInteger(activeProductCount) || activeProductCount < 0) return false;
  if (!Number.isInteger(limit) || limit <= 0) return false;
  return activeProductCount < limit;
}

export function formatMoney(cents: number): string {
  if (!Number.isSafeInteger(cents) || cents < 0) {
    throw new RangeError("Valores devem ser inteiros não negativos em centavos.");
  }
  return new Intl.NumberFormat("pt-BR", {
    style: "currency", currency: "BRL",
  }).format(cents / 100);
}
