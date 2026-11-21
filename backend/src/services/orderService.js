import { orderRepository } from "../repositories/orderRepository.js";

const customerStatuses = ["cancelado"];
const vendorStatuses = ["pago", "em_transito", "entregue", "cancelado"];

export const orderService = {
  checkout(customerId) {
    return orderRepository.createTransaction(customerId);
  },

  listByCustomer(customerId) {
    return orderRepository.findByCustomer(customerId);
  },

  listByVendor(vendorId) {
    return orderRepository.findByVendor(vendorId);
  },

  getCustomerOrder(customerId, orderId) {
    const order = orderRepository.getWithItems(orderId);
    if (!order || order.customer_id !== customerId) {
      throw { status: 404, message: "Pedido não encontrado." };
    }
    return order;
  },

  cancelByCustomer(customerId, orderId) {
    const order = this.getCustomerOrder(customerId, orderId);

    if (
      !customerStatuses.includes("cancelado") ||
      order.status === "cancelado"
    ) {
      throw { status: 400, message: "O pedido não pode ser cancelado." };
    }

    if (!["processando", "pago"].includes(order.status)) {
      throw { status: 400, message: "O pedido já está em andamento." };
    }

    orderRepository.updateStatus(orderId, "cancelado");
    return orderRepository.getWithItems(orderId);
  },

  updateStatus(vendorId, orderId, status) {
    if (!vendorStatuses.includes(status)) {
      throw { status: 400, message: "Status inválido." };
    }

    if (!orderRepository.belongsToVendor(orderId, vendorId)) {
      throw { status: 404, message: "Pedido não encontrado." };
    }

    if (!orderRepository.updateStatus(orderId, status)) {
      throw { status: 404, message: "Pedido não encontrado." };
    }

    return orderRepository.getWithItems(orderId);
  },
};
