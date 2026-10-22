export const STATED_AGE_MIN = 15;
export const STATED_AGE_MAX = 70;
export const YEARS_AHEAD = 30;
/** How many years earlier the with-care side sits on the same timeline. */
export const CARE_YEARS_EARLIER = 12;

/** Future portrait target from a typed age. Does not call Perfect Corp. */
export function futurePortrait(statedAge: number, ageMin: number, ageMax: number) {
  const desired = statedAge + YEARS_AHEAD;
  const future = Math.min(ageMax, Math.max(ageMin, desired));
  const limited = future < desired;
  return {
    future,
    limited,
    sentence: limited ? `The furthest picture we can show is ${Math.round(future)}.` : null,
  };
}

/** Age to show on the with-care side. Stays on the timeline; does not invent a face. */
export function earlierTimelineAge(age: number, ageMin: number, years = CARE_YEARS_EARLIER) {
  return Math.max(ageMin, age - years);
}
