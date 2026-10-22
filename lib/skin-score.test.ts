import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { checksByScore, readingScore } from "./skin-score.ts";

describe("reading score", () => {
  const concerns = {
    eye_bag: { ui: 58 },
    oiliness: { ui: 66 },
    acne: { ui: 99 },
  };

  it("uses the overall score from the reading", () => {
    assert.equal(readingScore({ overallScore: 75.3, concerns }), 75.3);
  });

  it("averages the checks when overall is missing", () => {
    const score = readingScore({ overallScore: null, concerns });
    assert.equal(Math.round(score), 74);
  });

  it("ranks the lowest check first", () => {
    assert.deepEqual(
      checksByScore(concerns).map((item) => item.key),
      ["eye_bag", "oiliness", "acne"],
    );
  });
});
