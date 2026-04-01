import { env } from "../config/env.ts";
import { HttpError } from "../utils/httpError.ts";

type TokenResponse = {
  access_token: string;
  token_type: string;
  expires_in: number;
};

let cachedToken: string | null = null;
let expiresAt = 0;

export async function getFatSecretAccessToken(scope: string): Promise<string> {
  const now = Date.now();

  if (cachedToken && now < expiresAt) {
    console.log(
      "[AUTH] ✅ Using cached token (expires in",
      Math.round((expiresAt - now) / 1000),
      "s)"
    );
    return cachedToken;
  }

  console.log("[AUTH] Requesting new FatSecret token...");
  console.log(
    `  CLIENT_ID: ${env.fatsecretClientId ? "✅ set" : "❌ MISSING"}`
  );
  console.log(
    `  CLIENT_SECRET: ${env.fatsecretClientSecret ? "✅ set" : "❌ MISSING"}`
  );
  console.log(`  SCOPE: ${env.fatsecretScope}`);

  const authHeader = Buffer.from(
    `${env.fatsecretClientId}:${env.fatsecretClientSecret}`
  ).toString("base64");

  const body =
    scope === "barcode"
      ? new URLSearchParams({
          grant_type: "client_credentials",
          scope: env.fatsecretScope,
        })
      : new URLSearchParams({
          grant_type: "client_credentials",
          scope: process.env.FATSECRET_SEARCH_SCOPE ?? "premier",
        });

  let response: globalThis.Response;
  try {
    response = await fetch("https://oauth.fatsecret.com/connect/token", {
      method: "POST",
      headers: {
        Authorization: `Basic ${authHeader}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
    });
  } catch (err) {
    console.error(
      "[AUTH] ❌ Network error reaching FatSecret token endpoint:",
      err
    );
    throw new HttpError(502, "Could not reach FatSecret auth server");
  }

  const raw = await response.text();
  console.log(`[AUTH] Token response status: ${response.status}`);

  if (!response.ok) {
    console.error(`[AUTH] ❌ Token request failed (${response.status}):`, raw);
    throw new HttpError(
      response.status,
      `FatSecret token request failed: ${raw}`
    );
  }

  let data: TokenResponse;
  try {
    data = JSON.parse(raw) as TokenResponse;
  } catch (err) {
    console.error("[AUTH] ❌ Failed to parse token response as JSON:", raw);
    throw new HttpError(502, "Invalid token response from FatSecret");
  }

  cachedToken = data.access_token;
  expiresAt = Date.now() + (data.expires_in - 60) * 1000;

  console.log(`[AUTH] ✅ Token acquired (expires in ${data.expires_in}s)`);

  return cachedToken;
}
