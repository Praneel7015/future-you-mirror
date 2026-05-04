import "server-only";
import { runFullTask } from "./client";
import { cacheGet, cacheKey, cacheSet } from "../cache";
import type {
  AgingOutput,
  AgingPhoto,
  AgingRequest,
  AgingResult,
} from "./types";
import type { ProcessedImage } from "../image-utils";

const API_NAME = "aging";
const CACHE_SCOPE = "aging";

function shapeResult(raw: AgingOutput): AgingResult {
  const photos: AgingPhoto[] = (raw.output ?? [])
    .filter((p): p is AgingPhoto => typeof p?.url === "string" && typeof p?.res_age === "number")
    .sort((a, b) => a.res_age - b.res_age);

  const ages = photos.map((p) => p.res_age);
  const ageMin = raw.age_min ?? (ages[0] ?? 0);
  const ageMax = raw.age_max ?? (ages[ages.length - 1] ?? 0);

  return {
    photos,
    currentAge: raw.age ?? null,
    ageMin,
    ageMax,
  };
}

export async function generateAging(image: ProcessedImage): Promise<AgingResult> {
  const key = cacheKey(CACHE_SCOPE, image.hash);
  const cached = await cacheGet<AgingResult>(key);
  if (cached) return cached;

  const raw = await runFullTask<AgingRequest, AgingOutput>(
    API_NAME,
    image,
    (file_id) => ({ src_file_id: file_id }),
  );

  const result = shapeResult(raw);
  await cacheSet(key, result);
  return result;
}
