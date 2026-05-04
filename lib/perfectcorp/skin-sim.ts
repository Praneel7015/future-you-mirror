import "server-only";
import { createHash } from "node:crypto";
import { uploadFile, createTask, pollTask } from "./client";
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
  url?: string;
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
    throw new Error("At least one simulation parameter must be > 0");
  }

  // Download the aging photo to get stable bytes for cache key + upload
  const imageRes = await fetch(params.sourceUrl);
  if (!imageRes.ok) {
    throw new Error(`Failed to download source image (HTTP ${imageRes.status})`);
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
    ...clamped,
  });
  const results = await pollTask<SkinSimResults>("skin-simulation", taskId);

  // Perfect Corp sim response: try output[0].url first, then flat fields
  const url =
    results.output?.[0]?.url ??
    results.image_url ??
    results.output_url ??
    results.url;
  if (!url) throw new Error("Skin simulation returned no image URL");

  await cacheSet(key, url);
  return url;
}
