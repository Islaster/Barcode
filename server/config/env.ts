import dotenv from "dotenv";

dotenv.config();

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

export const env = {
  port: Number(process.env.PORT || 3001),
  fatsecretClientId: process.env.FATSECRET_CLIENT_ID,
  fatsecretClientSecret: process.env.FATSECRET_CLIENT_SECRET,
  fatsecretScope: process.env.FATSECRET_SCOPE || "barcode",
  fatsecretRegion: process.env.FATSECRET_REGION || "US",
};

// Debug env on startup
console.log("[ENV] Environment variables loaded:");
console.log(`  PORT: ${process.env.PORT || 3001}`);
console.log(
  `  FATSECRET_CLIENT_ID: ${env.fatsecretClientId ? "✅ set" : "❌ MISSING"}`
);
console.log(
  `  FATSECRET_CLIENT_SECRET: ${
    env.fatsecretClientSecret ? "✅ set" : "❌ MISSING"
  }`
);
console.log(`  FATSECRET_SCOPE: ${env.fatsecretScope}`);
console.log(`  FATSECRET_REGION: ${env.fatsecretRegion}`);
