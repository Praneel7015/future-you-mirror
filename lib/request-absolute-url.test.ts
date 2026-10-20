import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { publicOriginFrom, toAbsoluteRequestUrl } from "./request-absolute-url.ts";

function headers(map: Record<string, string>): { get(name: string): string | null } {
  return {
    get(name: string) {
      return map[name.toLowerCase()] ?? null;
    },
  };
}

describe("request URL", () => {
  it("resolves a same-origin path against the public host", () => {
    const origin = publicOriginFrom(
      headers({ "x-forwarded-host": "future-you-mirror.vercel.app", "x-forwarded-proto": "https" }),
      "http://localhost:3000",
    );
    assert.equal(origin, "https://future-you-mirror.vercel.app");
    assert.equal(
      toAbsoluteRequestUrl("/sample-photos/age-47.jpg", origin),
      "https://future-you-mirror.vercel.app/sample-photos/age-47.jpg",
    );
  });

  it("leaves absolute URLs alone", () => {
    assert.equal(
      toAbsoluteRequestUrl("https://cdn.example.com/a.jpg", "https://future-you-mirror.vercel.app"),
      "https://cdn.example.com/a.jpg",
    );
  });
});
