import type { SdConcern } from "@/lib/perfectcorp/types";

/**
 * Concern → ingredient → example product type.
 * Every treatment or food sentence is tied to a page we opened.
 * Named products are examples, not endorsements or a shop.
 */

export type Citation = {
  label: string;
  href: string;
};

export type ExampleProduct = {
  name: string;
  productType: string;
  href: string;
  note: string;
};

export type ConcernRecommendation = {
  concern: SdConcern;
  ingredient: string;
  productType: string;
  finding: (score: number) => string;
  action: string;
  example: ExampleProduct | null;
  citations: Citation[];
};

export type DietNote = {
  id: string;
  title: string;
  body: string;
  citations: Citation[];
};

const AAD_TREAT: Citation = {
  label: "AAD — acne treatment",
  href: "https://www.aad.org/public/diseases/acne/derm-treat/treat",
};

const AAD_TIPS: Citation = {
  label: "AAD — acne skin-care habits",
  href: "https://www.aad.org/public/diseases/acne/skin-care/tips",
};

const AAD_DIET: Citation = {
  label: "AAD — diet and acne",
  href: "https://www.aad.org/public/diseases/acne/causes/diet",
};

const AAD_SUN: Citation = {
  label: "AAD — sunscreen",
  href: "https://www.aad.org/public/everyday-care/sun-protection/shade-clothing-sunscreen/sunscreen-faqs",
};

const AAD_AGE: Citation = {
  label: "AAD — premature skin aging",
  href: "https://www.aad.org/public/everyday-care/skin-care-secrets/anti-aging/reduce-premature-aging-skin",
};

const NIAMS_ACNE: Citation = {
  label: "NIH / NIAMS — acne",
  href: "https://www.niams.nih.gov/health-topics/acne",
};

const EXAMPLE_NOTE = "Example only. Not an endorsement, not an ad, and not a checkout.";

const ADAPALENE_GEL: ExampleProduct = {
  name: "Differin Gel",
  productType: "Adapalene gel (0.1% retinoid)",
  href: "https://differin.com/shop/differin-gel/3029949.html",
  note: EXAMPLE_NOTE,
};

function scoreLine(label: string, score: number): string {
  return `${label} score is ${score}. Higher means healthier on this reading.`;
}

export const RECOMMENDATIONS: Record<SdConcern, ConcernRecommendation> = {
  acne: {
    concern: "acne",
    ingredient: "Salicylic acid",
    productType: "Salicylic-acid cleanser",
    finding: (score) => scoreLine("Acne", score),
    action:
      "A salicylic-acid cleanser can help open clogged pores. It is used for whiteheads and pimples. A dermatologist can help you choose what to use.",
    example: null,
    citations: [AAD_TREAT, NIAMS_ACNE],
  },
  pore: {
    concern: "pore",
    ingredient: "Salicylic acid",
    productType: "Salicylic-acid cleanser",
    finding: (score) => scoreLine("Pore", score),
    action:
      "Salicylic acid is used to open clogged pores. It does not promise smaller pores. Wash gently. Don't scrub.",
    example: null,
    citations: [AAD_TREAT, AAD_TIPS],
  },
  texture: {
    concern: "texture",
    ingredient: "Adapalene, if a dermatologist ties this to acne",
    productType: "Adapalene gel",
    finding: (score) => scoreLine("Texture", score),
    action:
      "Don't scrub. Scrubbing can irritate skin. If the roughness is acne, a retinoid such as adapalene can help blackheads and whiteheads. It can also irritate, so follow the label and wear sunscreen.",
    example: ADAPALENE_GEL,
    citations: [AAD_TIPS, AAD_TREAT],
  },
  oiliness: {
    concern: "oiliness",
    ingredient: "A gentle cleanser",
    productType: "Gentle face wash",
    finding: (score) => scoreLine("Oil", score),
    action:
      "Wash gently, up to twice a day, and after you sweat. Don't scrub. A gel sunscreen often feels better on oily skin.",
    example: null,
    citations: [AAD_TIPS, AAD_SUN],
  },
  redness: {
    concern: "redness",
    ingredient: "A gentle cleanser",
    productType: "Gentle, non-scrub face wash",
    finding: (score) => scoreLine("Redness", score),
    action:
      "Redness has many causes. Wash gently and stop anything that stings. This mirror cannot tell irritation from acne or rosacea. A dermatologist can.",
    example: null,
    citations: [AAD_TIPS, AAD_AGE],
  },
  moisture: {
    concern: "moisture",
    ingredient: "Moisturizer",
    productType: "Facial moisturizer",
    finding: (score) => scoreLine("Moisture", score),
    action:
      "Use a facial moisturizer every day. It helps trap water in the skin. If skin stays very dry or sore, see a dermatologist.",
    example: null,
    citations: [AAD_AGE],
  },
  radiance: {
    concern: "radiance",
    ingredient: "Moisturizer and sunscreen",
    productType: "Facial moisturizer, plus SPF 30 sunscreen",
    finding: (score) => scoreLine("Radiance", score),
    action:
      "A daily moisturizer helps skin hold water. Sunscreen helps prevent a sun-worn look. Stop products that sting.",
    example: null,
    citations: [AAD_AGE, AAD_SUN],
  },
  wrinkle: {
    concern: "wrinkle",
    ingredient: "Sunscreen",
    productType: "Broad-spectrum SPF 30 sunscreen",
    finding: (score) => scoreLine("Fine-line", score),
    action:
      "Daily broad-spectrum SPF 30 sunscreen helps prevent wrinkles caused by the sun. Lines also come with time. We are not suggesting an anti-wrinkle cream. A dermatologist can talk it through if lines bother you.",
    example: null,
    citations: [AAD_SUN, AAD_AGE],
  },
  firmness: {
    concern: "firmness",
    ingredient: "Sunscreen",
    productType: "Broad-spectrum SPF 30 sunscreen",
    finding: (score) => scoreLine("Firmness", score),
    action:
      "Skin naturally gets thinner and less full over time. Daily SPF 30 sunscreen helps slow extra aging from the sun. A dermatologist can talk about firmness if it bothers you.",
    example: null,
    citations: [AAD_AGE, AAD_SUN],
  },
  age_spot: {
    concern: "age_spot",
    ingredient: "Sunscreen",
    productType: "Broad-spectrum SPF 30 sunscreen",
    finding: (score) => scoreLine("Spot", score),
    action:
      "Sunscreen helps prevent age spots from the sun. Use broad-spectrum SPF 30 or higher on days you go outside. It does not remove spots you already have.",
    example: null,
    citations: [AAD_SUN],
  },
  dark_circle_v2: {
    concern: "dark_circle_v2",
    ingredient: "None from us",
    productType: "No product from this mirror",
    finding: (score) => scoreLine("Under-eye", score),
    action:
      "Under-eye darkness has more than one cause. We will not guess a cream. If it bothers you, a dermatologist can look.",
    example: null,
    citations: [AAD_AGE],
  },
  eye_bag: {
    concern: "eye_bag",
    ingredient: "None from us",
    productType: "No product from this mirror",
    finding: (score) => scoreLine("Under-eye", score),
    action:
      "Puffiness under the eyes has more than one cause. We will not guess a cream. If it bothers you, a dermatologist can look.",
    example: null,
    citations: [AAD_AGE],
  },
  droopy_upper_eyelid: {
    concern: "droopy_upper_eyelid",
    ingredient: "None from us",
    productType: "No product from this mirror",
    finding: (score) => scoreLine("Upper-lid", score),
    action:
      "Eyelid shape is not something a cream from this mirror can change. If it bothers you, a dermatologist or eye doctor can talk it through.",
    example: null,
    citations: [AAD_AGE],
  },
  droopy_lower_eyelid: {
    concern: "droopy_lower_eyelid",
    ingredient: "None from us",
    productType: "No product from this mirror",
    finding: (score) => scoreLine("Lower-lid", score),
    action:
      "Eyelid shape is not something a cream from this mirror can change. If it bothers you, a dermatologist or eye doctor can talk it through.",
    example: null,
    citations: [AAD_AGE],
  },
};

export const DIET_NOTES: DietNote[] = [
  {
    id: "blood-sugar",
    title: "Foods that raise blood sugar fast",
    body: "Some small studies found fewer pimples when people ate fewer foods that raise blood sugar fast, like white bread, sugary drinks, and fries. Vegetables, beans, and some fruit raise it more slowly. Other studies did not find a link. This is not a meal plan.",
    citations: [AAD_DIET],
  },
  {
    id: "milk",
    title: "A note about cow's milk",
    body: "Some studies link cow's milk, including skim milk, with more acne. Yogurt and cheese were not shown to do that. You do not have to give up dairy. Talk with a doctor before a big food change.",
    citations: [AAD_DIET],
  },
  {
    id: "inflammation",
    title: "Inflammation, in plain words",
    body: "A jump in blood sugar can bring inflammation and more skin oil, and both can play a part in acne. Eating fewer fast-spike foods is the pattern described. It is not a clean-eating rule, and it does not replace skin care.",
    citations: [AAD_DIET, NIAMS_ACNE],
  },
];

export const DIET_INTRO =
  "Acne is an inflammatory skin condition. These food notes are only for breakouts and redness. They are not a diet to start, and acne is not your fault.";

export const DIET_INTRO_CITATIONS: Citation[] = [NIAMS_ACNE, AAD_DIET];

const DIET_KEYS = ["acne", "redness"] as const;

export function dietContext(
  concerns: Partial<Record<SdConcern, { ui?: number }>>,
): { visible: boolean; acne: number | null; redness: number | null } {
  const acne = typeof concerns.acne?.ui === "number" ? Math.round(concerns.acne.ui) : null;
  const redness = typeof concerns.redness?.ui === "number" ? Math.round(concerns.redness.ui) : null;
  return {
    visible: DIET_KEYS.some((key) => typeof concerns[key]?.ui === "number"),
    acne,
    redness,
  };
}

export const CONCERN_NAME: Record<SdConcern, string> = {
  wrinkle: "Fine lines",
  droopy_upper_eyelid: "Upper lid",
  droopy_lower_eyelid: "Lower lid",
  firmness: "Firmness",
  acne: "Breakouts",
  moisture: "Dryness",
  eye_bag: "Under-eye",
  dark_circle_v2: "Dark circles",
  age_spot: "Spots",
  radiance: "Dullness",
  redness: "Redness",
  oiliness: "Oil",
  pore: "Pores",
  texture: "Texture",
};

const FOOD_SCOPE =
  "Food notes on this mirror are only for breakouts and redness. This concern is not one of those. This is not a diet, and acne is not your fault.";

/** One food note for the concern card. Wording comes from notes we already cite. */
export function foodNoteFor(concern: SdConcern): { body: string; citations: Citation[] } {
  if (concern === "acne") {
    const note = DIET_NOTES.find((item) => item.id === "blood-sugar");
    return { body: note?.body ?? FOOD_SCOPE, citations: note?.citations ?? DIET_INTRO_CITATIONS };
  }
  if (concern === "oiliness") {
    const note = DIET_NOTES.find((item) => item.id === "inflammation");
    return { body: note?.body ?? FOOD_SCOPE, citations: note?.citations ?? DIET_INTRO_CITATIONS };
  }
  if (concern === "redness") {
    return { body: DIET_INTRO, citations: DIET_INTRO_CITATIONS };
  }
  return { body: FOOD_SCOPE, citations: DIET_INTRO_CITATIONS };
}

/** Everyday food, cited from the acne-diet note. Not a treatment for the photo. */
export function everydayPlate(): { title: string; body: string; citations: Citation[] } {
  return {
    title: "On the plate",
    body: "Vegetables, beans, and some fruit raise blood sugar more slowly than sugary drinks. Carrots are one of those vegetables. This is everyday food, not a treatment, and not a meal plan.",
    citations: [AAD_DIET],
  };
}

export type MonthSuggestion = {
  title: string;
  body: string;
  productType: string | null;
  citations: Citation[];
};

/** The split-step choice, using recommendation and diet copy we already cite. */
export function monthSuggestion(id: "spf" | "cleanser" | "sugar"): MonthSuggestion {
  if (id === "spf") {
    const rec = RECOMMENDATIONS.age_spot;
    return {
      title: "SPF most mornings",
      body: rec.action,
      productType: rec.productType,
      citations: rec.citations,
    };
  }
  if (id === "cleanser") {
    const rec = RECOMMENDATIONS.oiliness;
    return {
      title: "A gentle cleanser",
      body: rec.action,
      productType: rec.productType,
      citations: rec.citations,
    };
  }
  const note = DIET_NOTES.find((item) => item.id === "blood-sugar");
  return {
    title: "Fewer sugary drinks",
    body: note?.body ?? "",
    productType: null,
    citations: note?.citations ?? [],
  };
}

export function dietScoreSentence(acne: number | null, redness: number | null): string {
  const parts: string[] = [];
  if (acne !== null) parts.push(`acne ${acne}`);
  if (redness !== null) parts.push(`redness ${redness}`);
  if (parts.length === 0) return "";
  return `On this reading, ${parts.join(" and ")}. Higher means healthier. Read this only if breakouts or redness are on your mind.`;
}
