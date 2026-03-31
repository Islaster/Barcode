import express from "express";
import type { NextFunction, Request, Response } from "express";
import cors from "cors";
import barcodeRoutes from "./routes/barcodeRoutes.ts";
import { HttpError } from "./utils/httpError.ts";

export const app = express();

app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.use("/api/barcodes", barcodeRoutes);

app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (error instanceof HttpError) {
    return res.status(error.statusCode).json({
      error: error.message,
    });
  }

  console.error(error);

  return res.status(500).json({
    error: "Internal server error",
  });
});
