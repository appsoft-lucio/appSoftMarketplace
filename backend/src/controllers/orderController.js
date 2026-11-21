import { orderService } from "../services/orderService.js";

function sendError(res, error) {
  const status = error.status || 500;
  if (status === 500)
    console.error("API database error:", error.code || "unknown");
  res.status(status).json({
    message: status === 500 ? "Erro interno do servidor." : error.message,
  });
}

export const orderController = {
  async checkout(req, res) {
    try {
      res
        .status(201)
        .json({ order: await orderService.checkout(req.auth.sub) });
    } catch (error) {
      sendError(res, error);
    }
  },

  async listMine(req, res) {
    try {
      res.json({ orders: await orderService.listByCustomer(req.auth.sub) });
    } catch (error) {
      sendError(res, error);
    }
  },

  async get(req, res) {
    try {
      const order = await orderService.getCustomerOrder(
        req.auth.sub,
        Number(req.params.id),
      );
      res.json({ order });
    } catch (error) {
      sendError(res, error);
    }
  },

  async cancel(req, res) {
    try {
      const order = await orderService.cancelByCustomer(
        req.auth.sub,
        Number(req.params.id),
      );
      res.json({ order });
    } catch (error) {
      sendError(res, error);
    }
  },

  async listVendor(req, res) {
    try {
      res.json({ orders: await orderService.listByVendor(req.auth.sub) });
    } catch (error) {
      sendError(res, error);
    }
  },

  async updateStatus(req, res) {
    try {
      const order = await orderService.updateStatus(
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
