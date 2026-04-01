import express from "express";
import type { NextFunction, Request, Response } from "express";
import cors from "cors";
import barcodeRoutes from "./routes/barcodeRoutes.ts";
import searchRoutes from "./routes/searchRoutes.ts";
import { HttpError } from "./utils/httpError.ts";

export const app = express();

app.use(cors());
app.use(express.json());

// Request logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  console.log(`[APP] ➡️  ${req.method} ${req.url}`);
  console.log(`  Origin: ${req.headers.origin || "none"}`);

  res.on("finish", () => {
    const duration = Date.now() - start;
    console.log(
      `[APP] ⬅️  ${req.method} ${req.url} → ${res.statusCode} (${duration}ms)`
    );
  });

  next();
});

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.use("/api/barcodes", barcodeRoutes);
app.use("/api/food", searchRoutes);

app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (error instanceof HttpError) {
    console.error(`[APP] ⚠️  HttpError ${error.statusCode}: ${error.message}`);
    return res.status(error.statusCode).json({
      error: error.message,
    });
  }

  console.error("[APP] ❌ Unhandled error:", error);
  if (error instanceof Error) {
    console.error(`  Message: ${error.message}`);
    console.error(`  Stack: ${error.stack}`);
  }

  return res.status(500).json({
    error: "Internal server error",
  });
});
