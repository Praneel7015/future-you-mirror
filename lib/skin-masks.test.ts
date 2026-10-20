import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { httpsUrls } from "./skin-masks.ts";

describe("skin analysis mask urls", () => {
  it("keeps only https mask urls", () => {
    assert.deepEqual(
      httpsUrls([
        "https://cdn.example.com/mask.png",
        "http://cdn.example.com/mask.png",
        "not-a-url",
        12,
        " https://cdn.example.com/other.png ",
      ]),
      ["https://cdn.example.com/mask.png", "https://cdn.example.com/other.png"],
    );
    assert.deepEqual(httpsUrls(undefined), []);
    assert.deepEqual(httpsUrls("https://cdn.example.com/mask.png"), []);
  });
});
