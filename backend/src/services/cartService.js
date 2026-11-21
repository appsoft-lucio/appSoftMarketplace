import { cartRepository } from "../repositories/cartRepository.js";
import { productRepository } from "../repositories/productRepository.js";

function positiveInteger(value, fallback) {
  const quantity = Number(value ?? fallback);
  return Number.isInteger(quantity) && quantity > 0 ? quantity : null;
}

function validateProduct(productId) {
  const product = productRepository.findById(Number(productId));
  if (!product || product.active === 0) {
    throw { status: 404, message: "Produto não encontrado." };
  }
  return product;
}

export const cartService = {
  list(userId) {
    const items = cartRepository.findByUser(userId);
    const subtotal = items.reduce(
      (total, item) => total + item.price * item.quantity,
      0,
    );

    return { items, subtotal, shipping: 25, total: subtotal + 25 };
  },

  add(userId, productId, quantityValue) {
    const product = validateProduct(productId);
    const quantity = positiveInteger(quantityValue, 1);

    if (!quantity) {
      throw { status: 400, message: "Informe uma quantidade válida." };
    }

    if (quantity > product.stock) {
      throw {
        status: 400,
        message: "Quantidade maior que o estoque disponível.",
      };
    }

    const existing = cartRepository.findItem(userId, product.id);
    if (existing) {
      const nextQuantity = existing.quantity + quantity;
      if (nextQuantity > product.stock) {
        throw {
          status: 400,
          message: "Quantidade maior que o estoque disponível.",
        };
      }
      cartRepository.increment(userId, product.id, quantity);
    } else {
      cartRepository.add(userId, product.id, quantity);
    }

    return this.list(userId);
  },

  update(userId, productId, quantityValue) {
    const product = validateProduct(productId);
    const quantity = positiveInteger(quantityValue, null);

    if (!quantity) {
      throw { status: 400, message: "Informe uma quantidade válida." };
    }

    if (quantity > product.stock) {
      throw {
        status: 400,
        message: "Quantidade maior que o estoque disponível.",
      };
    }

    if (!cartRepository.findItem(userId, product.id)) {
      throw { status: 404, message: "Item não está no carrinho." };
    }

    cartRepository.setQuantity(userId, product.id, quantity);
    return this.list(userId);
  },

  remove(userId, productId) {
    if (!cartRepository.remove(userId, Number(productId))) {
      throw { status: 404, message: "Item não está no carrinho." };
    }
    return this.list(userId);
  },

  clear(userId) {
    cartRepository.clear(userId);
    return this.list(userId);
  },
};
