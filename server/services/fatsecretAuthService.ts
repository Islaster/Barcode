import { env } from "../config/env.ts";
import { HttpError } from "../utils/httpError.ts";
type CachedToken = {
  token: string;
  expiresAt: number;
};

const tokenCache = new Map<string, CachedToken>();

export async function getFatSecretAccessToken(scope: string): Promise<string> {
  const now = Date.now();
  const cached = tokenCache.get(scope);

  if (cached && now < cached.expiresAt) {
    return cached.token;
  }

  const authHeader = Buffer.from(
    `${env.fatsecretClientId}:${env.fatsecretClientSecret}`
  ).toString("base64");

  const body = new URLSearchParams({
    grant_type: "client_credentials",
    scope,
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
    throw new Error(`FatSecret token request failed: ${raw}`);
  }

  const data = JSON.parse(raw) as {
    access_token: string;
    expires_in: number;
  };

  tokenCache.set(scope, {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in - 60) * 1000,
  });

  return data.access_token;
}
