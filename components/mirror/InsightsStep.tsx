"use client";

import { useMirror } from "@/lib/store";
import type { SdConcern } from "@/lib/perfectcorp/types";

type InsightTemplate = {
  finding: (score: number) => string;
  action: string;
};

const INSIGHTS: Record<SdConcern, InsightTemplate> = {
  moisture: {
    finding: (s) => `Your skin's moisture reads at ${s} — below your generation's median.`,
    action: "Layer a hyaluronic-acid serum under moisturizer at night.",
  },
  wrinkle: {
    finding: (s) => `Fine line patterns are showing at ${s} — quietly emerging.`,
    action: "Introduce a low-percentage retinol twice a week, after week three.",
  },
  firmness: {
    finding: (s) => `Firmness reads at ${s} — your collagen scaffolding is asking for support.`,
    action: "A peptide serum each morning, paired with daily SPF 30 to protect what you have.",
  },
  radiance: {
    finding: (s) => `Radiance is sitting at ${s} — a sign of slowed cellular turnover.`,
    action: "A weekly gentle exfoliation; vitamin C serum each morning.",
  },
  texture: {
    finding: (s) => `Your texture reading at ${s} suggests a quiet, slow-build approach.`,
    action: "Introduce a low-percentage retinol twice a week, after week three.",
  },
  pore: {
    finding: (s) => `Pore visibility is shaping the trajectory — reading at ${s}.`,
    action: "A weekly clay mask; salicylic acid as an overnight treatment.",
  },
  oiliness: {
    finding: (s) => `Oil balance reads at ${s} — surface lipids are running rich.`,
    action: "Switch to a gel-based moisturizer; niacinamide serum to balance sebum.",
  },
  redness: {
    finding: (s) => `Redness is reading at ${s} — your barrier may be working overtime.`,
    action: "A centella-asiatica or oat-based balm; pause acids for two weeks.",
  },
  acne: {
    finding: (s) => `Active breakouts are present — reading at ${s}.`,
    action: "A gentle cleanser plus a targeted salicylic acid spot treatment, twice daily.",
  },
  age_spot: {
    finding: (s) => `Sun-driven pigmentation is reading at ${s} — the trajectory's biggest lever.`,
    action: "A daily mineral SPF 30 in the morning, even on overcast days.",
  },
  dark_circle_v2: {
    finding: (s) => `Under-eye darkness reads at ${s} — circulation, sleep, or pigment.`,
    action: "A caffeine eye serum each morning; eight hours of sleep, gently.",
  },
  eye_bag: {
    finding: (s) => `Under-eye puffiness reads at ${s} — fluid, fatigue, or thin skin.`,
    action: "Cool compress in the morning; a peptide eye cream at night.",
  },
  droopy_upper_eyelid: {
    finding: (s) => `Upper-lid laxity reads at ${s} — quiet structural change.`,
    action: "A peptide eye cream morning and night; SPF around the orbital bone.",
  },
  droopy_lower_eyelid: {
    finding: (s) => `Lower-lid laxity reads at ${s} — gentle support over time.`,
    action: "A retinaldehyde eye cream at night; sleep on your back to reduce pressure.",
  },
};

export default function InsightsStep() {
  const result = useMirror((s) => s.result);
  const setStep = useMirror((s) => s.setStep);

  if (!result) {
    return (
      <div className="flex-1 flex items-center justify-center" style={{ minHeight: "100vh" }}>
        <div className="font-serif text-lg" style={{ color: "rgba(42,40,38,0.5)" }}>
          No reading yet.
        </div>
      </div>
    );
  }

  const lowest = Object.entries(result.skin.concerns)
    .map(([k, v]) => ({ key: k as SdConcern, ui: v.ui }))
    .sort((a, b) => a.ui - b.ui)
    .slice(0, 3);

  const cards = lowest.map((c, i) => ({
    n: i + 1,
    finding: INSIGHTS[c.key].finding(c.ui),
    action: INSIGHTS[c.key].action,
  }));

  return (
    <div className="flex-1 flex flex-col px-6 pt-16 pb-12 max-w-md mx-auto w-full" style={{ minHeight: "100vh" }}>
      <div
        className="text-[10px] uppercase"
        style={{ letterSpacing: "0.28em", color: "rgba(42,40,38,0.55)", fontStyle: "italic" }}
      >
        Your reading
      </div>
      <h1
        className="mt-2"
        style={{
          fontFamily: "var(--font-serif)",
          fontSize: 26,
          lineHeight: 1.1,
          fontWeight: 400,
        }}
      >
        Three things,{" "}
        <span style={{ color: "#A78B71", fontStyle: "italic" }}>quietly considered.</span>
      </h1>

      <div className="mt-8 space-y-3">
        {cards.map((c) => (
          <div
            key={c.n}
            className="bg-white rounded-2xl"
            style={{
              padding: "14px 16px",
              border: "1px solid rgba(42,40,38,0.06)",
              boxShadow: "0 1px 2px rgba(42,40,38,0.03)",
            }}
          >
            <div className="flex items-start gap-3">
              <div
                className="flex-shrink-0"
                style={{
                  fontFamily: "var(--font-serif)",
                  fontSize: 30,
                  lineHeight: 1,
                  fontWeight: 300,
                  color: "#A78B71",
                  width: 22,
                }}
              >
                {c.n}
              </div>
              <div className="flex-1 min-w-0">
                <div
                  style={{
                    fontFamily: "var(--font-serif)",
                    fontSize: 14,
                    lineHeight: 1.4,
                    fontWeight: 400,
                    textWrap: "pretty" as const,
                  }}
                >
                  {c.finding}
                </div>
                <div className="my-2" style={{ height: 1, background: "rgba(42,40,38,0.12)" }} />
                <div className="text-[12px] leading-[1.5]" style={{ color: "rgba(42,40,38,0.7)" }}>
                  {c.action}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex-1" />

      <div className="mt-6">
        <button
          onClick={() => setStep("share")}
          className="w-full rounded-full"
          style={{
            height: 52,
            fontSize: 14,
            letterSpacing: "0.02em",
            background: "transparent",
            color: "#2A2826",
            border: "1px solid rgba(42,40,38,0.15)",
          }}
        >
          Save your reading
        </button>
        <div
          className="text-center mt-3 text-[10px] uppercase"
          style={{ letterSpacing: "0.18em", color: "#6B5D52" }}
        >
          READINGS ARE YOURS · NEVER SHARED
        </div>
      </div>
    </div>
  );
}
