import { Router } from "express";
import { authenticate } from "../middlewares/authMiddleware.js";
import { cartController } from "../controllers/cartController.js";

const router = Router();

router.use(authenticate);

router.get("/", cartController.list);
router.post("/items", cartController.add);
router.put("/items/:productId", cartController.update);
router.delete("/items/:productId", cartController.remove);
router.delete("/", cartController.clear);

export default router;
