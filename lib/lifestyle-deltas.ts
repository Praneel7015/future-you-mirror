import type { SdConcern } from "./perfectcorp/types";

/**
 * Maps each lifestyle slider (0 = worst habit, 100 = best habit) to concern
 * score deltas on the 0–100 UI scale.
 *
 * Positive delta  = concern gets worse (more visible problem).
 * Negative delta  = concern improves.
 *
 * at0   = delta applied when slider is at 0  (worst — e.g., never uses SPF)
 * at100 = delta applied when slider is at 100 (best — e.g., SPF every day)
 *
 * Values between 0 and 100 are linearly interpolated.
 */
type SliderDeltaConfig = {
  at0: Partial<Record<SdConcern, number>>;
  at100: Partial<Record<SdConcern, number>>;
};

export const LIFESTYLE_DELTAS: Record<
  "sun" | "hyd" | "sleep" | "routine",
  SliderDeltaConfig
> = {
  // "Sun protection" — high = wearing SPF, staying in shade
  sun: {
    at0:   { age_spot: +38, wrinkle: +22, firmness: +20, radiance: +18, redness: +16 },
    at100: { age_spot: -12, wrinkle:  -6, firmness:  -8, radiance:  -8, redness:  -6 },
  },
  // "Hydration" — high = drinking enough water, rich moisturiser
  hyd: {
    at0:   { moisture: +32, texture: +22, radiance: +20 },
    at100: { moisture: -14, texture:  -8, radiance: -10 },
  },
  // "Sleep quality" — high = 7–9 hrs, consistent schedule
  sleep: {
    at0:   { dark_circle_v2: +34, eye_bag: +28, radiance: +16 },
    at100: { dark_circle_v2: -12, eye_bag: -10, radiance:  -8 },
  },
  // "Skincare routine" — high = consistent AM/PM routine
  routine: {
    at0:   { wrinkle: +26, moisture: +20, radiance: +22, texture: +22, pore: +16 },
    at100: { wrinkle: -10, moisture:  -8, radiance: -10, texture: -10, pore:  -6 },
  },
};

type SliderState = { sun: number; hyd: number; sleep: number; routine: number };

/**
 * Compute the net per-concern delta for a given slider state.
 * Returns a map of SdConcern → delta (positive = worse, negative = better).
 */
export function computeLifestyleDeltas(
  sliders: SliderState,
): Partial<Record<SdConcern, number>> {
  const result: Partial<Record<SdConcern, number>> = {};

  for (const [key, cfg] of Object.entries(LIFESTYLE_DELTAS) as [keyof SliderState, SliderDeltaConfig][]) {
    const t = sliders[key] / 100; // 0 = worst, 1 = best
    const allConcerns = new Set([
      ...Object.keys(cfg.at0),
      ...Object.keys(cfg.at100),
    ]) as Set<SdConcern>;

    for (const concern of allConcerns) {
      const d0 = cfg.at0[concern] ?? 0;
      const d100 = cfg.at100[concern] ?? 0;
      result[concern] = (result[concern] ?? 0) + d0 + (d100 - d0) * t;
    }
  }

  return result;
}

/**
 * Apply lifestyle deltas to raw skin-analysis UI scores.
 * Returns adjusted scores (clamped 0–100) for each concern.
 */
export function applyLifestyleDeltas(
  baseScores: Partial<Record<SdConcern, { raw: number; ui: number }>>,
  sliders: SliderState,
): Record<SdConcern, number> {
  const deltas = computeLifestyleDeltas(sliders);
  const result = {} as Record<SdConcern, number>;

  for (const [concern, scores] of Object.entries(baseScores)) {
    const c = concern as SdConcern;
    const base = scores?.ui ?? 50;
    const delta = deltas[c] ?? 0;
    result[c] = Math.max(0, Math.min(100, base + delta));
  }

  return result;
}

/**
 * Derive per-concern visual overlay intensities for the WITHOUT side from
 * adjusted scores. Returns values in [0, 1] suitable for CSS/canvas use.
 */
export function withoutOverlayIntensities(adjusted: Record<SdConcern, number>) {
  const n = (key: SdConcern) => (adjusted[key] ?? 50) / 100;

  return {
    // age_spot drives the spot-texture overlay
    spots: n("age_spot"),
    // dark circles + eye_bag share an under-eye shadow
    underEye: (n("dark_circle_v2") + n("eye_bag")) / 2,
    // wrinkle + texture drive contrast/texture filter
    texture: (n("wrinkle") + n("texture")) / 2,
    // radiance + moisture drive brightness/saturation
    dullness: (n("radiance") + n("moisture")) / 2,
    // redness adds a warm overlay
    redness: n("redness"),
  };
}
