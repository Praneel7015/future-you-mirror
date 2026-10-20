import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { NOT_MEDICAL_ADVICE } from "./copy.ts";
import {
  DIET_INTRO,
  DIET_INTRO_CITATIONS,
  DIET_NOTES,
  RECOMMENDATIONS,
  dietContext,
  dietScoreSentence,
} from "./recommendations.ts";

const CONCERNS = [
  "wrinkle",
  "droopy_upper_eyelid",
  "droopy_lower_eyelid",
  "firmness",
  "acne",
  "moisture",
  "eye_bag",
  "dark_circle_v2",
  "age_spot",
  "radiance",
  "redness",
  "oiliness",
  "pore",
  "texture",
] as const;

const ALLOWED_HOSTS = new Set([
  "www.aad.org",
  "www.niams.nih.gov",
  "www.neutrogena.com",
  "differin.com",
]);

function assertCitation(href: string) {
  const url = new URL(href);
  assert.equal(url.protocol, "https:");
  assert.ok(ALLOWED_HOSTS.has(url.hostname), href);
}

describe("recommendations", () => {
  it("covers every skin concern with a real citation", () => {
    for (const key of CONCERNS) {
      const rec = RECOMMENDATIONS[key];
      assert.ok(rec, key);
      assert.ok(rec.action.length > 20, key);
      assert.ok(rec.citations.length > 0, key);
      for (const cite of rec.citations) assertCitation(cite.href);
      if (rec.example) {
        assert.match(rec.example.note, /not an endorsement/i);
        assert.match(rec.example.note, /not a checkout/i);
        assertCitation(rec.example.href);
      }
    }
  });

  it("keeps food notes educational and cited", () => {
    assert.match(DIET_INTRO, /not your fault/i);
    assert.match(DIET_INTRO, /not a diet/i);
    assert.doesNotMatch(DIET_INTRO, /you should cut|detox|clean eating|guilty/i);
    for (const cite of DIET_INTRO_CITATIONS) assertCitation(cite.href);
    assert.ok(DIET_NOTES.length >= 3);
    for (const note of DIET_NOTES) {
      assert.ok(note.citations.length > 0, note.id);
      assert.doesNotMatch(note.body, /you should cut|detox|guilty|lose weight/i);
      for (const cite of note.citations) assertCitation(cite.href);
    }
  });

  it("shows food notes only when acne or redness is in the reading", () => {
    assert.equal(dietContext({}).visible, false);
    assert.equal(dietContext({ moisture: { ui: 40 } }).visible, false);
    const shown = dietContext({ acne: { ui: 99.2 }, redness: { ui: 97.4 } });
    assert.equal(shown.visible, true);
    assert.equal(shown.acne, 99);
    assert.match(dietScoreSentence(shown.acne, shown.redness), /acne 99/);
    assert.match(dietScoreSentence(shown.acne, shown.redness), /higher means healthier/i);
  });

  it("keeps the medical disclaimer stable", () => {
    assert.match(NOT_MEDICAL_ADVICE, /not medical advice/i);
    assert.match(NOT_MEDICAL_ADVICE, /not a dermatologist/i);
    assert.match(NOT_MEDICAL_ADVICE, /not a substitute/i);
  });
});
