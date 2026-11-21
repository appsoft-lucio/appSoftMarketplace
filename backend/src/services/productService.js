import { productRepository } from "../repositories/productRepository.js";

function validateProduct(product) {
  const name = product.name?.trim();
  const category = product.category?.trim();
  const price = Number(product.price);
  const stock = Number(product.stock ?? 0);

  if (!name || !category) {
    throw { status: 400, message: "Nome e categoria são obrigatórios." };
  }

  if (!Number.isFinite(price) || price < 0) {
    throw { status: 400, message: "Informe um preço válido." };
  }

  if (!Number.isInteger(stock) || stock < 0) {
    throw { status: 400, message: "Informe uma quantidade de estoque válida." };
  }

  return {
    name,
    description: product.description?.trim() || "",
    price,
    category,
    stock,
    imageUrl: product.imageUrl?.trim() || "",
  };
}

export const productService = {
  list() {
    return productRepository.findAll();
  },

  listByVendor(vendorId) {
    return productRepository.findByVendor(vendorId);
  },

  getById(id) {
    const product = productRepository.findById(Number(id));
    if (!product || product.active === 0) {
      throw { status: 404, message: "Produto não encontrado." };
    }
    return product;
  },

  create(vendorId, payload) {
    const product = validateProduct(payload);
    return productRepository.create({ ...product, vendorId });
  },

  update(id, vendorId, payload) {
    const product = validateProduct(payload);
    const existing = productRepository.findById(Number(id));

    if (!existing || existing.vendor_id !== vendorId) {
      throw { status: 404, message: "Produto não encontrado." };
    }

    const updated = productRepository.update(Number(id), vendorId, {
      ...product,
      active: payload.active === false ? 0 : 1,
    });

    if (!updated) {
      throw { status: 404, message: "Produto não encontrado." };
    }
    return updated;
  },

  remove(id, vendorId) {
    if (!productRepository.remove(Number(id), vendorId)) {
      throw { status: 404, message: "Produto não encontrado." };
    }
  },
};
