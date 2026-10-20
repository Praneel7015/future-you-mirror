"use client";

import { useMirror } from "@/lib/store";
import type { SdConcern } from "@/lib/perfectcorp/types";
import { applyLifestyleDeltas } from "@/lib/lifestyle-deltas";
import { compositeSkinScore } from "@/lib/skin-score";
import {
  DIET_INTRO,
  DIET_INTRO_CITATIONS,
  DIET_NOTES,
  RECOMMENDATIONS,
  dietContext,
  dietScoreSentence,
  type Citation,
} from "@/lib/recommendations";
import { LegalLinks, NotMedicalAdvice } from "@/components/LegalNote";
import SkinScoreRing, { ScoreBandsList, bandFor } from "./SkinScoreRing";
import ClimateCard from "./ClimateCard";

function CitationList({ citations }: { citations: Citation[] }) {
  return (
    <ul className="mt-2 space-y-1">
      {citations.map((cite) => (
        <li key={cite.href + cite.label}>
          <a
            href={cite.href}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block text-[13px]"
            style={{
              color: "#A78B71",
              textDecoration: "underline",
              textUnderlineOffset: 3,
              padding: "6px 0",
            }}
          >
            {cite.label}
          </a>
        </li>
      ))}
    </ul>
  );
}

export default function InsightsStep() {
  const result = useMirror((s) => s.result);
  const setStep = useMirror((s) => s.setStep);
  const sun = useMirror((s) => s.sun);
  const hyd = useMirror((s) => s.hyd);
  const sleep = useMirror((s) => s.sleep);
  const routine = useMirror((s) => s.routine);

  if (!result) {
    return (
      <div className="flex-1 flex items-center justify-center" style={{ minHeight: "100dvh" }}>
        <div className="font-serif text-lg" style={{ color: "rgba(42,40,38,0.5)" }}>
          No reading yet.
        </div>
      </div>
    );
  }

  const sliders = { sun, hyd, sleep, routine };
  const score = compositeSkinScore(result.skin.concerns, sliders);
  const band = bandFor(score);

  const adjusted = applyLifestyleDeltas(result.skin.concerns, sliders);
  const lowest = (Object.keys(result.skin.concerns) as SdConcern[])
    .map((k) => ({ key: k, ui: Math.round(adjusted[k] ?? result.skin.concerns[k].ui) }))
    .sort((a, b) => a.ui - b.ui)
    .slice(0, 3);

  const cards = lowest.map((c, i) => {
    const rec = RECOMMENDATIONS[c.key];
    return { n: i + 1, score: c.ui, rec };
  });

  const diet = dietContext({
    ...(typeof adjusted.acne === "number" ? { acne: { ui: adjusted.acne } } : {}),
    ...(typeof adjusted.redness === "number" ? { redness: { ui: adjusted.redness } } : {}),
  });

  return (
    <div className="flex-1 flex flex-col px-6 pt-16 pb-12 max-w-md mx-auto w-full" style={{ minHeight: "100dvh" }}>
      <div
        className="text-[10px] uppercase"
        style={{ letterSpacing: "0.28em", color: "rgba(42,40,38,0.55)", fontStyle: "italic" }}
      >
        Your reading
      </div>

      <div className="mt-8 flex justify-center">
        <SkinScoreRing score={score} betterThan={Math.round(score)} size={200} />
      </div>

      <div className="mt-10">
        <div className="flex items-center">
          <div className="flex-1" style={{ height: 1, background: "rgba(42,40,38,0.12)" }} />
          <div
            className="mx-3"
            style={{
              fontFamily: "var(--font-serif)",
              fontStyle: "italic",
              fontSize: 13,
              color: "#2A2826",
              whiteSpace: "nowrap",
            }}
          >
            the bands
          </div>
          <div className="flex-1" style={{ height: 1, background: "rgba(42,40,38,0.12)" }} />
        </div>
        <div className="mt-4">
          <ScoreBandsList activeName={band.name} />
        </div>
      </div>

      <div className="mt-10">
        <ClimateCard />
      </div>

      <h1
        className="mt-10"
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
      <p className="mt-3 text-[13px] leading-relaxed" style={{ color: "rgba(42,40,38,0.7)" }}>
        Ideas to look at. Not a prescription.
      </p>

      <div className="mt-6 space-y-3">
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
                  {c.rec.finding(c.score)}
                </div>
                <div className="my-2" style={{ height: 1, background: "rgba(42,40,38,0.12)" }} />
                <div className="text-[13px] leading-[1.5]" style={{ color: "rgba(42,40,38,0.75)" }}>
                  {c.rec.action}
                </div>
                <div className="mt-3 text-[12px] leading-relaxed" style={{ color: "rgba(42,40,38,0.62)" }}>
                  Ingredient: {c.rec.ingredient}
                  <br />
                  Type: {c.rec.productType}
                </div>
                {c.rec.example && (
                  <div className="mt-3">
                    <div
                      className="text-[10px] uppercase"
                      style={{ letterSpacing: "0.18em", color: "#A78B71" }}
                    >
                      Example, not an endorsement
                    </div>
                    <a
                      href={c.rec.example.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block mt-1 text-[14px]"
                      style={{
                        color: "#2A2826",
                        textDecoration: "underline",
                        textUnderlineOffset: 3,
                        padding: "8px 0",
                      }}
                    >
                      {c.rec.example.name}
                    </a>
                    <div className="text-[12px]" style={{ color: "rgba(42,40,38,0.62)" }}>
                      {c.rec.example.productType}
                    </div>
                    <div
                      className="mt-1 text-[12px]"
                      style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", color: "#6B5D52" }}
                    >
                      {c.rec.example.note}
                    </div>
                  </div>
                )}
                <CitationList citations={c.rec.citations} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {diet.visible && (
        <section className="mt-10" aria-label="Food notes">
          <h2
            style={{
              fontFamily: "var(--font-serif)",
              fontSize: 26,
              lineHeight: 1.1,
              fontWeight: 400,
            }}
          >
            Food notes,{" "}
            <span style={{ color: "#A78B71", fontStyle: "italic" }}>only if you want them.</span>
          </h2>
          <p className="mt-3 text-[13px] leading-relaxed" style={{ color: "rgba(42,40,38,0.75)" }}>
            {dietScoreSentence(diet.acne, diet.redness)}
          </p>
          <p className="mt-2 text-[13px] leading-relaxed" style={{ color: "rgba(42,40,38,0.75)" }}>
            {DIET_INTRO}
          </p>
          <CitationList citations={DIET_INTRO_CITATIONS} />

          <div className="mt-4 space-y-3">
            {DIET_NOTES.map((note) => (
              <div
                key={note.id}
                className="bg-white rounded-2xl"
                style={{
                  padding: "14px 16px",
                  border: "1px solid rgba(42,40,38,0.06)",
                  boxShadow: "0 1px 2px rgba(42,40,38,0.03)",
                }}
              >
                <div
                  style={{
                    fontFamily: "var(--font-serif)",
                    fontSize: 16,
                    lineHeight: 1.35,
                  }}
                >
                  {note.title}
                </div>
                <p className="mt-2 text-[13px] leading-relaxed" style={{ color: "rgba(42,40,38,0.75)" }}>
                  {note.body}
                </p>
                <CitationList citations={note.citations} />
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="mt-10">
        <NotMedicalAdvice />
      </div>

      <div className="mt-6">
        <button
          onClick={() => setStep("share")}
          className="w-full rounded-full font-medium"
          style={{
            height: 56,
            fontSize: 15,
            letterSpacing: "0.02em",
            background: "#A78B71",
            color: "#FBF8F3",
          }}
        >
          Save your reading
        </button>
        <div
          className="text-center mt-3 text-[12px]"
          style={{ color: "#6B5D52", fontFamily: "var(--font-serif)", fontStyle: "italic" }}
        >
          We don&apos;t post this. You choose.
        </div>
        <div className="mt-2">
          <LegalLinks />
        </div>
      </div>
    </div>
  );
}
