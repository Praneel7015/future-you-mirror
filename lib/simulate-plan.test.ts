import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  bakedWithCareUrl,
  isSamplePhotoSource,
  plainSimulateFailure,
  planSimulate,
} from "./simulate-plan.ts";

describe("simulate plan", () => {
  it("treats sample photos as demo, including absolute URLs", () => {
    assert.equal(isSamplePhotoSource("/sample-photos/age-47.jpg"), true);
    assert.equal(
      isSamplePhotoSource("https://future-you-mirror.vercel.app/sample-photos/age-47.jpg"),
      true,
    );
    assert.equal(isSamplePhotoSource("https://cdn.example.com/aging/face.jpg"), false);
  });

  it("maps each sample age photo to a baked with-care file", () => {
    assert.equal(bakedWithCareUrl("/sample-photos/age-47.jpg"), "/sample-photos/with-care/age-47.jpg");
    assert.equal(
      bakedWithCareUrl("https://example.com/sample-photos/age-12.jpg?x=1"),
      "/sample-photos/with-care/age-12.jpg",
    );
    assert.equal(bakedWithCareUrl("https://cdn.example.com/face.jpg"), null);
  });

  it("never plans a live call for demo or sample sources", () => {
    assert.deepEqual(planSimulate({ sourceUrl: "/sample-photos/age-31.jpg" }), {
      action: "demo",
      imageUrl: "/sample-photos/with-care/age-31.jpg",
    });
    assert.equal(
      planSimulate({ sourceUrl: "https://cdn.example.com/face.jpg", demo: true }).action,
      "error",
    );
    assert.deepEqual(planSimulate({ sourceUrl: "https://cdn.example.com/face.jpg" }), {
      action: "live",
    });
  });

  it("says a failure is not a with-care photo", () => {
    const text = plainSimulateFailure("missing_credentials", "Missing Perfect Corp env vars");
    assert.match(text, /only the aged photo/i);
    assert.match(text, /not a with-care simulation/i);
    assert.doesNotMatch(text, /applied/i);
  });

  it("names an empty credit balance and a missing face", () => {
    assert.match(plainSimulateFailure("CreditInsufficiency", "The operation could not be completed"), /no credits/i);
    assert.match(plainSimulateFailure("error_no_face", "No face detected on source image"), /could not find a face/i);
    assert.match(plainSimulateFailure("invalid_public_key", "paste the public key"), /RSA public key/i);
  });
});
