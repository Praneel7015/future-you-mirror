/**
 * Decide whether /api/simulate may call Perfect Corp.
 * Sample photos and ?demo=true always use a baked with-care picture.
 */

export function isSamplePhotoSource(sourceUrl: string): boolean {
  const raw = sourceUrl.trim();
  if (!raw) return false;
  try {
    const url = new URL(raw, "https://example.test");
    return url.pathname.includes("/sample-photos/");
  } catch {
    return raw.includes("/sample-photos/");
  }
}

/** Public path of the baked with-care twin, or null if this is not a sample age photo. */
export function bakedWithCareUrl(sourceUrl: string): string | null {
  const raw = sourceUrl.trim();
  if (!raw) return null;
  let pathname = raw;
  try {
    pathname = new URL(raw, "https://example.test").pathname;
  } catch {
    pathname = raw.split("?")[0] ?? raw;
  }
  const match = pathname.match(/\/age-(\d+)\.(?:jpe?g|png)$/i);
  if (!match) return null;
  return `/sample-photos/with-care/age-${match[1]}.jpg`;
}

export type SimulatePlan =
  | { action: "demo"; imageUrl: string }
  | { action: "live" }
  | { action: "error"; status: number; error: string; message: string };

export function planSimulate(input: { sourceUrl?: string; demo?: boolean }): SimulatePlan {
  const sourceUrl = typeof input.sourceUrl === "string" ? input.sourceUrl.trim() : "";
  if (!sourceUrl) {
    return { action: "error", status: 400, error: "source_required", message: "sourceUrl required" };
  }

  const sample = isSamplePhotoSource(sourceUrl);
  if (input.demo || sample) {
    const imageUrl = bakedWithCareUrl(sourceUrl);
    if (!imageUrl) {
      return {
        action: "error",
        status: 400,
        error: "demo_asset_missing",
        message: "This sample has no with-care photo. Perfect Corp was not called.",
      };
    }
    return { action: "demo", imageUrl };
  }

  return { action: "live" };
}

/** Youth-readable failure. Never sounds like the CSS filter succeeded. */
export function plainSimulateFailure(error?: string, message?: string): string {
  const code = error ?? "";
  const detail = (message ?? "").replace(/\s+/g, " ").trim().slice(0, 160);
  const left = "The left picture is only the aged photo, not a with-care simulation.";

  if (code === "invalid_public_key") {
    return `The server key is not the RSA public key from Perfect Corp. No with-care photo was made. ${left}`;
  }
  if (code === "missing_credentials" || /Missing Perfect Corp env/i.test(detail)) {
    return `The live with-care photo needs a Perfect Corp key on the server. None was made. ${left}`;
  }
  if (code === "auth_failed" || /auth failed/i.test(detail)) {
    return `Perfect Corp did not accept the server key. No with-care photo was made. ${left}`;
  }
  if (code === "source_download_failed" || code === "bad_source_url") {
    return `We could not open the photo to simulate. No with-care photo was made. ${left}`;
  }
  if (code === "demo_asset_missing") {
    return "The sample with-care photo is missing. Perfect Corp was not called.";
  }
  if (code === "CreditInsufficiency" || /insufficient unit|no credits/i.test(detail)) {
    return `Perfect Corp has no credits left for this photo. No with-care photo was made. ${left}`;
  }
  if (code === "error_no_face" || /no face/i.test(detail)) {
    return `Perfect Corp could not find a face in that photo. No with-care photo was made. ${left}`;
  }
  if (code === "InvalidParameters" || code === "invalid_parameter" || code === "BadRequest") {
    return `Perfect Corp rejected the simulation request. No with-care photo was made. ${left}`;
  }
  if (detail) {
    return `No with-care photo was made. ${left} (${detail})`;
  }
  return `No with-care photo was made. ${left}`;
}
