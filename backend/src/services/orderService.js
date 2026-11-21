import { orderRepository } from "../repositories/orderRepository.js";

const customerStatuses = ["cancelado"];
const vendorStatuses = ["pago", "em_transito", "entregue", "cancelado"];

export const orderService = {
  async checkout(customerId) {
    return await orderRepository.createTransaction(customerId);
  },

  async listByCustomer(customerId) {
    return await orderRepository.findByCustomer(customerId);
  },

  async listByVendor(vendorId) {
    return await orderRepository.findByVendor(vendorId);
  },

  async getCustomerOrder(customerId, orderId) {
    const order = await orderRepository.getWithItems(orderId);
    if (!order || order.customer_id !== customerId) {
      throw { status: 404, message: "Pedido não encontrado." };
    }
    return order;
  },

  async cancelByCustomer(customerId, orderId) {
    const order = await this.getCustomerOrder(customerId, orderId);

    if (
      !customerStatuses.includes("cancelado") ||
      order.status === "cancelado"
    ) {
      throw { status: 400, message: "O pedido não pode ser cancelado." };
    }

    if (!["processando", "pago"].includes(order.status)) {
      throw { status: 400, message: "O pedido já está em andamento." };
    }

    await orderRepository.updateStatus(orderId, "cancelado");
    return await orderRepository.getWithItems(orderId);
  },

  async updateStatus(vendorId, orderId, status) {
    if (!vendorStatuses.includes(status)) {
      throw { status: 400, message: "Status inválido." };
    }

    if (!(await orderRepository.belongsToVendor(orderId, vendorId))) {
      throw { status: 404, message: "Pedido não encontrado." };
    }

    if (!(await orderRepository.updateStatus(orderId, status))) {
      throw { status: 404, message: "Pedido não encontrado." };
    }

    return await orderRepository.getWithItems(orderId);
  },
};
