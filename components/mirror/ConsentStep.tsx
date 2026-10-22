"use client";

import Link from "next/link";
import { useState } from "react";
import { useMirror } from "@/lib/store";
import { NotMedicalAdvice } from "@/components/LegalNote";
import { PHOTO_DEMO, PHOTO_LIVE } from "@/lib/copy";
import { MirrorFrame } from "./MirrorFrame";

const LINES = [
  "The camera stays off until you tap it.",
  PHOTO_LIVE,
  PHOTO_DEMO,
];

export default function ConsentStep() {
  const setStep = useMirror((s) => s.setStep);
  const [checked, setChecked] = useState(false);

  return (
    <MirrorFrame>
      <div className="text-[10px] uppercase" style={{ letterSpacing: "0.28em", color: "rgba(42,40,38,0.55)", fontStyle: "italic" }}>
        A moment
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
        Before we begin
      </h1>

      <div className="mt-12 flex-1">
        {LINES.map((line, i) => (
          <div key={i}>
            <p
              style={{
                fontFamily: "var(--font-serif)",
                fontSize: 17,
                lineHeight: 1.5,
                fontWeight: 400,
                color: "#2A2826",
                textWrap: "pretty" as const,
              }}
            >
              {line}
            </p>
            {i < LINES.length - 1 && (
              <div className="my-6 mx-auto" style={{ width: 24, height: 1, background: "rgba(42,40,38,0.2)" }} />
            )}
          </div>
        ))}
      </div>

      <div className="mt-8">
        <button
          onClick={() => setChecked(!checked)}
          className="flex items-center gap-3 w-full text-left"
        >
          <span
            className="inline-flex items-center justify-center transition-colors"
            style={{
              width: 22,
              height: 22,
              borderRadius: 4,
              border: "1px solid rgba(42,40,38,0.35)",
              background: checked ? "#2A2826" : "transparent",
              borderColor: checked ? "#2A2826" : "rgba(42,40,38,0.35)",
            }}
          >
            {checked && (
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M2.5 6.2L5 8.5L9.5 3.5" stroke="#F8F5F0" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </span>
          <span className="text-[14px]" style={{ color: "#2A2826" }}>I&apos;m ready</span>
        </button>
      </div>

      <div className="mt-4">
        <NotMedicalAdvice />
        <div className="mt-2 flex items-center justify-center gap-8">
          <Link
            href="/privacy"
            className="inline-block font-serif italic"
            style={{
              fontSize: 14,
              color: "var(--mocha)",
              borderBottom: "0.5px solid rgba(167,139,113,0.4)",
              padding: "12px 0",
              textDecoration: "none",
            }}
          >
            Read what we keep
          </Link>
          <Link
            href="/terms"
            className="inline-block font-serif italic"
            style={{
              fontSize: 14,
              color: "var(--mocha)",
              borderBottom: "0.5px solid rgba(167,139,113,0.4)",
              padding: "12px 0",
              textDecoration: "none",
            }}
          >
            Terms
          </Link>
        </div>
      </div>

      <div className="mt-6">
        <button
          disabled={!checked}
          onClick={() => setStep("age")}
          className="w-full rounded-full font-medium transition-all"
          style={{
            height: 56,
            fontSize: 15,
            letterSpacing: "0.02em",
            background: "#A78B71",
            color: "#FBF8F3",
            opacity: checked ? 1 : 0.35,
            cursor: checked ? "pointer" : "not-allowed",
          }}
        >
          Continue
        </button>
        <div
          className="text-center mt-4 text-[10px] uppercase"
          style={{ letterSpacing: "0.18em", color: "#6B5D52" }}
        >
          NOT A DOCTOR · YOU CAN STOP ANY TIME
        </div>
      </div>
    </MirrorFrame>
  );
}
