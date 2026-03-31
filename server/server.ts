import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { debug } from "./utils/debug.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Log startup environment
debug.log("server", "Starting server with environment:", {
  NODE_ENV: process.env.NODE_ENV,
  PORT,
  FATSECRET_KEY: process.env.FATSECRET_KEY ? "✅ Set" : "❌ MISSING",
  FATSECRET_SECRET: process.env.FATSECRET_SECRET ? "✅ Set" : "❌ MISSING",
});

// CORS
app.use(
  cors({
    origin: (origin, callback) => {
      debug.log("server", `CORS request from origin: ${origin || "none"}`);
      callback(null, true);
    },
  })
);

app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  debug.request(req);

  res.on("finish", () => {
    const duration = Date.now() - start;
    debug.log(
      "api",
      `${req.method} ${req.url} → ${res.statusCode} (${duration}ms)`
    );
  });

  next();
});

// Health check endpoint
app.get("/health", (req, res) => {
  debug.log("api", "Health check hit");
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    env: {
      fatsecretKey: process.env.FATSECRET_KEY ? "set" : "missing",
      fatsecretSecret: process.env.FATSECRET_SECRET ? "set" : "missing",
    },
  });
});

// Barcode endpoint
app.get("/api/barcodes/:barcode", async (req, res) => {
  const { barcode } = req.params;
  debug.log("api", `Barcode lookup: ${barcode}`);

  try {
    // Get FatSecret access token
    debug.log("fatsecret", "Requesting access token...");

    const tokenRes = await fetch("https://oauth.fatsecret.com/connect/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${Buffer.from(
          `${process.env.FATSECRET_KEY}:${process.env.FATSECRET_SECRET}`
        ).toString("base64")}`,
      },
      body: "grant_type=client_credentials&scope=basic",
    });

    debug.log("fatsecret", `Token response status: ${tokenRes.status}`);

    if (!tokenRes.ok) {
      const tokenErr = await tokenRes.text();
      debug.error("fatsecret", "Token request failed", tokenErr);
      res.status(500).json({ error: "Failed to authenticate with FatSecret" });
      return;
    }

    const tokenData = await tokenRes.json();
    debug.log("fatsecret", "Token received ✅");

    // Search by barcode
    const searchUrl = `https://platform.fatsecret.com/rest/food/barcode/findByBarCode/v1.0?barcode=${barcode}&format=json`;
    debug.log("fatsecret", `Searching: ${searchUrl}`);

    const searchRes = await fetch(searchUrl, {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    });

    debug.log("fatsecret", `Search response status: ${searchRes.status}`);

    if (!searchRes.ok) {
      const searchErr = await searchRes.text();
      debug.error("fatsecret", "Barcode search failed", searchErr);
      res.status(searchRes.status).json({ error: "Barcode not found" });
      return;
    }

    const searchData = await searchRes.json();
    debug.log("fatsecret", "Search result:", searchData);

    // Validate response structure
    if (!searchData?.food) {
      debug.error("fatsecret", "Response missing 'food' property", searchData);
      res.status(404).json({ error: "No food data found for this barcode" });
      return;
    }

    debug.log(
      "api",
      `Barcode ${barcode} resolved to: ${searchData.food.food_name}`
    );

    res.json({
      barcode,
      source: "fatsecret",
      data: searchData,
    });
  } catch (err) {
    debug.error("api", `Barcode lookup failed for ${barcode}`, err);
    res.status(500).json({
      error: "Internal server error",
      message: err instanceof Error ? err.message : "Unknown error",
    });
  }
});

app.listen(PORT, () => {
  debug.log("server", `Server running on port ${PORT} ✅`);
});
