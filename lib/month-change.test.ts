import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { MONTH_CHOICES, simIntensitiesFor, type SimIntensities } from "./month-change.ts";

function peak(params: SimIntensities): string {
  return Object.entries(params).sort((a, b) => b[1] - a[1])[0][0];
}

describe("one change this month", () => {
  it("offers three plain choices", () => {
    assert.deepEqual(
      MONTH_CHOICES.map((choice) => choice.label),
      ["SPF most mornings", "A gentle cleanser", "Fewer sugary drinks"],
    );
  });

  it("points each choice at a different simulation intensity", () => {
    const spf = simIntensitiesFor("spf");
    const cleanser = simIntensitiesFor("cleanser");
    const sugar = simIntensitiesFor("sugar");
    assert.equal(peak(spf), "spots");
    assert.equal(peak(cleanser), "pores");
    assert.equal(peak(sugar), "acne");
    for (const params of [spf, cleanser, sugar]) {
      assert.ok(Object.values(params).some((value) => value > 0));
      assert.ok(Object.values(params).every((value) => value >= 0 && value <= 1));
    }
    assert.notDeepEqual(spf, cleanser);
    assert.notDeepEqual(cleanser, sugar);
  });
});
