"use client";

import { useMemo } from "react";
import { useMirror, careScore, findClosestPhoto } from "@/lib/store";

const SPOTS_BG =
  "radial-gradient(circle at 30% 38%, rgba(120,98,72,0.18) 0, transparent 1.4%)," +
  "radial-gradient(circle at 62% 44%, rgba(120,98,72,0.15) 0, transparent 1.6%)," +
  "radial-gradient(circle at 44% 58%, rgba(120,98,72,0.12) 0, transparent 1.2%)," +
  "radial-gradient(circle at 70% 62%, rgba(120,98,72,0.14) 0, transparent 1.3%)";

export default function SplitMirrorStep() {
  const result = useMirror((s) => s.result);
  const setStep = useMirror((s) => s.setStep);

  const scrubAge = useMirror((s) => s.scrubAge);
  const setScrubAge = useMirror((s) => s.setScrubAge);

  const sun = useMirror((s) => s.sun);
  const hyd = useMirror((s) => s.hyd);
  const sleepVal = useMirror((s) => s.sleep);
  const routine = useMirror((s) => s.routine);

  const setSun = useMirror((s) => s.setSun);
  const setHyd = useMirror((s) => s.setHyd);
  const setSleep = useMirror((s) => s.setSleep);
  const setRoutine = useMirror((s) => s.setRoutine);

  const photo = useMemo(() => {
    if (!result) return null;
    return findClosestPhoto(result.aging.photos, scrubAge);
  }, [result, scrubAge]);

  if (!result) {
    return (
      <div className="flex-1 flex items-center justify-center" style={{ minHeight: "100vh" }}>
        <div className="font-serif text-lg" style={{ color: "rgba(248,245,240,0.6)" }}>
          No reading yet.
        </div>
      </div>
    );
  }

  const ageMin = Math.max(25, result.aging.ageMin);
  const ageMax = result.aging.ageMax;

  const score = careScore({ sun, hyd, sleep: sleepVal, routine });
  const withoutScore = 100 - score;
  const careIntensity = 0.6 + (score / 100) * 0.6;
  const withoutIntensity = 0.4 + (withoutScore / 100) * 0.6;

  const sliders = [
    { key: "sun", icon: "☀", label: "Sun exposure", val: sun, set: setSun },
    { key: "hyd", icon: "💧", label: "Hydration", val: hyd, set: setHyd },
    { key: "sleep", icon: "◐", label: "Sleep", val: sleepVal, set: setSleep },
    { key: "routine", icon: "✷", label: "Skincare consistency", val: routine, set: setRoutine },
  ];

  return (
    <div
      className="flex-1 flex flex-col w-full relative"
      style={{ background: "#1a1612", minHeight: "100vh" }}
    >
      {/* Top: AGE + scrubber */}
      <div className="px-6 pt-12 max-w-md mx-auto w-full">
        <div className="flex items-end justify-between">
          <div>
            <div
              className="text-[10px] uppercase"
              style={{ letterSpacing: "0.28em", color: "rgba(248,245,240,0.55)" }}
            >
              Age
            </div>
            <div
              style={{
                fontFamily: "var(--font-serif)",
                fontSize: 44,
                lineHeight: 1,
                fontWeight: 300,
                color: "#F8F5F0",
                letterSpacing: "-0.02em",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {scrubAge}
            </div>
          </div>
          <div
            className="text-right text-[10px]"
            style={{ color: "rgba(248,245,240,0.5)", fontStyle: "italic", letterSpacing: "0.06em" }}
          >
            drag to travel forward
          </div>
        </div>

        <input
          type="range"
          min={ageMin}
          max={ageMax}
          value={scrubAge}
          onChange={(e) => setScrubAge(+e.target.value)}
          className="fy-scrub w-full mt-3"
          style={{ background: "rgba(248,245,240,0.22)" }}
        />

        <div className="flex justify-between mt-1.5 text-[9px]" style={{ letterSpacing: "0.18em", color: "rgba(248,245,240,0.38)" }}>
          <span>{ageMin}</span>
          <span>{Math.round(ageMin + (ageMax - ageMin) / 3)}</span>
          <span>{Math.round(ageMin + (2 * (ageMax - ageMin)) / 3)}</span>
          <span>{ageMax}</span>
        </div>
      </div>

      {/* Split portrait */}
      <div className="relative w-full mt-6 overflow-hidden" style={{ height: 442 }}>
        {/* WITH CARE — left */}
        <div className="absolute top-0 left-0 bottom-0 overflow-hidden" style={{ width: "50%" }}>
          {photo && (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={photo.url}
              alt="With care"
              className="absolute object-cover"
              style={{
                width: "200%",
                height: "100%",
                left: 0,
                top: 0,
                objectPosition: "center 25%",
                filter: `brightness(${1.02 + careIntensity * 0.06}) contrast(0.96) saturate(${1.0 + careIntensity * 0.08})`,
                transition: "filter 700ms ease",
              }}
            />
          )}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `radial-gradient(80% 60% at 50% 35%, rgba(245,212,184,${0.18 + careIntensity * 0.18}), transparent 70%), linear-gradient(180deg, rgba(245,212,184,${0.10 + careIntensity * 0.12}) 0%, rgba(245,212,184,0.04) 100%)`,
              mixBlendMode: "soft-light",
              transition: "background 700ms ease",
            }}
          />
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: "linear-gradient(180deg, rgba(0,0,0,0) 60%, rgba(26,22,18,0.55) 100%)" }}
          />
        </div>

        {/* WITHOUT — right */}
        <div className="absolute top-0 right-0 bottom-0 overflow-hidden" style={{ width: "50%" }}>
          {photo && (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={photo.url}
              alt="Without care"
              className="absolute object-cover"
              style={{
                width: "200%",
                height: "100%",
                right: 0,
                top: 0,
                objectPosition: "center 25%",
                filter: `brightness(${0.92 - withoutIntensity * 0.10}) contrast(${1.02 + withoutIntensity * 0.04}) saturate(${0.78 - withoutIntensity * 0.12})`,
                transition: "filter 700ms ease",
              }}
            />
          )}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `radial-gradient(60% 50% at 50% 40%, rgba(201,181,143,${0.14 + withoutIntensity * 0.14}), transparent 70%), linear-gradient(180deg, rgba(201,181,143,${0.18 + withoutIntensity * 0.18}) 0%, rgba(74,66,52,${0.20 + withoutIntensity * 0.18}) 100%)`,
              mixBlendMode: "multiply",
              transition: "background 700ms ease",
            }}
          />
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage: SPOTS_BG,
              mixBlendMode: "multiply",
              opacity: 0.4 + withoutIntensity * 0.5,
              transition: "opacity 700ms ease",
            }}
          />
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: "linear-gradient(180deg, rgba(0,0,0,0) 60%, rgba(26,22,18,0.55) 100%)" }}
          />
        </div>

        {/* center hairline */}
        <div
          className="absolute top-0 bottom-0 pointer-events-none"
          style={{
            left: "50%",
            width: 1,
            transform: "translateX(-0.5px)",
            background: "linear-gradient(180deg, rgba(248,245,240,0) 0%, rgba(248,245,240,0.45) 30%, rgba(248,245,240,0.45) 70%, rgba(248,245,240,0) 100%)",
          }}
        />

        {/* labels */}
        <div className="absolute bottom-4 left-0 right-0 flex pointer-events-none">
          <div
            className="flex-1 text-center text-[10px]"
            style={{ letterSpacing: "0.28em", color: "rgba(248,245,240,0.95)", fontWeight: 500 }}
          >
            WITH CARE
          </div>
          <div
            className="flex-1 text-center text-[10px]"
            style={{ letterSpacing: "0.28em", color: "rgba(248,245,240,0.95)", fontWeight: 500 }}
          >
            WITHOUT
          </div>
        </div>
      </div>

      {/* Sliders */}
      <div className="flex-1 max-w-md mx-auto w-full px-6 pt-4">
        <div className="flex items-center justify-between mb-3">
          <div className="text-[10px]" style={{ letterSpacing: "0.28em", color: "rgba(248,245,240,0.6)" }}>
            LIFESTYLE
          </div>
          <div
            className="text-[10px]"
            style={{ color: "rgba(248,245,240,0.45)", fontStyle: "italic", letterSpacing: "0.06em" }}
          >
            drag to feel the difference
          </div>
        </div>
        <div className="space-y-3">
          {sliders.map((s) => (
            <div key={s.key} className="flex items-center gap-3">
              <span style={{ width: 16, fontSize: 13, color: "rgba(248,245,240,0.85)" }}>{s.icon}</span>
              <span className="text-[11px]" style={{ width: 110, color: "rgba(248,245,240,0.78)" }}>
                {s.label}
              </span>
              <input
                type="range"
                min={0}
                max={100}
                value={s.val}
                onChange={(e) => s.set(+e.target.value)}
                className="fy-slider light flex-1"
                style={{ background: "rgba(248,245,240,0.22)" }}
              />
              <span
                className="text-[10px]"
                style={{
                  width: 24,
                  textAlign: "right",
                  color: "rgba(248,245,240,0.55)",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {s.val}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Floating CTA */}
      <div className="absolute right-6 bottom-6">
        <button
          onClick={() => setStep("insights")}
          className="rounded-full font-medium"
          style={{
            height: 40,
            padding: "0 18px",
            background: "rgba(248,245,240,0.95)",
            color: "#2A2826",
            fontSize: 12,
            letterSpacing: "0.04em",
          }}
        >
          See your insights →
        </button>
      </div>
    </div>
  );
}
