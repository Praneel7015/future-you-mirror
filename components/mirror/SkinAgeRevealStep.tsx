"use client";

import { useMirror, findClosestPhoto } from "@/lib/store";
import { futurePortrait } from "@/lib/stated-age";
import { MirrorFrame } from "./MirrorFrame";

function gapPhrase(gap: number) {
  const abs = Math.abs(gap);
  const word =
    abs <= 1 ? "about a year" :
    abs <= 2 ? "two years" :
    abs <= 3 ? "three years" :
    abs <= 4 ? "four years" :
    abs <= 5 ? "five years" :
    abs <= 6 ? "six years" :
    abs <= 7 ? "seven years" :
    abs <= 8 ? "eight years" :
    abs <= 10 ? "nearly a decade" :
    `${abs} years`;

  if (gap > 0) return { headline: `${abs}-year skin gap`, sentence: `Your skin reads ${word} older than you are.` };
  if (gap < 0) return { headline: `${abs}-year skin gap`, sentence: `Your skin reads ${word} younger than you are.` };
  return { headline: "in step", sentence: "Your skin is in step with your years." };
}

export default function SkinAgeRevealStep() {
  const result = useMirror((s) => s.result);
  const statedAge = useMirror((s) => s.statedAge);
  const setStep = useMirror((s) => s.setStep);
  const setScrubAge = useMirror((s) => s.setScrubAge);

  if (!result || statedAge == null) {
    return (
      <MirrorFrame className="items-center justify-center">
        <div className="font-serif text-lg" style={{ color: "rgba(42,40,38,0.5)" }}>
          No reading yet.
        </div>
      </MirrorFrame>
    );
  }

  const skinAge = result.skin.skinAge ?? statedAge;
  const gap = skinAge - statedAge;
  const { headline, sentence } = gapPhrase(gap);
  const portrait = futurePortrait(statedAge, result.aging.ageMin, result.aging.ageMax);

  const sliver = findClosestPhoto(result.aging.photos, statedAge);

  const onContinue = () => {
    setScrubAge(portrait.future);
    setStep("split");
  };

  return (
    <MirrorFrame>
      <div className="text-[10px] uppercase" style={{ letterSpacing: "0.28em", color: "rgba(42,40,38,0.55)", fontStyle: "italic" }}>
        Your reading
      </div>

      <div className="mt-10 grid grid-cols-2 gap-4">
        <div>
          <div className="text-[10px] uppercase" style={{ letterSpacing: "0.28em", color: "rgba(42,40,38,0.5)" }}>
            Your age
          </div>
          <div
            style={{
              fontFamily: "var(--font-serif)",
              fontSize: 110,
              lineHeight: 0.92,
              fontWeight: 300,
              letterSpacing: "-0.04em",
              marginTop: 8,
              color: "#2A2826",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {statedAge}
          </div>
        </div>
        <div className="text-right">
          <div className="text-[10px] uppercase" style={{ letterSpacing: "0.28em", color: "rgba(42,40,38,0.5)" }}>
            Skin age
          </div>
          <div
            style={{
              fontFamily: "var(--font-serif)",
              fontSize: 110,
              lineHeight: 0.92,
              fontWeight: 300,
              letterSpacing: "-0.04em",
              marginTop: 8,
              color: "#A78B71",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {Math.round(skinAge)}
          </div>
        </div>
      </div>

      <div className="mt-10 flex items-center">
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
          {headline}
        </div>
        <div className="flex-1" style={{ height: 1, background: "rgba(42,40,38,0.12)" }} />
      </div>

      <p
        className="mt-12"
        style={{
          fontFamily: "var(--font-serif)",
          fontSize: 21,
          lineHeight: 1.35,
          fontWeight: 400,
          textWrap: "pretty" as const,
        }}
      >
        {sentence}{" "}
        <span style={{ color: "rgba(42,40,38,0.55)" }}>
          Here&apos;s what that looks like — and how to close the gap.
        </span>
      </p>
      {portrait.sentence && (
        <p
          className="mt-4"
          style={{
            fontFamily: "var(--font-serif)",
            fontStyle: "italic",
            fontSize: 16,
            lineHeight: 1.4,
            color: "#6B5D52",
          }}
        >
          {portrait.sentence}
        </p>
      )}

      <div className="flex-1" />

      {sliver && (
        <div className="mb-6 relative w-full overflow-hidden rounded-xl" style={{ height: 80 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={sliver.url}
            alt=""
            className="w-full h-full object-cover"
            style={{ objectPosition: "center 30%", filter: "saturate(0.92) brightness(1.02)" }}
          />
          <div
            className="absolute inset-0"
            style={{ background: "linear-gradient(180deg, rgba(248,245,240,0) 50%, rgba(248,245,240,0.35) 100%)" }}
          />
        </div>
      )}

      <button
        onClick={onContinue}
        className="w-full rounded-full font-medium"
        style={{
          height: 56,
          fontSize: 15,
          letterSpacing: "0.02em",
          background: "#A78B71",
          color: "#FBF8F3",
        }}
      >
        See your trajectory
      </button>
    </MirrorFrame>
  );
}
