import assert from "node:assert/strict";
import { generateKeyPairSync, privateDecrypt, constants } from "node:crypto";
import { describe, it } from "node:test";
import { encryptIdToken, publicKeyPemFromSecret, PublicKeyFormatError } from "./public-key.ts";

const { publicKey, privateKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
const spki = publicKey.export({ type: "spki", format: "pem" }).toString();
const pkcs1Public = publicKey.export({ type: "pkcs1", format: "pem" }).toString();
const pkcs8Private = privateKey.export({ type: "pkcs8", format: "pem" }).toString();
const pkcs1Private = privateKey.export({ type: "pkcs1", format: "pem" }).toString();

function decrypt(token: string): string {
  return privateDecrypt(
    { key: privateKey, padding: constants.RSA_PKCS1_PADDING },
    Buffer.from(token, "base64"),
  ).toString("utf8");
}

describe("Perfect Corp public key paste", () => {
  it("strips wrapping quotes and literal newlines before encrypting", () => {
    const quoted = `"${spki.trim().replace(/\n/g, "\\n")}"`;
    const pem = publicKeyPemFromSecret(quoted);
    assert.match(pem, /BEGIN PUBLIC KEY/);
    assert.doesNotMatch(pem, /PRIVATE KEY/);
    assert.equal(encryptIdToken("mirror-client", quoted, 1710000000000) && true, true);
    assert.equal(
      decrypt(encryptIdToken("mirror-client", quoted, 1710000000000)),
      "client_id=mirror-client&timestamp=1710000000000",
    );
  });

  it("accepts an RSA PUBLIC KEY header and a raw SPKI body", () => {
    const fromHeader = publicKeyPemFromSecret(pkcs1Public);
    const body = spki
      .replace("-----BEGIN PUBLIC KEY-----", "")
      .replace("-----END PUBLIC KEY-----", "")
      .replace(/\s+/g, "");
    const fromRaw = publicKeyPemFromSecret(body);
    assert.equal(fromHeader.replace(/\s+/g, ""), fromRaw.replace(/\s+/g, ""));
    assert.equal(
      decrypt(encryptIdToken("mirror-client", pkcs1Public, 42)),
      "client_id=mirror-client&timestamp=42",
    );
  });

  it("rejects a private key and does not echo the key", () => {
    for (const secret of [pkcs8Private, pkcs1Private, `'${pkcs8Private.replace(/\n/g, "\\n")}'`]) {
      assert.throws(
        () => publicKeyPemFromSecret(secret),
        (err: unknown) => {
          assert.ok(err instanceof PublicKeyFormatError);
          assert.match(
            err.message,
            /Paste the RSA public key from Perfect Corp, not the private key or a client secret string/,
          );
          const line = secret.split("\n").find((row) => /^[A-Za-z0-9+/=]{20,}$/.test(row));
          if (line) assert.equal(err.message.includes(line), false);
          return true;
        },
      );
    }
  });
});
