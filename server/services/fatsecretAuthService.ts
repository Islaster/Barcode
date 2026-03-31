import { env } from "../config/env.ts";
import { HttpError } from "../utils/httpError.ts";

type TokenResponse = {
  access_token: string;
  token_type: string;
  expires_in: number;
};

let cachedToken: string | null = null;
let expiresAt = 0;

export async function getFatSecretAccessToken(): Promise<string> {
  const now = Date.now();

  if (cachedToken && now < expiresAt) {
    return cachedToken;
  }

  const authHeader = Buffer.from(
    `${env.fatsecretClientId}:${env.fatsecretClientSecret}`
  ).toString("base64");

  const body = new URLSearchParams({
    grant_type: "client_credentials",
    scope: env.fatsecretScope,
  });

  const response = await fetch("https://oauth.fatsecret.com/connect/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${authHeader}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  const raw = await response.text();

  if (!response.ok) {
    throw new HttpError(
      response.status,
      `FatSecret token request failed: ${raw}`
    );
  }

  const data = JSON.parse(raw) as TokenResponse;

  cachedToken = data.access_token;
  expiresAt = Date.now() + (data.expires_in - 60) * 1000;

  return cachedToken;
}
