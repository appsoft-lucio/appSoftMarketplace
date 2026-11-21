import { apiRequest } from "./api";

export const cartService = {
  list: () => apiRequest("/cart"),
  add: (productId, quantity = 1) =>
    apiRequest("/cart/items", {
      method: "POST",
      body: JSON.stringify({ productId, quantity }),
    }),
  update: (productId, quantity) =>
    apiRequest(`/cart/items/${productId}`, {
      method: "PUT",
      body: JSON.stringify({ quantity }),
    }),
  remove: (productId) =>
    apiRequest(`/cart/items/${productId}`, {
      method: "DELETE",
    }),
  clear: () =>
    apiRequest("/cart", {
      method: "DELETE",
    }),
};
