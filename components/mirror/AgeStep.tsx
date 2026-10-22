"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { useMirror } from "@/lib/store";
import { STATED_AGE_MAX, STATED_AGE_MIN } from "@/lib/stated-age";
import { MirrorFrame } from "./MirrorFrame";

const stepButton = {
  width: 56,
  height: 56,
  borderRadius: 999,
  border: "1px solid rgba(42,40,38,0.18)",
  background: "transparent",
  color: "#2A2826",
  fontSize: 28,
  lineHeight: 1,
} as const;

export default function AgeStep() {
  const setStep = useMirror((s) => s.setStep);
  const setStatedAge = useMirror((s) => s.setStatedAge);
  const isDemo = useSearchParams().get("demo") === "true";
  const [age, setAge] = useState(25);

  return (
    <MirrorFrame>
      <div
        className="text-[10px] uppercase"
        style={{ letterSpacing: "0.28em", color: "rgba(42,40,38,0.55)", fontStyle: "italic" }}
      >
        Your age
      </div>
      <h1
        className="mt-3"
        style={{
          fontFamily: "var(--font-serif)",
          fontSize: 36,
          lineHeight: 1.1,
          fontWeight: 400,
          letterSpacing: "-0.01em",
        }}
      >
        How old are you?
      </h1>

      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="flex items-center gap-6">
          <button
            type="button"
            aria-label="Younger"
            disabled={age <= STATED_AGE_MIN}
            onClick={() => setAge((n) => Math.max(STATED_AGE_MIN, n - 1))}
            style={{ ...stepButton, opacity: age <= STATED_AGE_MIN ? 0.35 : 1 }}
          >
            −
          </button>
          <div
            style={{
              fontFamily: "var(--font-serif)",
              fontSize: 96,
              lineHeight: 0.9,
              fontWeight: 300,
              letterSpacing: "-0.04em",
              color: "#2A2826",
              fontVariantNumeric: "tabular-nums",
              minWidth: 140,
              textAlign: "center",
            }}
          >
            {age}
          </div>
          <button
            type="button"
            aria-label="Older"
            disabled={age >= STATED_AGE_MAX}
            onClick={() => setAge((n) => Math.min(STATED_AGE_MAX, n + 1))}
            style={{ ...stepButton, opacity: age >= STATED_AGE_MAX ? 0.35 : 1 }}
          >
            +
          </button>
        </div>
        <p
          className="mt-8 text-center"
          style={{
            fontFamily: "var(--font-serif)",
            fontStyle: "italic",
            fontSize: 16,
            lineHeight: 1.45,
            color: "#6B5D52",
            maxWidth: 280,
          }}
        >
          This is your age. Skin age comes from the photo and can be different.
        </p>
      </div>

      <button
        type="button"
        onClick={() => {
          setStatedAge(age);
          setStep(isDemo ? "loading" : "capture");
        }}
        className="w-full rounded-full font-medium"
        style={{
          height: 56,
          fontSize: 15,
          letterSpacing: "0.02em",
          background: "#A78B71",
          color: "#FBF8F3",
        }}
      >
        This is my age
      </button>
    </MirrorFrame>
  );
}
