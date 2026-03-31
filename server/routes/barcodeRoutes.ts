import { Router } from "express";
import { getProductByBarcode } from "../controllers/barcodeController.ts";

const router = Router();
router.get("/:barcode", getProductByBarcode);

export default router;
