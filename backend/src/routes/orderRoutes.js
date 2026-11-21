import { Router } from "express";
import { authenticate } from "../middlewares/authMiddleware.js";
import { requireVendor } from "../middlewares/vendorMiddleware.js";
import { orderController } from "../controllers/orderController.js";

const router = Router();

router.use(authenticate);

router.post("/checkout", orderController.checkout);
router.get("/mine", orderController.listMine);
router.get("/vendor/mine", requireVendor, orderController.listVendor);
router.patch("/vendor/:id/status", requireVendor, orderController.updateStatus);
router.get("/:id", orderController.get);
router.patch("/:id/cancel", orderController.cancel);

export default router;
