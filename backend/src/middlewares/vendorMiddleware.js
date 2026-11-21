export function requireVendor(req, res, next) {
  if (req.auth.role !== "vendor") {
    return res.status(403).json({
      message: "Acesso permitido apenas para vendedores.",
    });
  }

  next();
}
