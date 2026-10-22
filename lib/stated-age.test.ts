import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { earlierTimelineAge, futurePortrait } from "./stated-age.ts";

describe("stated age", () => {
  it("adds thirty years when the photos reach that far", () => {
    const portrait = futurePortrait(21, 12, 70);
    assert.equal(portrait.future, 51);
    assert.equal(portrait.limited, false);
    assert.equal(portrait.sentence, null);
  });

  it("stops at the last photo and says so", () => {
    const portrait = futurePortrait(50, 12, 70);
    assert.equal(portrait.future, 70);
    assert.equal(portrait.limited, true);
    assert.equal(portrait.sentence, "The furthest picture we can show is 70.");
  });

  it("puts with-care twelve years earlier, and not before the first photo", () => {
    assert.equal(earlierTimelineAge(56, 12), 44);
    assert.equal(earlierTimelineAge(18, 12), 12);
  });

  it("keeps a younger typed age inside the photo range", () => {
    const portrait = futurePortrait(15, 12, 70);
    assert.equal(portrait.future, 45);
    assert.equal(portrait.limited, false);
  });
});
