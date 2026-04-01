import type { Request, Response, NextFunction } from "express";
import { findFoodByName } from "../services/fatsecretFoodService.ts";
import { HttpError } from "../utils/httpError.ts";

export async function getProductByName(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const rawName = req.query.name;
    console.log(`[CONTROLLER] Food name search request received: "${rawName}"`);

    if (!rawName) {
      console.error("[CONTROLLER] ❌ No food name provided in request");
      throw new HttpError(400, "Food name is required.");
    }
    if (Array.isArray(rawName)) {
      console.error(
        "[CONTROLLER] ❌ Food name is array — unexpected input:",
        rawName
      );
      return console.error("error: food name is array");
    }

    const trimmedName = (rawName as string).trim();
    console.log(`[CONTROLLER] Trimmed food name: "${trimmedName}"`);

    if (!trimmedName) {
      console.error("[CONTROLLER] ❌ Food name is blank after trimming");
      throw new HttpError(400, "Food name is required.");
    }

    const data = await findFoodByName(trimmedName);
    console.log(
      `[CONTROLLER] ✅ Food data retrieved for name: "${trimmedName}"`
    );
    console.log(`[CONTROLLER] Response keys:`, Object.keys(data || {}));

    res.status(200).json({
      name: trimmedName,
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
