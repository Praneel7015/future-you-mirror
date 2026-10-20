import "server-only";
import { encryptIdToken } from "./public-key";

/**
 * Perfect Corp authentication.
 *
 * Auth flow:
 *   1. Build plaintext = `client_id=<id>&timestamp=<ms>`
 *   2. RSA-encrypt with the PEM public key from `PERFECT_CORP_CLIENT_SECRET`
 *   3. Base64 the ciphertext → `id_token`
 *   4. POST { client_id, id_token } to /s2s/v1.0/client/auth
 *   5. Receive { result: { access_token } }, valid 2 hours
 *
 * Token is cached in process memory for 90 minutes.
 */

interface AuthResponse {
  status: number;
  result?: { access_token: string };
  error?: string;
  error_code?: string;
  message?: string;
}

const TOKEN_TTL_MS = 90 * 60 * 1000; // 90 minutes (Perfect Corp tokens last 2 hours)

let cachedToken: string | null = null;
let cachedAt = 0;

/** Documented auth host. Used when PERFECT_CORP_API_BASE is unset. */
export const DEFAULT_API_BASE = "https://yce-api-01.perfectcorp.com";

function getEnv(): { clientId: string; clientSecret: string; apiBase: string } {
  const clientId = process.env.PERFECT_CORP_CLIENT_ID?.trim();
  const clientSecret = process.env.PERFECT_CORP_CLIENT_SECRET?.trim();
  const apiBase = process.env.PERFECT_CORP_API_BASE?.trim() || DEFAULT_API_BASE;
  if (!clientId || !clientSecret) {
    throw new Error(
      "Missing Perfect Corp env vars. Required: PERFECT_CORP_CLIENT_ID, PERFECT_CORP_CLIENT_SECRET",
    );
  }
  return { clientId, clientSecret, apiBase: apiBase.replace(/\/+$/, "") };
}

function buildIdToken(clientId: string, secret: string): string {
  return encryptIdToken(clientId, secret);
}

async function fetchAccessToken(): Promise<string> {
  const { clientId, clientSecret, apiBase } = getEnv();
  const idToken = buildIdToken(clientId, clientSecret);

  const res = await fetch(`${apiBase}/s2s/v1.0/client/auth`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ client_id: clientId, id_token: idToken }),
    cache: "no-store",
  });

  const data = (await res.json()) as AuthResponse;

  if (!res.ok || data.status !== 200 || !data.result?.access_token) {
    throw new Error(
      `Perfect Corp auth failed (HTTP ${res.status}, status=${data.status}): ${
        data.error_code ?? data.error ?? data.message ?? "unknown error"
      }`,
    );
  }

  return data.result.access_token;
}

/**
 * Returns a valid access token, fetching a new one if cache is empty or stale.
 */
export async function getAccessToken(): Promise<string> {
  const now = Date.now();
  if (cachedToken && now - cachedAt < TOKEN_TTL_MS) {
    return cachedToken;
  }
  const token = await fetchAccessToken();
  cachedToken = token;
  cachedAt = now;
  return token;
}

/**
 * Force-clear the cached token. Call this after a 401 from a downstream API.
 */
export function invalidateAccessToken(): void {
  cachedToken = null;
  cachedAt = 0;
}
