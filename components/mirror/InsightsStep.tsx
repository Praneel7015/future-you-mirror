"use client";

import { useState } from "react";
import { findClosestPhoto, useMirror } from "@/lib/store";
import type { SdConcern } from "@/lib/perfectcorp/types";
import { checksByScore, readingScore } from "@/lib/skin-score";
import {
  CONCERN_NAME,
  RECOMMENDATIONS,
  everydayPlate,
  foodNoteFor,
  type Citation,
} from "@/lib/recommendations";
import { LegalLinks, NotMedicalAdvice } from "@/components/LegalNote";
import SkinScoreRing from "./SkinScoreRing";
import { MirrorFrame } from "./MirrorFrame";

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
              padding: "8px 0",
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
  const statedAge = useMirror((s) => s.statedAge);
  const [picked, setPicked] = useState<SdConcern | null>(null);

  if (!result) {
    return (
      <MirrorFrame className="items-center justify-center">
        <div className="font-serif text-lg" style={{ color: "rgba(42,40,38,0.5)" }}>
          No reading yet.
        </div>
      </MirrorFrame>
    );
  }

  const score = readingScore(result.skin);
  const ranked = checksByScore(result.skin.concerns);
  const chips = ranked.slice(0, 3);
  const topKey = chips[0]?.key;
  const selected =
    picked && chips.some((chip) => chip.key === picked) ? picked : topKey;
  const selectedScore = chips.find((chip) => chip.key === selected);
  const rec = selected ? RECOMMENDATIONS[selected] : null;
  const food = selected ? foodNoteFor(selected) : null;
  const plate = everydayPlate();
  const maskUrl = selected ? result.skin.concerns[selected].maskUrls?.[0] : undefined;
  const agingFace =
    statedAge == null ? undefined : findClosestPhoto(result.aging.photos, statedAge)?.url;
  const faceSrc = maskUrl && result.skin.resizedImageUrl ? result.skin.resizedImageUrl : agingFace;

  return (
    <MirrorFrame>
      <div
        className="text-[10px] uppercase"
        style={{ letterSpacing: "0.28em", color: "rgba(42,40,38,0.55)", fontStyle: "italic" }}
      >
        Your reading
      </div>

      <h1
        className="mt-8"
        style={{
          fontFamily: "var(--font-serif)",
          fontSize: 28,
          lineHeight: 1.1,
          fontWeight: 400,
        }}
      >
        Tap a concern.
      </h1>
      <p className="mt-2 text-[14px] leading-relaxed" style={{ color: "rgba(42,40,38,0.7)" }}>
        The soft light marks the one to look at first.
      </p>

      <div
        className="relative mt-5 overflow-hidden"
        style={{
          height: 360,
          borderRadius: 24,
          background: "#E7DDD2",
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
      </div>

      <div className="mt-4 flex flex-col gap-2">
          {chips.map((chip) => {
            const on = chip.key === selected;
            const isTop = chip.key === topKey;
            return (
              <button
                key={chip.key}
                type="button"
                aria-pressed={on}
                onClick={() => setPicked(chip.key)}
                className="w-full rounded-full text-left"
                style={{
                  minHeight: 48,
                  padding: "10px 16px",
                  fontFamily: "var(--font-serif)",
                  fontSize: 17,
                  background: on ? "#FFFFFF" : "transparent",
                  color: "#2A2826",
                  border: "1px solid rgba(42,40,38,0.16)",
                  boxShadow: isTop ? "0 0 0 2px #F5D4B8" : "none",
                }}
              >
                {CONCERN_NAME[chip.key]}
              </button>
            );
          })}
      </div>

      {rec && food && selectedScore && (
        <article
          className="mt-5 bg-white rounded-2xl"
          style={{
            padding: "16px",
            border: "1px solid rgba(42,40,38,0.06)",
            boxShadow: "0 1px 2px rgba(42,40,38,0.03)",
          }}
        >
          <h2
            style={{
              fontFamily: "var(--font-serif)",
              fontSize: 26,
              fontWeight: 400,
              lineHeight: 1.15,
            }}
          >
            {CONCERN_NAME[rec.concern]}
          </h2>
          <p className="mt-3 text-[15px] leading-relaxed" style={{ color: "rgba(42,40,38,0.78)" }}>
            {rec.action}
          </p>
          <p className="mt-4 text-[14px] leading-relaxed" style={{ color: "#2A2826" }}>
            Product: {rec.productType}
          </p>
          <p className="mt-3 text-[14px] leading-relaxed" style={{ color: "rgba(42,40,38,0.78)" }}>
            {food.body}
          </p>
          <CitationList citations={uniqueCitations([rec.citations, food.citations])} />
        </article>
      )}

      <article
        className="mt-4 bg-white rounded-2xl"
        style={{
          padding: "16px",
          border: "1px solid rgba(42,40,38,0.06)",
          boxShadow: "0 1px 2px rgba(42,40,38,0.03)",
        }}
      >
        <h2
          style={{
            fontFamily: "var(--font-serif)",
            fontSize: 22,
            fontWeight: 400,
            lineHeight: 1.2,
          }}
        >
          {plate.title}
        </h2>
        <p className="mt-3 text-[15px] leading-relaxed" style={{ color: "rgba(42,40,38,0.78)" }}>
          {plate.body}
        </p>
        <CitationList citations={plate.citations} />
      </article>

      <div className="mt-8 flex justify-center">
        <SkinScoreRing
          score={score}
          lowestName={ranked[0] ? CONCERN_NAME[ranked[0].key] : undefined}
          lowestScore={ranked[0]?.ui}
          size={148}
        />
      </div>

      <div className="mt-8">
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
    </MirrorFrame>
  );
}
