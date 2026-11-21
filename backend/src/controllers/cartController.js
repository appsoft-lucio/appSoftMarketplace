import { cartService } from "../services/cartService.js";

function sendError(res, error) {
  const status = error.status || 500;
  if (status === 500)
    console.error("API database error:", error.code || "unknown");
  res.status(status).json({
    message: status === 500 ? "Erro interno do servidor." : error.message,
  });
}

export const cartController = {
  async list(req, res) {
    try {
      res.json(await cartService.list(req.auth.sub));
    } catch (error) {
      sendError(res, error);
    }
  },

  async add(req, res) {
    try {
      const result = await cartService.add(
        req.auth.sub,
        req.body.productId,
        req.body.quantity,
      );
      res.status(201).json(result);
    } catch (error) {
      sendError(res, error);
    }
  },

  async update(req, res) {
    try {
      const result = await cartService.update(
        req.auth.sub,
        req.params.productId,
        req.body.quantity,
      );
      res.json(result);
    } catch (error) {
      sendError(res, error);
    }
  },

  async remove(req, res) {
    try {
      res.json(await cartService.remove(req.auth.sub, req.params.productId));
    } catch (error) {
      sendError(res, error);
    }
  },

  async clear(req, res) {
    try {
      res.json(await cartService.clear(req.auth.sub));
    } catch (error) {
      sendError(res, error);
    }
  },
};
