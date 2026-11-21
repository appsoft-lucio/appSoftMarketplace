import { cartRepository } from "../repositories/cartRepository.js";

function positiveInteger(value, fallback) {
  const quantity = Number(value ?? fallback);
  if (!Number.isInteger(quantity) || quantity <= 0) {
    throw { status: 400, message: "Informe uma quantidade valida." };
  }
  return quantity;
}

export const cartService = {
  async list(userId) {
    const items = await cartRepository.findByUser(userId);
    const subtotal = Number(
      items
        .reduce((total, item) => total + item.price * item.quantity, 0)
        .toFixed(2),
    );
    return { items, subtotal, shipping: 25, total: subtotal + 25 };
  },
  async add(userId, productId, quantityValue) {
    await cartRepository.setItem(
      userId,
      Number(productId),
      positiveInteger(quantityValue, 1),
      true,
    );
    return this.list(userId);
  },
  async update(userId, productId, quantityValue) {
    await cartRepository.setItem(
      userId,
      Number(productId),
      positiveInteger(quantityValue),
      false,
    );
    return this.list(userId);
  },
  async remove(userId, productId) {
    if (!(await cartRepository.remove(userId, Number(productId)))) {
      throw { status: 404, message: "Item nao esta no carrinho." };
    }
    return this.list(userId);
  },
  async clear(userId) {
    await cartRepository.clear(userId);
    return this.list(userId);
  },
};
