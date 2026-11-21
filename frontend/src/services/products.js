import { apiRequest } from "./api";

export const productService = {
  list: () => apiRequest("/products"),
  mine: () => apiRequest("/products/mine"),
  get: (id) => apiRequest(`/products/${id}`),
  create: (product) =>
    apiRequest("/products", {
      method: "POST",
      body: JSON.stringify(product),
    }),
  update: (id, product) =>
    apiRequest(`/products/${id}`, {
      method: "PUT",
      body: JSON.stringify(product),
    }),
  remove: (id) =>
    apiRequest(`/products/${id}`, {
      method: "DELETE",
    }),
};
