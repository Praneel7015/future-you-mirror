"use client";

import { useState } from "react";
import { findClosestPhoto, useMirror } from "@/lib/store";
import type { SdConcern } from "@/lib/perfectcorp/types";
import { applyLifestyleDeltas } from "@/lib/lifestyle-deltas";
import { compositeSkinScore } from "@/lib/skin-score";
import {
  CONCERN_NAME,
  RECOMMENDATIONS,
  foodNoteFor,
  type Citation,
} from "@/lib/recommendations";
import { LegalLinks, NotMedicalAdvice } from "@/components/LegalNote";
import { QuietChoice } from "./QuietChoice";
import SkinScoreRing from "./SkinScoreRing";

function CitationList({ citations }: { citations: Citation[] }) {
  return (
    <ul className="mt-2 space-y-1">
      {citations.map((cite) => (
        <li key={cite.href + cite.label}>
          <a
            href={cite.href}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block text-[12px]"
            style={{
              color: "#A78B71",
              textDecoration: "underline",
              textUnderlineOffset: 3,
              padding: "2px 0",
            }}
          >
            {cite.label}
          </a>
        </li>
      ))}
    </ul>
  );
}

function uniqueCitations(groups: Citation[][]): Citation[] {
  const seen = new Set<string>();
  const out: Citation[] = [];
  for (const group of groups) {
    for (const cite of group) {
      if (seen.has(cite.href)) continue;
      seen.add(cite.href);
      out.push(cite);
    }
  }
  return out;
}

export default function InsightsStep() {
  const result = useMirror((s) => s.result);
  const setStep = useMirror((s) => s.setStep);
  const sun = useMirror((s) => s.sun);
  const hyd = useMirror((s) => s.hyd);
  const sleep = useMirror((s) => s.sleep);
  const routine = useMirror((s) => s.routine);
  const [picked, setPicked] = useState<SdConcern | null>(null);

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
  const adjusted = applyLifestyleDeltas(result.skin.concerns, sliders);
  const ranked = (Object.keys(result.skin.concerns) as SdConcern[])
    .map((key) => ({ key, ui: Math.round(adjusted[key] ?? result.skin.concerns[key].ui) }))
    .sort((a, b) => a.ui - b.ui);
  const chips = ranked.slice(0, 3);
  const topKey = chips[0]?.key;
  const selected =
    picked && chips.some((chip) => chip.key === picked) ? picked : topKey;
  const selectedScore = chips.find((chip) => chip.key === selected);
  const rec = selected ? RECOMMENDATIONS[selected] : null;
  const food = selected ? foodNoteFor(selected) : null;
  const maskUrl = selected ? result.skin.concerns[selected].maskUrls?.[0] : undefined;
  const agingFace = findClosestPhoto(result.aging.photos, result.aging.currentAge ?? 30)?.url;
  const faceSrc = maskUrl && result.skin.resizedImageUrl ? result.skin.resizedImageUrl : agingFace;

  return (
    <div
      className="mx-auto flex h-full min-h-0 w-full max-w-md flex-col overflow-hidden"
      style={{
        paddingTop: "max(8px, env(safe-area-inset-top))",
        paddingBottom: "max(8px, env(safe-area-inset-bottom))",
        paddingLeft: "max(20px, env(safe-area-inset-left))",
        paddingRight: "max(20px, env(safe-area-inset-right))",
      }}
    >
      <div className="flex shrink-0 items-end justify-between gap-3">
        <div>
          <div
            className="text-[10px] uppercase"
            style={{ letterSpacing: "0.28em", color: "rgba(42,40,38,0.55)", fontStyle: "italic" }}
          >
            Your reading
          </div>
          <h1
            className="mt-1"
            style={{
              fontFamily: "var(--font-serif)",
              fontSize: 26,
              lineHeight: 1.05,
              fontWeight: 400,
            }}
          >
            Tap a concern.
          </h1>
        </div>
        <SkinScoreRing score={score} betterThan={Math.round(score)} size={64} compact />
      </div>

      <div
        className="relative mt-3 min-h-0 flex-1 overflow-hidden"
        style={{
          borderRadius: 18,
          background: "#E7DDD2",
          minHeight: 140,
        }}
      >
        {faceSrc && (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={faceSrc}
            alt="Your photo"
            className="absolute inset-0 h-full w-full object-cover"
            style={{ objectPosition: "center 18%" }}
          />
        )}
        {maskUrl ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={maskUrl}
            alt=""
            className="pointer-events-none absolute inset-0 h-full w-full object-cover"
            style={{ objectPosition: "center 18%", opacity: 0.55, mixBlendMode: "soft-light" }}
          />
        ) : (
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(58% 42% at 50% 36%, rgba(245,212,184,0.72), transparent 72%)",
              mixBlendMode: "soft-light",
            }}
          />
        )}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background: "linear-gradient(180deg, rgba(26,22,18,0) 46%, rgba(26,22,18,0.55) 100%)",
          }}
        />
        <div
          className="absolute inset-x-4 bottom-1"
          style={{ textShadow: "0 1px 10px rgba(14,12,10,0.75)" }}
        >
          {chips.map((chip) => (
            <QuietChoice
              key={chip.key}
              label={CONCERN_NAME[chip.key]}
              selected={chip.key === selected}
              onClick={() => setPicked(chip.key)}
            />
          ))}
        </div>
      </div>

      {rec && food && selectedScore && (
        <article className="mt-2 shrink-0" style={{ borderTop: "1px solid rgba(42,40,38,0.12)", paddingTop: 8 }}>
          <h2
            style={{
              fontFamily: "var(--font-serif)",
              fontStyle: "italic",
              fontSize: 20,
              fontWeight: 400,
              lineHeight: 1.15,
            }}
          >
            {CONCERN_NAME[rec.concern]}
          </h2>
          <p className="mt-1 text-[13px] leading-snug" style={{ color: "rgba(42,40,38,0.78)" }}>
            {rec.action}
          </p>
          <p className="mt-1 text-[13px] leading-snug" style={{ color: "#2A2826" }}>
            Product: {rec.productType}
          </p>
          <p className="mt-1 text-[13px] leading-snug" style={{ color: "rgba(42,40,38,0.78)" }}>
            {food.body}
          </p>
          <CitationList citations={uniqueCitations([rec.citations, food.citations])} />
        </article>
      )}

      <div className="mt-2 shrink-0">
        <NotMedicalAdvice />
        <button
          onClick={() => setStep("share")}
          className="mt-2 w-full rounded-full font-medium"
          style={{
            height: 48,
            fontSize: 15,
            letterSpacing: "0.02em",
            background: "#A78B71",
            color: "#FBF8F3",
          }}
        >
          Save your reading
        </button>
        <div className="mt-1">
          <LegalLinks compact />
        </div>
      </div>
    </div>
  );
}
