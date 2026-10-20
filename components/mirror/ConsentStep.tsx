"use client";

import Link from "next/link";
import { useState } from "react";
import { useMirror } from "@/lib/store";
import { LegalLinks, NotMedicalAdvice } from "@/components/LegalNote";
import { PHOTO_DEMO, PHOTO_LIVE } from "@/lib/copy";

const LINES = [
  "The camera stays off until you tap it.",
  PHOTO_LIVE,
  PHOTO_DEMO,
];

export default function ConsentStep() {
  const setStep = useMirror((s) => s.setStep);
  const [checked, setChecked] = useState(false);

  return (
    <div
      className="flex h-full min-h-0 w-full flex-col overflow-hidden"
      style={{
        paddingTop: "max(12px, env(safe-area-inset-top))",
        paddingBottom: "max(12px, env(safe-area-inset-bottom))",
        paddingLeft: "max(20px, env(safe-area-inset-left))",
        paddingRight: "max(20px, env(safe-area-inset-right))",
      }}
    >
      <div className="mx-auto flex h-full min-h-0 w-full max-w-md flex-col">
        <div
          className="text-[10px] uppercase"
          style={{ letterSpacing: "0.28em", color: "rgba(42,40,38,0.55)", fontStyle: "italic" }}
        >
          A moment
        </div>
        <h1
          className="mt-1"
          style={{
            fontFamily: "var(--font-serif)",
            fontSize: 32,
            lineHeight: 1.05,
            fontWeight: 400,
            letterSpacing: "-0.01em",
          }}
        >
          Before we begin
        </h1>

        <div className="mt-4 flex min-h-0 flex-1 flex-col justify-center">
          {LINES.map((line, i) => (
            <div key={line}>
              <p
                style={{
                  fontFamily: "var(--font-serif)",
                  fontSize: 16,
                  lineHeight: 1.35,
                  fontWeight: 400,
                  color: "#2A2826",
                  textWrap: "pretty" as const,
                }}
              >
                {line}
              </p>
              {i < LINES.length - 1 && (
                <div className="my-3" style={{ width: 24, height: 1, background: "rgba(42,40,38,0.2)" }} />
              )}
            </div>
          ))}
        </div>

        <button
          onClick={() => setChecked(!checked)}
          className="mt-3 flex w-full items-center gap-3 text-left"
          style={{ minHeight: 44 }}
        >
          <span
            className="inline-flex items-center justify-center"
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

        <div className="mt-2">
          <NotMedicalAdvice />
          <div className="mt-1">
            <LegalLinks compact />
          </div>
          <Link
            href="/privacy"
            className="inline-block font-serif italic"
            style={{
              fontSize: 14,
              color: "var(--mocha)",
              borderBottom: "0.5px solid rgba(167,139,113,0.4)",
              padding: "6px 0",
              textDecoration: "none",
            }}
          >
            Read what we keep
          </Link>
        </div>

        <button
          disabled={!checked}
          onClick={() => setStep("capture")}
          className="mt-3 w-full rounded-full font-medium"
          style={{
            height: 52,
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
      </div>
    </div>
  );
}
