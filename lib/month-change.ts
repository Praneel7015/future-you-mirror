/** The one habit the mirror asks about on the split step. */
export type MonthChangeId = "spf" | "cleanser" | "sugar";

/** Intensities posted to `/api/simulate`. Names match the existing client body. */
export type SimIntensities = {
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
};

export const MONTH_CHOICES: { id: MonthChangeId; label: string }[] = [
  { id: "spf", label: "SPF most mornings" },
  { id: "cleanser", label: "A gentle cleanser" },
  { id: "sugar", label: "Fewer sugary drinks" },
];

const QUIET: SimIntensities = {
  radiance: 0.2,
  wrinkles: 0.2,
  spots: 0.2,
  eye_bags: 0.1,
  dark_circles: 0.1,
  pores: 0.2,
  texture: 0.2,
  redness: 0.2,
  oiliness: 0.2,
  acne: 0.2,
};

/**
 * Each choice turns up the simulation intensities that match it.
 * Demo mode ignores these and keeps the baked with-care photo.
 */
export function simIntensitiesFor(id: MonthChangeId): SimIntensities {
  if (id === "spf") {
    return { ...QUIET, spots: 0.9, wrinkles: 0.75, redness: 0.55, radiance: 0.45 };
  }
  if (id === "cleanser") {
    return { ...QUIET, pores: 0.85, texture: 0.7, acne: 0.6, oiliness: 0.55 };
  }
  return { ...QUIET, acne: 0.8, oiliness: 0.5, redness: 0.45 };
}
