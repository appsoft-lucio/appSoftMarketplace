import { cartService } from "../services/cartService.js";

function sendError(res, error) {
  res.status(error.status || 500).json({
    message: error.message || "Erro interno do servidor.",
  });
}

export const cartController = {
  list(req, res) {
    try {
      res.json(cartService.list(req.auth.sub));
    } catch (error) {
      sendError(res, error);
    }
  },

  add(req, res) {
    try {
      const result = cartService.add(
        req.auth.sub,
        req.body.productId,
        req.body.quantity,
      );
      res.status(201).json(result);
    } catch (error) {
      sendError(res, error);
    }
  },

  update(req, res) {
    try {
      const result = cartService.update(
        req.auth.sub,
        req.params.productId,
        req.body.quantity,
      );
      res.json(result);
    } catch (error) {
      sendError(res, error);
    }
  },

  remove(req, res) {
    try {
      res.json(cartService.remove(req.auth.sub, req.params.productId));
    } catch (error) {
      sendError(res, error);
    }
  },

  clear(req, res) {
    try {
      res.json(cartService.clear(req.auth.sub));
    } catch (error) {
      sendError(res, error);
    }
  },
};
