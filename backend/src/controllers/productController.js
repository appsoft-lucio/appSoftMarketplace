import { productService } from "../services/productService.js";

function sendError(res, error) {
  const status = error.status || 500;
  if (status === 500)
    console.error("API database error:", error.code || "unknown");
  res.status(status).json({
    message: status === 500 ? "Erro interno do servidor." : error.message,
  });
}

export const productController = {
  async list(_req, res) {
    try {
      res.json({ products: await productService.list() });
    } catch (error) {
      sendError(res, error);
    }
  },

  async listMine(req, res) {
    try {
      res.json({
        products: await productService.listByVendor(req.auth.sub),
      });
    } catch (error) {
      sendError(res, error);
    }
  },

  async get(req, res) {
    try {
      res.json({ product: await productService.getById(req.params.id) });
    } catch (error) {
      sendError(res, error);
    }
  },

  async create(req, res) {
    try {
      const product = await productService.create(req.auth.sub, req.body);
      res.status(201).json({ product });
    } catch (error) {
      sendError(res, error);
    }
  },

  async update(req, res) {
    try {
      const product = await productService.update(
        req.params.id,
        req.auth.sub,
        req.body,
      );
      res.json({ product });
    } catch (error) {
      sendError(res, error);
    }
  },

  async remove(req, res) {
    try {
      await productService.remove(req.params.id, req.auth.sub);
      res.status(204).send();
    } catch (error) {
      sendError(res, error);
    }
  },
};
