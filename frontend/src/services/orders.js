import { apiRequest } from "./api";

export const orderService = {
  checkout: () =>
    apiRequest("/orders/checkout", {
      method: "POST",
    }),
  mine: () => apiRequest("/orders/mine"),
  get: (id) => apiRequest(`/orders/${id}`),
  cancel: (id) =>
    apiRequest(`/orders/${id}/cancel`, {
      method: "PATCH",
    }),
  mineVendor: () => apiRequest("/orders/vendor/mine"),
  updateStatus: (id, status) =>
    apiRequest(`/orders/vendor/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),
};
