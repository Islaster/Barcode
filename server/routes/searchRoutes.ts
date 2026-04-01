import { Router } from "express";
import { getProductByName } from "../controllers/searchController.ts";

const router = Router();
router.get("/search", getProductByName);

export default router;
