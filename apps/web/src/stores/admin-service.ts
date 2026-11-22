import type { AdminStoreList, AdminStoreQuery, StoreReview, StoreReviewInput } from "@appsoft/domain/admin";
import { request } from "./service";
export const adminService = {
  profile: (signal?: AbortSignal) => request<{ role: "admin" | "customer" }>("/api/me", { signal }),
  list: (query: AdminStoreQuery, signal?: AbortSignal) => request<AdminStoreList>(`/api/admin/stores?${new URLSearchParams({ status: query.status, q: query.search, page: String(query.page) })}`, { signal }),
  history: (id: string, signal?: AbortSignal) => request<{ reviews: StoreReview[] }>(`/api/admin/stores/${id}/history`, { signal }),
  review: (id: string, input: StoreReviewInput) => request(`/api/admin/stores/${id}/status`, { method: "PATCH", body: JSON.stringify(input) }),
};