import { authService } from "../services/authService.js";

function sendError(res, error) {
  const status = error.status || 500;
  if (status === 500)
    console.error("API database error:", error.code || "unknown");
  res.status(status).json({
    message: status === 500 ? "Erro interno do servidor." : error.message,
  });
}

export const authController = {
  async register(req, res) {
    try {
      const result = await authService.register(req.body);
      res.status(201).json(result);
    } catch (error) {
      sendError(res, error);
    }
  },

  async login(req, res) {
    try {
      const result = await authService.login(req.body);
      res.json(result);
    } catch (error) {
      sendError(res, error);
    }
  },

  async me(req, res) {
    try {
      const user = await authService.getAuthenticatedUser(req.auth.sub);
      res.json({ user });
    } catch (error) {
      sendError(res, error);
    }
  },
};
