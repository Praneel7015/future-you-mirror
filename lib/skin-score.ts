import type { SdConcern } from "./perfectcorp/types";
import { applyLifestyleDeltas } from "./lifestyle-deltas";

type SliderState = { sun: number; hyd: number; sleep: number; routine: number };

/**
 * Composite "skin score" 0–100. Higher = better.
 *
 * Perfect Corp's `ui_score` for each concern is already 0–100 with higher
 * meaning healthier (e.g. higher moisture score = more hydrated). We average
 * across the 14 concerns after applying lifestyle deltas, so the displayed
 * number reflects the user's actual habits.
 */
export function compositeSkinScore(
  concerns: Partial<Record<SdConcern, { raw: number; ui: number }>>,
  sliders: SliderState,
): number {
  const adjusted = applyLifestyleDeltas(concerns, sliders);
  const values = Object.values(adjusted);
  if (values.length === 0) return 50;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  return Math.max(0, Math.min(100, mean));
}

/**
 * The most-improvable concern — used as the "your one thing" keyword on
 * the share card and as the climate-card anchor. Returns a friendly word.
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

export function topConcernWord(
  concerns: Partial<Record<SdConcern, { raw: number; ui: number }>>,
  sliders: SliderState,
): string {
  const adjusted = applyLifestyleDeltas(concerns, sliders);
  const entries = Object.entries(adjusted) as [SdConcern, number][];
  if (entries.length === 0) return "balance";
  entries.sort((a, b) => a[1] - b[1]);
  const [worstKey] = entries[0];
  return CONCERN_WORD[worstKey] ?? "balance";
}
