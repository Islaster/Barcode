import { env } from "../config/env.ts";
import { getFatSecretAccessToken } from "./fatsecretAuthService.ts";
import { HttpError } from "../utils/httpError.ts";

export async function findFoodByBarcode(barcode: string) {
  const token = await getFatSecretAccessToken();

  const url = new URL(
    "https://platform.fatsecret.com/rest/food/barcode/find-by-id/v2"
  );

  url.searchParams.set("barcode", barcode);
  url.searchParams.set("format", "json");
  url.searchParams.set("region", env.fatsecretRegion);
  url.searchParams.set("flag_default_serving", "true");

  const response = await fetch(url.toString(), {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const raw = await response.text();

  if (!response.ok) {
    throw new HttpError(
      response.status,
      `FatSecret barcode lookup failed: ${raw}`
    );
  }

  return JSON.parse(raw);
}
