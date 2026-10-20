import "server-only";
import { runFullTask } from "./client";
import { cacheGet, cacheKey, cacheSet } from "../cache";
import {
  SD_CONCERNS,
  type SdConcern,
  type SkinAnalysisOutput,
  type SkinAnalysisRequest,
  type SkinResult,
} from "./types";
import type { ProcessedImage } from "../image-utils";
import { httpsUrls } from "../skin-masks";

const API_NAME = "skin-analysis";
const CACHE_SCOPE = "skin";

const CONCERN_SET: ReadonlySet<string> = new Set(SD_CONCERNS);

function shapeResult(raw: SkinAnalysisOutput): SkinResult {
  const concerns = {} as SkinResult["concerns"];
  for (const concern of SD_CONCERNS) {
    concerns[concern] = { raw: 0, ui: 0 };
  }
  let overallScore: number | null = null;
  let skinAge: number | null = null;
  let resizedImageUrl: string | null = null;

  for (const item of raw.output ?? []) {
    if (CONCERN_SET.has(item.type)) {
      const c = item as {
        type: SdConcern;
        raw_score: number;
        ui_score: number;
        mask_urls?: unknown;
      };
      const maskUrls = httpsUrls(c.mask_urls);
      concerns[c.type] = {
        raw: c.raw_score,
        ui: c.ui_score,
        ...(maskUrls.length > 0 ? { maskUrls } : {}),
      };
    } else if (item.type === "all") {
      const s = item as { score?: number };
      overallScore = s.score ?? null;
    } else if (item.type === "skin_age") {
      // Field name unconfirmed across versions — try score, then value, then age
      const s = item as { score?: number; value?: number; age?: number };
      skinAge = s.score ?? s.value ?? s.age ?? null;
    } else if (item.type === "resize_image") {
      const s = item as { url?: unknown };
      resizedImageUrl = httpsUrls([s.url])[0] ?? resizedImageUrl;
    }
  }

  return { concerns, overallScore, skinAge, resizedImageUrl };
}

export async function analyzeSkin(image: ProcessedImage): Promise<SkinResult> {
  const key = cacheKey(CACHE_SCOPE, image.hash);
  const cached = await cacheGet<SkinResult>(key);
  if (cached) return cached;

  const raw = await runFullTask<SkinAnalysisRequest, SkinAnalysisOutput>(
    API_NAME,
    image,
    (file_id) => ({
      src_file_id: file_id,
      dst_actions: [...SD_CONCERNS],
      format: "json",
      // Leave enable_mask_overlay unset. Docs default is false: raw PNG masks
      // in each output item's mask_urls, when the task includes them.
    }),
  );

  const result = shapeResult(raw);
  await cacheSet(key, result);
  return result;
}
