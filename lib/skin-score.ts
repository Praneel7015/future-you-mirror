import type { SdConcern } from "./perfectcorp/types";

type ConcernMap = Partial<Record<SdConcern, { ui: number }>>;

/**
 * The most-improvable concern — used as the "your one thing" keyword on
 * the share card. Lowest ui score. Higher ui means healthier.
 */
const CONCERN_WORD: Record<SdConcern, string> = {
  moisture: "hydration",
  wrinkle: "fine lines",
  firmness: "firmness",
  radiance: "radiance",
  texture: "texture",
  pore: "pores",
  oiliness: "oil balance",
  redness: "redness",
  acne: "clarity",
  age_spot: "sun damage",
  dark_circle_v2: "rest",
  eye_bag: "rest",
  droopy_upper_eyelid: "structure",
  droopy_lower_eyelid: "structure",
};

/** Plain average of the check scores. No habit sliders. */
export function meanConcernScore(concerns: ConcernMap): number | null {
  const values = Object.values(concerns)
    .map((item) => item?.ui)
    .filter((n): n is number => typeof n === "number" && Number.isFinite(n));
  if (values.length === 0) return null;
  const mean = values.reduce((sum, n) => sum + n, 0) / values.length;
  return Math.max(0, Math.min(100, mean));
}

/** Perfect Corp overall score, or the plain average when that field is missing. */
export function readingScore(skin: { overallScore: number | null; concerns: ConcernMap }): number {
  if (skin.overallScore != null && Number.isFinite(skin.overallScore)) {
    return Math.max(0, Math.min(100, skin.overallScore));
  }
  return meanConcernScore(skin.concerns) ?? 0;
}

/** Lowest ui score first. Higher ui means healthier. */
export function checksByScore(concerns: ConcernMap): { key: SdConcern; ui: number }[] {
  return (Object.keys(concerns) as SdConcern[])
    .filter((key) => typeof concerns[key]?.ui === "number")
    .map((key) => ({ key, ui: Math.round(concerns[key]!.ui) }))
    .sort((a, b) => a.ui - b.ui);
}

export function lowestConcernWord(concerns: ConcernMap): string {
  const lowest = checksByScore(concerns)[0];
  if (!lowest) return "balance";
  return CONCERN_WORD[lowest.key] ?? "balance";
}
