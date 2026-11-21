import { orderService } from "../services/orderService.js";

function sendError(res, error) {
  res.status(error.status || 500).json({
    message: error.message || "Erro interno do servidor.",
  });
}

export const orderController = {
  checkout(req, res) {
    try {
      res.status(201).json({ order: orderService.checkout(req.auth.sub) });
    } catch (error) {
      sendError(res, error);
    }
  },

  listMine(req, res) {
    try {
      res.json({ orders: orderService.listByCustomer(req.auth.sub) });
    } catch (error) {
      sendError(res, error);
    }
  },

  get(req, res) {
    try {
      const order = orderService.getCustomerOrder(req.auth.sub, Number(req.params.id));
      res.json({ order });
    } catch (error) {
      sendError(res, error);
    }
  },

  cancel(req, res) {
    try {
      const order = orderService.cancelByCustomer(req.auth.sub, Number(req.params.id));
      res.json({ order });
    } catch (error) {
      sendError(res, error);
    }
  },

  listVendor(req, res) {
    try {
      res.json({ orders: orderService.listByVendor(req.auth.sub) });
    } catch (error) {
      sendError(res, error);
    }
  },

  updateStatus(req, res) {
    try {
      const order = orderService.updateStatus(
        req.auth.sub,
        Number(req.params.id),
        req.body.status,
      );
      res.json({ order });
    } catch (error) {
      sendError(res, error);
    }
  },
};
