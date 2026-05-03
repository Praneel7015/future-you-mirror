import "server-only";
import crypto from "node:crypto";

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

function getEnv(): { clientId: string; clientSecret: string; apiBase: string } {
  const clientId = process.env.PERFECT_CORP_CLIENT_ID;
  const clientSecret = process.env.PERFECT_CORP_CLIENT_SECRET;
  const apiBase = process.env.PERFECT_CORP_API_BASE;
  if (!clientId || !clientSecret || !apiBase) {
    throw new Error(
      "Missing Perfect Corp env vars. Required: PERFECT_CORP_CLIENT_ID, PERFECT_CORP_CLIENT_SECRET, PERFECT_CORP_API_BASE",
    );
  }
  return { clientId, clientSecret, apiBase };
}

/**
 * Wrap a raw key string with PEM headers if missing. Perfect Corp's console
 * sometimes hands back the base64 body without the BEGIN/END envelope.
 */
function toPem(key: string): string {
  // Normalize: support \n literals from .env files and strip surrounding whitespace
  const normalized = key.replace(/\\n/g, "\n").trim();

  if (normalized.includes("-----BEGIN")) {
    return normalized;
  }

  // Wrap raw base64 as an X.509 SubjectPublicKeyInfo PEM (most common for Perfect Corp)
  const body = normalized.replace(/\s+/g, "");
  const lines = body.match(/.{1,64}/g) ?? [];
  return `-----BEGIN PUBLIC KEY-----\n${lines.join("\n")}\n-----END PUBLIC KEY-----`;
}

function buildIdToken(clientId: string, pemKey: string): string {
  const plaintext = `client_id=${clientId}&timestamp=${Date.now()}`;
  const encrypted = crypto.publicEncrypt(
    {
      key: pemKey,
      padding: crypto.constants.RSA_PKCS1_PADDING,
    },
    Buffer.from(plaintext, "utf8"),
  );
  return encrypted.toString("base64");
}

async function fetchAccessToken(): Promise<string> {
  const { clientId, clientSecret, apiBase } = getEnv();
  const pemKey = toPem(clientSecret);
  const idToken = buildIdToken(clientId, pemKey);

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
