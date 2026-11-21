import { productService } from "../services/productService.js";

function sendError(res, error) {
  res.status(error.status || 500).json({
    message: error.message || "Erro interno do servidor.",
  });
}

export const productController = {
  list(_req, res) {
    try {
      res.json({ products: productService.list() });
    } catch (error) {
      sendError(res, error);
    }
  },

  listMine(req, res) {
    try {
      res.json({
        products: productService.listByVendor(req.auth.sub),
      });
    } catch (error) {
      sendError(res, error);
    }
  },

  get(req, res) {
    try {
      res.json({ product: productService.getById(req.params.id) });
    } catch (error) {
      sendError(res, error);
    }
  },

  create(req, res) {
    try {
      const product = productService.create(req.auth.sub, req.body);
      res.status(201).json({ product });
    } catch (error) {
      sendError(res, error);
    }
  },

  update(req, res) {
    try {
      const product = productService.update(
        req.params.id,
        req.auth.sub,
        req.body,
      );
      res.json({ product });
    } catch (error) {
      sendError(res, error);
    }
  },

  remove(req, res) {
    try {
      productService.remove(req.params.id, req.auth.sub);
      res.status(204).send();
    } catch (error) {
      sendError(res, error);
    }
  },
};
