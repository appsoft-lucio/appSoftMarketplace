export interface StoreInput {
  name: string;
  slug: string;
  description: string;
  phone: string;
  city: string;
  state: string;
}
export interface Store extends StoreInput {
  id: string;
  status: "pending" | "approved" | "suspended";
  plan_code: string;
  created_at: string;
}
const states = new Set("AC AL AP AM BA CE DF ES GO MA MT MS MG PA PB PR PE PI RJ RN RS RO RR SC SP SE TO".split(" "));
export function storeSlug(name: string): string {
  return name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 64).replace(/-$/, "");
}
export function validateStore(value: unknown): StoreInput {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Informe os dados da loja.");
  const input = value as Record<string, unknown>;
  const text = (key: string) => typeof input[key] === "string" ? input[key].trim() : "";
  const name = text("name");
  const slug = text("slug").toLowerCase();
  const description = text("description");
  const phone = text("phone").replace(/\D/g, "");
  const city = text("city");
  const state = text("state").toUpperCase();
  if (name.length < 3 || name.length > 120) throw new Error("O nome da loja deve ter entre 3 e 120 caracteres.");
  if (slug.length < 3 || slug.length > 64 || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) throw new Error("O endereço da loja deve ter de 3 a 64 caracteres, usando letras sem acento, números e hífens.");
  if (description.length < 20 || description.length > 1000) throw new Error("A descrição deve ter entre 20 e 1.000 caracteres.");
  if (!/^\d{10,11}$/.test(phone)) throw new Error("Informe um telefone com DDD (10 ou 11 dígitos).");
  if (city.length < 2 || city.length > 100) throw new Error("Informe a cidade da loja (2 a 100 caracteres).");
  if (!states.has(state)) throw new Error("Selecione um estado brasileiro.");
  return { name, slug, description, phone, city, state };
}
export const BRAZIL_STATES = [...states].sort();