import { Router } from "express";
import { authenticate } from "../middlewares/authMiddleware.js";
import { requireVendor } from "../middlewares/vendorMiddleware.js";
import { productController } from "../controllers/productController.js";

const router = Router();

router.get("/", productController.list);
router.get("/mine", authenticate, requireVendor, productController.listMine);
router.get("/:id", productController.get);
router.post("/", authenticate, requireVendor, productController.create);
router.put("/:id", authenticate, requireVendor, productController.update);
router.delete("/:id", authenticate, requireVendor, productController.remove);

export default router;
