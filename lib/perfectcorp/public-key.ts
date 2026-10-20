import crypto from "node:crypto";

/**
 * Turn the misnamed PERFECT_CORP_CLIENT_SECRET value into an SPKI PEM.
 * The value is the RSA public key from Perfect Corp, not an OAuth secret.
 * Never include the key text in an error.
 */

export class PublicKeyFormatError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PublicKeyFormatError";
  }
}

const PASTE_PUBLIC_KEY =
  "Paste the RSA public key from Perfect Corp, not the private key or a client secret string.";

const PRIVATE_KEY_MESSAGE = `PERFECT_CORP_CLIENT_SECRET is a private key. ${PASTE_PUBLIC_KEY}`;

const UNREADABLE_MESSAGE = `PERFECT_CORP_CLIENT_SECRET is not an RSA public key this server can read. ${PASTE_PUBLIC_KEY}`;

const PRIVATE_PEM = /-----BEGIN (?:RSA |ENCRYPTED |OPENSSH )?PRIVATE KEY-----/;

function unwrapSecretText(raw: string): string {
  let text = raw.replace(/^\uFEFF/, "").trim();
  for (let i = 0; i < 3; i += 1) {
    const doubleQuoted = text.startsWith('"') && text.endsWith('"') && text.length >= 2;
    const singleQuoted = text.startsWith("'") && text.endsWith("'") && text.length >= 2;
    if (!doubleQuoted && !singleQuoted) break;
    text = text.slice(1, -1).trim();
  }
  return text.replace(/\\r\\n/g, "\n").replace(/\\n/g, "\n").replace(/\r\n/g, "\n").trim();
}

function wrapPem(label: "PUBLIC KEY" | "RSA PUBLIC KEY", body: string): string {
  const lines = body.match(/.{1,64}/g) ?? [];
  return `-----BEGIN ${label}-----\n${lines.join("\n")}\n-----END ${label}-----`;
}

function asPublicRsa(key: crypto.KeyObject): string {
  if (key.type === "private") {
    throw new PublicKeyFormatError(PRIVATE_KEY_MESSAGE);
  }
  if (key.asymmetricKeyType !== "rsa") {
    throw new PublicKeyFormatError(UNREADABLE_MESSAGE);
  }
  const exported = key.export({ type: "spki", format: "pem" });
  return typeof exported === "string" ? exported : exported.toString("utf8");
}

function readPem(pem: string): crypto.KeyObject {
  try {
    return crypto.createPublicKey(pem);
  } catch {
    return crypto.createPublicKey({ key: pem, format: "pem", type: "pkcs1" });
  }
}

/** Normalize a console paste into an SPKI PEM, or throw PublicKeyFormatError. */
export function publicKeyPemFromSecret(raw: string): string {
  const text = unwrapSecretText(raw);
  if (!text) {
    throw new PublicKeyFormatError(UNREADABLE_MESSAGE);
  }
  if (PRIVATE_PEM.test(text)) {
    throw new PublicKeyFormatError(PRIVATE_KEY_MESSAGE);
  }

  if (!text.includes("-----BEGIN")) {
    const body = text.replace(/\s+/g, "");
    if (!/^[A-Za-z0-9+/=]+$/.test(body)) {
      throw new PublicKeyFormatError(UNREADABLE_MESSAGE);
    }
    try {
      return asPublicRsa(readPem(wrapPem("PUBLIC KEY", body)));
    } catch (err) {
      if (err instanceof PublicKeyFormatError) throw err;
      try {
        return asPublicRsa(readPem(wrapPem("RSA PUBLIC KEY", body)));
      } catch (fallback) {
        if (fallback instanceof PublicKeyFormatError) throw fallback;
        throw new PublicKeyFormatError(UNREADABLE_MESSAGE);
      }
    }
  }

  try {
    return asPublicRsa(readPem(text));
  } catch (err) {
    if (err instanceof PublicKeyFormatError) throw err;
    throw new PublicKeyFormatError(UNREADABLE_MESSAGE);
  }
}

/** RSA-encrypt the Perfect Corp id_token plaintext. Does not log the key. */
export function encryptIdToken(clientId: string, secret: string, timestamp = Date.now()): string {
  const pem = publicKeyPemFromSecret(secret);
  const plaintext = `client_id=${clientId}&timestamp=${timestamp}`;
  try {
    const encrypted = crypto.publicEncrypt(
      {
        key: pem,
        padding: crypto.constants.RSA_PKCS1_PADDING,
      },
      Buffer.from(plaintext, "utf8"),
    );
    return encrypted.toString("base64");
  } catch {
    throw new PublicKeyFormatError(UNREADABLE_MESSAGE);
  }
}
