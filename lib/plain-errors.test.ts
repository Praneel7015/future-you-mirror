import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { plainMirrorError } from "./plain-errors.ts";

const TASK =
  "Task iTWKgKSrj2ykJm5I0D4egGmFW7yoktbL5dJxjQura9n5zynyA4CtS7UYZDwSkogoSpcgV8WTLEnG8Q2PXjtLzQ failed: The face in the input image is too small. It needs to take up more than 60% of the image width.";

describe("plain mirror errors", () => {
  it("turns a face-too-small task into a closer step", () => {
    const text = plainMirrorError({ message: TASK });
    assert.equal(
      text,
      "Move a little closer so your face fills more of the oval, then try again.",
    );
    assert.doesNotMatch(text, /Task |failed:|iTWKg|60%/);
  });

  it("maps no face, credits, a bad key, a timeout, and anything else", () => {
    assert.match(plainMirrorError({ code: "error_no_face", message: "Task abc failed: error_no_face" }), /couldn't see a face/i);
    assert.match(plainMirrorError({ code: "CreditInsufficiency", message: "Task abc failed: insufficient unit" }), /sample photo/i);
    assert.match(plainMirrorError({ code: "auth_failed", message: "Perfect Corp auth failed (HTTP 401)" }), /isn't available right now/i);
    assert.match(plainMirrorError({ message: "error:1E08010C:DECODER routines::unsupported" }), /isn't available right now/i);
    assert.match(plainMirrorError({ code: "task_timeout", message: "Task abc for skin-analysis did not complete within 90000ms." }), /connection paused/i);
    assert.match(plainMirrorError({ message: "Failed to fetch" }), /connection paused/i);
    const generic = plainMirrorError({ message: "Task abc failed: something new" });
    assert.match(generic, /try once more/i);
    assert.doesNotMatch(generic, /Task |abc|failed:/);
  });

  it("turns a tiny or unreadable file into a photo step, without pixel counts", () => {
    const tiny = plainMirrorError({
      code: "image_too_small",
      message: "Image is 120×90; short side must be ≥ 480px.",
    });
    assert.equal(tiny, "Move a little closer so your face fills more of the oval, then try again.");
    assert.doesNotMatch(tiny, /480|120/);
    assert.match(
      plainMirrorError({ code: "file_too_large", message: "Image is 12.4MB; max 10MB." }),
      /too big to send/i,
    );
    assert.match(
      plainMirrorError({ code: "unsupported_format", message: "Format image/gif not supported. Use JPG, PNG, or HEIC." }),
      /jpg or png/i,
    );
  });

  it("keeps a sentence it already wrote", () => {
    const sentence = "Move a little closer so your face fills more of the oval, then try again.";
    assert.equal(plainMirrorError({ message: sentence }), sentence);
  });
});
