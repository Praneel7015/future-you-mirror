import "server-only";
import { createHash } from "node:crypto";
import { PerfectCorpError, uploadFile, createTask, pollTask } from "./client";
import { cacheGet, cacheSet, cacheKey } from "../cache";
import type { ProcessedImage } from "../image-utils";

export interface SkinSimParams {
  sourceUrl: string;
  radiance: number;
  wrinkles: number;
  spots: number;
  eye_bags: number;
  dark_circles: number;
  pores: number;
  texture: number;
  redness: number;
  oiliness: number;
  acne: number;
}

interface SkinSimResults {
  output?: Array<{ url?: string }>;
  image_url?: string;
  output_url?: string;
  download_url?: string;
  url?: string;
}

/**
 * Live task body uses the documented names.
 * `wrinkle` and `dark_circle` are singular. The old plural keys are rejected.
 */
function toApiParams(clamped: Omit<SkinSimParams, "sourceUrl">) {
  return {
    radiance: clamped.radiance,
    wrinkle: clamped.wrinkles,
    spots: clamped.spots,
    eye_bags: clamped.eye_bags,
    dark_circle: clamped.dark_circles,
    pores: clamped.pores,
    texture: clamped.texture,
    redness: clamped.redness,
    oiliness: clamped.oiliness,
    acne: clamped.acne,
  };
}

function firstImageUrl(results: SkinSimResults): string | null {
  const direct = [results.url, results.image_url, results.output_url, results.download_url];
  for (const candidate of direct) {
    if (typeof candidate === "string" && candidate.startsWith("http")) return candidate;
  }
  for (const item of results.output ?? []) {
    if (typeof item?.url === "string" && item.url.startsWith("http")) return item.url;
  }
  return null;
}

function clamp01(v: number): number {
  return Math.max(0, Math.min(1, Math.round(v * 100) / 100));
}

export async function simulateSkin(params: SkinSimParams): Promise<string> {
  const clamped = {
    radiance: clamp01(params.radiance),
    wrinkles: clamp01(params.wrinkles),
    spots: clamp01(params.spots),
    eye_bags: clamp01(params.eye_bags),
    dark_circles: clamp01(params.dark_circles),
    pores: clamp01(params.pores),
    texture: clamp01(params.texture),
    redness: clamp01(params.redness),
    oiliness: clamp01(params.oiliness),
    acne: clamp01(params.acne),
  };

  // API requires at least one param > 0
  if (!Object.values(clamped).some((v) => v > 0)) {
    throw new PerfectCorpError(
      "invalid_params",
      "At least one simulation parameter must be greater than 0.",
    );
  }

  if (!/^https?:\/\//i.test(params.sourceUrl)) {
    throw new PerfectCorpError(
      "bad_source_url",
      "Simulation source must be an absolute http(s) URL. Relative paths are only for sample photos.",
    );
  }

  // Download the aging photo to get stable bytes for cache key + upload
  let imageRes: Response;
  try {
    imageRes = await fetch(params.sourceUrl);
  } catch (err) {
    const reason = err instanceof Error ? err.message : "network error";
    throw new PerfectCorpError(
      "source_download_failed",
      `Failed to download source image (${reason}).`,
    );
  }
  if (!imageRes.ok) {
    throw new PerfectCorpError(
      "source_download_failed",
      `Failed to download source image (HTTP ${imageRes.status}).`,
      imageRes.status,
    );
  }
  const bytes = Buffer.from(await imageRes.arrayBuffer());
  const imageHash = createHash("sha256").update(bytes).digest("hex");

  // Cache key = sim scope + (image hash | sorted param fingerprint)
  const paramFingerprint = Object.entries(clamped)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}:${v}`)
    .join(",");
  const paramHash = createHash("sha256").update(paramFingerprint).digest("hex").slice(0, 16);
  const key = cacheKey("sim", `${imageHash}_${paramHash}`);

  const cached = await cacheGet<string>(key);
  if (cached) return cached;

  // Build a ProcessedImage from the downloaded bytes for uploadFile
  const image: ProcessedImage = {
    bytes,
    hash: imageHash,
    width: 0,
    height: 0,
    contentType: "image/jpeg",
  };

  // Upload → create task (src_file_id) → poll
  const fileId = await uploadFile("skin-simulation", image);
  const taskId = await createTask("skin-simulation", {
    src_file_id: fileId,
    ...toApiParams(clamped),
  });
  const results = await pollTask<SkinSimResults>("skin-simulation", taskId);

  const url = firstImageUrl(results);
  if (!url) {
    throw new PerfectCorpError(
      "no_image_url",
      "Skin simulation finished but returned no image URL.",
    );
  }

  await cacheSet(key, url);
  return url;
}
