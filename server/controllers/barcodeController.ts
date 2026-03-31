import type { Request, Response, NextFunction } from "express";
import { toGtin13 } from "../utils/barcode.ts";
import { findFoodByBarcode } from "../services/fatsecretFoodService.ts";
import { HttpError } from "../utils/httpError.ts";

export async function getProductByBarcode(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const rawBarcode = req.params.barcode;
    console.log(`[CONTROLLER] Barcode request received: "${rawBarcode}"`);

    if (!rawBarcode) {
      console.error("[CONTROLLER] ❌ No barcode provided in request");
      throw new HttpError(400, "Barcode is required.");
    }
    if (Array.isArray(rawBarcode)) {
      console.error(
        "[CONTROLLER] ❌ Barcode is array — unexpected input:",
        rawBarcode
      );
      return console.error("error: barcode is array");
    }
    const gtin13 = toGtin13(rawBarcode);
    console.log(`[CONTROLLER] Converted to GTIN-13: "${gtin13}"`);
    const data = await findFoodByBarcode(gtin13);
    console.log(`[CONTROLLER] ✅ Food data retrieved for barcode: "${gtin13}"`);
    console.log(`[CONTROLLER] Response keys:`, Object.keys(data || {}));

    res.status(200).json({
      barcode: gtin13,
      source: "fatsecret",
      data,
    });
  } catch (error) {
    if (error instanceof HttpError) {
      console.error(
        `[CONTROLLER] ⚠️  HttpError ${error.statusCode}: ${error.message}`
      );
    } else {
      console.error("[CONTROLLER] ❌ Unexpected error:", error);
    }
    next(error);
  }
}
