import { authService } from "../services/authService.js";

function sendError(res, error) {
  res.status(error.status || 500).json({
    message: error.message || "Erro interno do servidor.",
  });
}

export const authController = {
  register(req, res) {
    try {
      const result = authService.register(req.body);
      res.status(201).json(result);
    } catch (error) {
      sendError(res, error);
    }
  },

  login(req, res) {
    try {
      const result = authService.login(req.body);
      res.json(result);
    } catch (error) {
      sendError(res, error);
    }
  },

  me(req, res) {
    try {
      const user = authService.getAuthenticatedUser(req.auth.sub);
      res.json({ user });
    } catch (error) {
      sendError(res, error);
    }
  },
};
