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

    if (!rawBarcode) {
      throw new HttpError(400, "Barcode is required.");
    }
    if (Array.isArray(rawBarcode))
      return console.error("error: barcode is array");
    const gtin13 = toGtin13(rawBarcode);
    const data = await findFoodByBarcode(gtin13);

    res.status(200).json({
      barcode: gtin13,
      source: "fatsecret",
      data,
    });
  } catch (error) {
    next(error);
  }
}
