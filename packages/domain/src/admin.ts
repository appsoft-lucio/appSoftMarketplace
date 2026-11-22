import type { Store } from "./stores.js";
export type StoreStatus = Store["status"];
export interface StoreReviewInput {
  status: "approved" | "suspended";
  expectedStatus: StoreStatus;
  reason: string;
}
export interface AdminStore extends Store { owners: Array<{ name: string; email: string }> }
export interface StoreReview {
  id: string;
  previous_status: StoreStatus;
  new_status: "approved" | "suspended";
  reason: string;
  actor_name: string;
  created_at: string;
}
export interface AdminStoreList {
  stores: AdminStore[];
  page: number;
  pageSize: number;
  total: number;
  counts: Record<StoreStatus, number>;
}
export interface AdminStoreQuery { status: StoreStatus | "all"; search: string; page: number }
export function validateStoreReview(body: unknown): StoreReviewInput {
  if (!body || typeof body !== "object" || Array.isArray(body)) throw new Error("Informe a decisão para esta loja.");
  const input = body as Record<string, unknown>;
  if (input.status !== "approved" && input.status !== "suspended") throw new Error("Selecione aprovar ou suspender.");
  if (!["pending", "approved", "suspended"].includes(String(input.expectedStatus))) throw new Error("Atualize a lista antes de continuar.");
  const reason = typeof input.reason === "string" ? input.reason.trim() : "";
  if (reason.length > 500) throw new Error("A observação deve ter até 500 caracteres.");
  if (input.status === "suspended" && reason.length < 10) throw new Error("Informe o motivo da suspensão com pelo menos 10 caracteres.");
  return { status: input.status, expectedStatus: input.expectedStatus as StoreStatus, reason };
}