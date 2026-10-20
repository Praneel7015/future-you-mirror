/**
 * Sentences a young woman can read on her phone.
 * Never return task ids, error codes, or Perfect Corp's raw text.
 */

const CLOSER =
  "Move a little closer so your face fills more of the oval, then try again.";
const NO_FACE =
  "We couldn't see a face. Look at the phone, in soft light, and try again.";
const UNAVAILABLE =
  "This live reading isn't available right now. You can try the sample photo on the home page.";
const CREDITS =
  "This reading can't run right now. You can try the sample photo on the home page.";
const NETWORK = "The connection paused. Check your signal, then try again.";
const GENERIC = "We couldn't finish this reading. Try once more, with your face in the oval.";
const TOO_BIG = "That photo is too big to send. Try a smaller one.";
const BAD_FILE = "We couldn't open that photo. Try a JPG or PNG.";
const DEMO_NOTE = "This sample has no with-care photo. Perfect Corp was not called.";
const DEMO_FILE = "The sample with-care photo is missing on the server. Perfect Corp was not called.";

const KNOWN = new Set([
  CLOSER,
  NO_FACE,
  UNAVAILABLE,
  CREDITS,
  NETWORK,
  GENERIC,
  TOO_BIG,
  BAD_FILE,
  DEMO_NOTE,
  DEMO_FILE,
]);

export function plainMirrorError(input?: {
  code?: string | null;
  message?: string | null;
}): string {
  const code = (input?.code ?? "").trim();
  const raw = (input?.message ?? "").replace(/\s+/g, " ").trim();
  if (KNOWN.has(raw)) return raw;

  const blob = `${code} ${raw}`.toLowerCase();

  if (
    code === "image_too_small" ||
    /face is too small|too small/.test(blob) ||
    /more than 60%/.test(blob) ||
    /take up more/.test(blob)
  ) {
    return CLOSER;
  }
  if (code === "file_too_large" || /max 10mb|too large|file size/.test(blob)) {
    return TOO_BIG;
  }
  if (
    code === "unsupported_format" ||
    code === "invalid_image" ||
    /not supported|could not read image/.test(blob)
  ) {
    return BAD_FILE;
  }
  if (code === "error_no_face" || /no face|could not find a face/.test(blob)) {
    return NO_FACE;
  }
  if (
    code === "CreditInsufficiency" ||
    /creditinsufficiency|insufficient unit|no credits/.test(blob)
  ) {
    return CREDITS;
  }
  if (
    code === "invalid_public_key" ||
    code === "auth_failed" ||
    code === "missing_credentials" ||
    /decoder routines|missing perfect corp env|auth failed|not an rsa public key|begin private key/.test(
      blob,
    )
  ) {
    return UNAVAILABLE;
  }
  if (
    code === "task_timeout" ||
    /timeout|timed out|network|failed to fetch|econnreset|fetch failed/.test(blob)
  ) {
    return NETWORK;
  }
  return GENERIC;
}

/** What the split step may show. Never the raw Perfect Corp text. */
export function plainSimulateFailure(error?: string, message?: string): string {
  return plainMirrorError({ code: error, message });
}
