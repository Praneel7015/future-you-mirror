"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useMirror, careScore, findClosestPhoto } from "@/lib/store";
import type { SimulateResponse } from "@/app/api/simulate/route";

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

  const [simUrl, setSimUrl] = useState<string | null>(null);
  const [simLoading, setSimLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSimKey = useRef<string>("");

  const photo = useMemo(() => {
    if (!result) return null;
    return findClosestPhoto(result.aging.photos, scrubAge);
  }, [result, scrubAge]);

  // Build simulation params from lifestyle sliders (all values 0–1).
  // High slider = better habit: sun=high means good sun protection.
  // Each param = how much to improve that concern on the WITH CARE side.
  const simParams = useMemo(() => ({
    radiance: (hyd * 0.4 + routine * 0.3 + sleepVal * 0.3) / 100,
    wrinkles: (routine * 0.5 + hyd * 0.3 + sleepVal * 0.2) / 100,
    spots: (sun * 0.5 + routine * 0.3 + hyd * 0.2) / 100,
    eye_bags: (sleepVal * 0.7 + hyd * 0.3) / 100,
    dark_circles: (sleepVal * 0.6 + hyd * 0.4) / 100,
    pores: (routine * 0.6 + hyd * 0.4) / 100,
    texture: (routine * 0.5 + hyd * 0.3 + sleepVal * 0.2) / 100,
    redness: (sun * 0.4 + hyd * 0.3 + routine * 0.3) / 100,
    oiliness: (routine * 0.5 + hyd * 0.3 + sleepVal * 0.2) / 100,
    acne: (routine * 0.5 + hyd * 0.3 + sleepVal * 0.2) / 100,
  }), [sun, hyd, sleepVal, routine]);

  // Call skin simulation when photo or sliders change (debounced)
  useEffect(() => {
    if (!photo) return;

    const key = `${photo.url}|${JSON.stringify(simParams)}`;
    if (key === lastSimKey.current) return;

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      lastSimKey.current = key;
      setSimLoading(true);
      try {
        const res = await fetch("/api/simulate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sourceUrl: photo.url, ...simParams }),
        });
        if (!res.ok) return;
        const data = (await res.json()) as SimulateResponse;
        setSimUrl(data.imageUrl);
      } catch {
        // silent — falls back to CSS filter
      } finally {
        setSimLoading(false);
      }
    }, 1200);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [photo, simParams]);

  // Reset sim when photo changes
  useEffect(() => {
    setSimUrl(null);
  }, [photo?.url]);

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
  const withoutIntensity = 0.4 + (withoutScore / 100) * 0.5;

  const sliders = [
    { key: "sun", label: "Sun protection", val: sun, set: setSun },
    { key: "hyd", label: "Hydration", val: hyd, set: setHyd },
    { key: "sleep", label: "Sleep quality", val: sleepVal, set: setSleep },
    { key: "routine", label: "Skincare routine", val: routine, set: setRoutine },
  ];

  return (
    <div
      className="flex-1 flex flex-col w-full"
      style={{ background: "#1a1612", minHeight: "100vh" }}
    >
      {/* Age scrubber */}
      <div className="px-6 pt-12 w-full">
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
            className="text-[10px]"
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
          className="fy-scrub light w-full mt-3"
        />

        <div
          className="flex justify-between mt-1.5 text-[9px]"
          style={{ letterSpacing: "0.18em", color: "rgba(248,245,240,0.38)" }}
        >
          <span>{ageMin}</span>
          <span>{Math.round(ageMin + (ageMax - ageMin) / 3)}</span>
          <span>{Math.round(ageMin + (2 * (ageMax - ageMin)) / 3)}</span>
          <span>{ageMax}</span>
        </div>
      </div>

      {/* Split portrait */}
      <div className="relative w-full mt-6" style={{ height: 400, overflow: "hidden" }}>
        {/* WITH CARE — left half */}
        <div className="absolute top-0 left-0 bottom-0 overflow-hidden" style={{ width: "50%" }}>
          {photo && (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={simUrl ?? photo.url}
              alt="With care"
              className="absolute object-cover"
              style={{
                width: "200%",
                height: "100%",
                left: 0,
                top: 0,
                objectPosition: "center 25%",
                // Warm filter while sim loading; no filter once sim image is shown
                filter: simUrl
                  ? "brightness(1.04) saturate(1.08)"
                  : `brightness(${1.02}) contrast(0.96) saturate(1.08)`,
                transition: "filter 700ms ease, opacity 600ms ease",
                opacity: simLoading && !simUrl ? 0.7 : 1,
              }}
            />
          )}
          {/* Warm glow overlay */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "radial-gradient(80% 60% at 50% 35%, rgba(245,212,184,0.22), transparent 70%), linear-gradient(180deg, rgba(245,212,184,0.12) 0%, rgba(245,212,184,0.04) 100%)",
              mixBlendMode: "soft-light",
            }}
          />
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: "linear-gradient(180deg, rgba(0,0,0,0) 60%, rgba(26,22,18,0.6) 100%)",
            }}
          />
          {/* Loading shimmer */}
          {simLoading && !simUrl && (
            <div
              className="absolute inset-0 pointer-events-none"
              style={{ background: "rgba(245,212,184,0.08)", animation: "breathe 2s ease-in-out infinite" }}
            />
          )}
        </div>

        {/* WITHOUT — right half */}
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
                filter: `brightness(${0.92 - withoutIntensity * 0.15}) contrast(${1.05 + withoutIntensity * 0.08}) saturate(${0.78 - withoutIntensity * 0.26}) sepia(${0.05 + withoutIntensity * 0.20})`,
                transition: "filter 700ms ease",
              }}
            />
          )}
          {/* Age/damage overlays */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `radial-gradient(60% 50% at 50% 40%, rgba(201,181,143,${0.14 + withoutIntensity * 0.14}), transparent 70%), linear-gradient(180deg, rgba(201,181,143,${0.18 + withoutIntensity * 0.18}) 0%, rgba(74,66,52,${0.22 + withoutIntensity * 0.18}) 100%)`,
              mixBlendMode: "multiply",
              transition: "background 700ms ease",
            }}
          />
          {/* Spot texture */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage:
                "radial-gradient(circle at 30% 38%, rgba(120,98,72,0.22) 0, transparent 1.4%)," +
                "radial-gradient(circle at 62% 44%, rgba(120,98,72,0.18) 0, transparent 1.6%)," +
                "radial-gradient(circle at 44% 58%, rgba(120,98,72,0.14) 0, transparent 1.2%)," +
                "radial-gradient(circle at 70% 62%, rgba(120,98,72,0.18) 0, transparent 1.3%)",
              mixBlendMode: "multiply",
              opacity: 0.35 + withoutIntensity * 0.55,
              transition: "opacity 700ms ease",
            }}
          />
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: "linear-gradient(180deg, rgba(0,0,0,0) 60%, rgba(26,22,18,0.6) 100%)" }}
          />
        </div>

        {/* center hairline */}
        <div
          className="absolute top-0 bottom-0 pointer-events-none"
          style={{
            left: "50%",
            width: 1,
            transform: "translateX(-0.5px)",
            background:
              "linear-gradient(180deg, rgba(248,245,240,0) 0%, rgba(248,245,240,0.5) 25%, rgba(248,245,240,0.5) 75%, rgba(248,245,240,0) 100%)",
          }}
        />

        {/* labels */}
        <div className="absolute bottom-4 left-0 right-0 flex pointer-events-none">
          <div
            className="flex-1 text-center text-[9px]"
            style={{ letterSpacing: "0.28em", color: "rgba(248,245,240,0.9)", fontWeight: 500 }}
          >
            WITH CARE
          </div>
          <div
            className="flex-1 text-center text-[9px]"
            style={{ letterSpacing: "0.28em", color: "rgba(248,245,240,0.9)", fontWeight: 500 }}
          >
            WITHOUT
          </div>
        </div>
      </div>

      {/* Lifestyle sliders */}
      <div className="w-full px-6 pt-5 pb-4">
        <div className="flex items-center justify-between mb-4">
          <div className="text-[10px] uppercase" style={{ letterSpacing: "0.28em", color: "rgba(248,245,240,0.55)" }}>
            Lifestyle
          </div>
          <div className="text-[10px]" style={{ color: "rgba(248,245,240,0.4)", fontStyle: "italic" }}>
            drag to feel the difference
          </div>
        </div>

        <div className="space-y-4">
          {sliders.map((s) => (
            <div key={s.key}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px]" style={{ color: "rgba(248,245,240,0.75)", letterSpacing: "0.04em" }}>
                  {s.label}
                </span>
                <span
                  className="text-[10px]"
                  style={{
                    color: "rgba(248,245,240,0.5)",
                    fontVariantNumeric: "tabular-nums",
                    letterSpacing: "0.04em",
                  }}
                >
                  {s.val}
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={s.val}
                onChange={(e) => s.set(+e.target.value)}
                className="fy-slider light w-full"
              />
            </div>
          ))}
        </div>

        {/* CTA — inline below sliders */}
        <div className="mt-6 flex items-center justify-between">
          <div className="text-[10px]" style={{ color: "rgba(248,245,240,0.38)", fontStyle: "italic", letterSpacing: "0.04em" }}>
            {simLoading ? "Simulating your care path…" : simUrl ? "AI skin simulation applied" : ""}
          </div>
          <button
            onClick={() => setStep("insights")}
            className="rounded-full font-medium"
            style={{
              height: 40,
              padding: "0 20px",
              background: "rgba(248,245,240,0.92)",
              color: "#2A2826",
              fontSize: 12,
              letterSpacing: "0.04em",
            }}
          >
            See your insights →
          </button>
        </div>
      </div>
    </div>
  );
}
