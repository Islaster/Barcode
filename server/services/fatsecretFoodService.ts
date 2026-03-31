import { env } from "../config/env.ts";
import { getFatSecretAccessToken } from "./fatsecretAuthService.ts";
import { HttpError } from "../utils/httpError.ts";

export async function findFoodByBarcode(barcode: string) {
  console.log(`[FOOD SERVICE] Looking up barcode: "${barcode}"`);
  console.log(`  Region: ${env.fatsecretRegion}`);

  const token = await getFatSecretAccessToken();

  const url = new URL(
    "https://platform.fatsecret.com/rest/food/barcode/find-by-id/v2"
  );

  url.searchParams.set("barcode", barcode);
  url.searchParams.set("format", "json");
  url.searchParams.set("region", env.fatsecretRegion);
  url.searchParams.set("flag_default_serving", "true");

  console.log(`[FOOD SERVICE] Fetching: ${url.toString()}`);

  let response: globalThis.Response;
  try {
    response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  } catch (err) {
    console.error(
      "[FOOD SERVICE] ❌ Network error reaching FatSecret food endpoint:",
      err
    );
    throw new HttpError(502, "Could not reach FatSecret food service");
  }

  const raw = await response.text();
  console.log(`[FOOD SERVICE] Response status: ${response.status}`);

  if (!response.ok) {
    console.error(`[FOOD SERVICE] ❌ Lookup failed (${response.status}):`, raw);
    throw new HttpError(
      response.status,
      `FatSecret barcode lookup failed: ${raw}`
    );
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    console.error(
      "[FOOD SERVICE] ❌ Failed to parse food response as JSON:",
      raw
    );
    throw new HttpError(502, "Invalid food response from FatSecret");
  }

  console.log("[FOOD SERVICE] ✅ Successfully parsed food data");
  console.log(`  Response keys:`, Object.keys(parsed as object));

  return parsed;
}
