"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useMirror, findClosestPhoto } from "@/lib/store";
import type { SimulateResponse } from "@/app/api/simulate/route";
import { applyLifestyleDeltas, withoutOverlayIntensities } from "@/lib/lifestyle-deltas";

type ToggleMode = "current" | "today";

function spelled(n: number): string {
  const words = [
    "zero", "one", "two", "three", "four", "five", "six", "seven", "eight",
    "nine", "ten", "eleven", "twelve",
  ];
  return words[n] ?? String(n);
}

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

  const [mode, setMode] = useState<ToggleMode>("current");
  const isToday = mode === "today";

  // Effective sliders — when "today" is on, all habits are maxed (100)
  const effSun = isToday ? 100 : sun;
  const effHyd = isToday ? 100 : hyd;
  const effSleep = isToday ? 100 : sleepVal;
  const effRoutine = isToday ? 100 : routine;

  const [simUrl, setSimUrl] = useState<string | null>(null);
  const [simLoading, setSimLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSimKey = useRef<string>("");

  const photo = useMemo(() => {
    if (!result) return null;
    return findClosestPhoto(result.aging.photos, scrubAge);
  }, [result, scrubAge]);

  const simParams = useMemo(() => ({
    radiance: (effHyd * 0.4 + effRoutine * 0.3 + effSleep * 0.3) / 100,
    wrinkles: (effRoutine * 0.5 + effHyd * 0.3 + effSleep * 0.2) / 100,
    spots: (effSun * 0.5 + effRoutine * 0.3 + effHyd * 0.2) / 100,
    eye_bags: ((effSleep * 0.7 + effHyd * 0.3) / 100) * 0.2,
    dark_circles: ((effSleep * 0.6 + effHyd * 0.4) / 100) * 0.2,
    pores: (effRoutine * 0.6 + effHyd * 0.4) / 100,
    texture: (effRoutine * 0.5 + effHyd * 0.3 + effSleep * 0.2) / 100,
    redness: (effSun * 0.4 + effHyd * 0.3 + effRoutine * 0.3) / 100,
    oiliness: (effRoutine * 0.5 + effHyd * 0.3 + effSleep * 0.2) / 100,
    acne: (effRoutine * 0.5 + effHyd * 0.3 + effSleep * 0.2) / 100,
  }), [effSun, effHyd, effSleep, effRoutine]);

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

  useEffect(() => {
    setSimUrl(null);
  }, [photo?.url]);

  const savedYears = useMemo(() => {
    const avg = (sun + hyd + sleepVal + routine) / 4;
    return Math.max(0, Math.round(((100 - avg) / 100) * 12));
  }, [sun, hyd, sleepVal, routine]);

  const ov = useMemo(() => {
    if (!result) return { spots: 0.5, underEye: 0.5, texture: 0.5, dullness: 0.5, redness: 0.3 };
    const adjusted = applyLifestyleDeltas(result.skin.concerns, {
      sun: effSun,
      hyd: effHyd,
      sleep: effSleep,
      routine: effRoutine,
    });
    return withoutOverlayIntensities(adjusted);
  }, [result, effSun, effHyd, effSleep, effRoutine]);

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
          aria-label="Age"
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
                filter: simUrl
                  ? "brightness(1.04) saturate(1.08)"
                  : `brightness(${1.02}) contrast(0.96) saturate(1.08)`,
                transition: "filter 700ms ease, opacity 600ms ease",
                opacity: simLoading && !simUrl ? 0.7 : 1,
              }}
            />
          )}
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
                filter: `brightness(${(0.96 - ov.dullness * 0.18).toFixed(3)}) contrast(${(1.02 + ov.texture * 0.10).toFixed(3)}) saturate(${(0.85 - ov.dullness * 0.28).toFixed(3)}) sepia(${(0.04 + ov.redness * 0.18).toFixed(3)})`,
                transition: "filter 700ms ease",
              }}
            />
          )}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `radial-gradient(60% 50% at 50% 40%, rgba(201,181,143,${(0.10 + ov.texture * 0.18).toFixed(3)}), transparent 70%), linear-gradient(180deg, rgba(201,181,143,${(0.14 + ov.dullness * 0.20).toFixed(3)}) 0%, rgba(74,66,52,${(0.18 + ov.texture * 0.20).toFixed(3)}) 100%)`,
              mixBlendMode: "multiply",
              transition: "background 700ms ease",
            }}
          />
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage:
                "radial-gradient(circle at 30% 38%, rgba(120,98,72,0.22) 0, transparent 1.4%)," +
                "radial-gradient(circle at 62% 44%, rgba(120,98,72,0.18) 0, transparent 1.6%)," +
                "radial-gradient(circle at 44% 58%, rgba(120,98,72,0.14) 0, transparent 1.2%)," +
                "radial-gradient(circle at 70% 62%, rgba(120,98,72,0.18) 0, transparent 1.3%)",
              mixBlendMode: "multiply",
              opacity: 0.25 + ov.spots * 0.60,
              transition: "opacity 700ms ease",
            }}
          />
          <div
            className="absolute pointer-events-none"
            style={{
              left: "10%", right: "10%",
              top: "32%", height: "12%",
              background: `radial-gradient(ellipse at 50% 40%, rgba(60,44,30,${(ov.underEye * 0.38).toFixed(3)}) 0%, transparent 70%)`,
              mixBlendMode: "multiply",
              transition: "background 700ms ease",
            }}
          />
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: "linear-gradient(180deg, rgba(0,0,0,0) 60%, rgba(26,22,18,0.6) 100%)" }}
          />
        </div>

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

      {/* Started-today toggle */}
      <div className="w-full px-6 pt-6">
        <div className="flex justify-center">
          <div
            style={{
              position: "relative",
              width: 280,
              height: 44,
              borderRadius: 999,
              background: "rgba(248,245,240,0.10)",
              border: "1px solid rgba(248,245,240,0.18)",
              padding: 3,
            }}
          >
            <div
              style={{
                position: "absolute",
                top: 3,
                bottom: 3,
                left: isToday ? 137 : 3,
                width: 137,
                borderRadius: 999,
                background: isToday ? "#F5D4B8" : "#F8F5F0",
                transition: "left 280ms cubic-bezier(0.16, 1, 0.3, 1), background 400ms ease",
              }}
            />
            <div
              style={{
                position: "relative",
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                height: "100%",
              }}
            >
              <button
                onClick={() => setMode("current")}
                style={{
                  fontSize: 12,
                  letterSpacing: "0.02em",
                  color: !isToday ? "#2A2826" : "rgba(248,245,240,0.65)",
                  fontWeight: 500,
                  transition: "color 400ms ease",
                }}
              >
                Current path
              </button>
              <button
                onClick={() => setMode("today")}
                style={{
                  fontSize: 12,
                  letterSpacing: "0.02em",
                  color: isToday ? "#2A2826" : "rgba(248,245,240,0.65)",
                  fontWeight: 500,
                  transition: "color 400ms ease",
                }}
              >
                If you started today
              </button>
            </div>
          </div>
        </div>

        <div className="relative mt-4 text-center" style={{ height: 24 }}>
          <div
            className="absolute inset-x-0"
            style={{
              fontFamily: "var(--font-serif)",
              fontStyle: "italic",
              fontSize: 16,
              color: "#F5D4B8",
              opacity: isToday ? 1 : 0,
              transition: "opacity 500ms ease 200ms",
            }}
          >
            You&apos;d save{" "}
            <span style={{ fontVariantNumeric: "tabular-nums" }}>{spelled(savedYears)}</span> years.
          </div>
          <div
            className="absolute inset-x-0"
            style={{
              fontFamily: "var(--font-serif)",
              fontStyle: "italic",
              fontSize: 16,
              color: "rgba(248,245,240,0.5)",
              opacity: isToday ? 0 : 1,
              transition: "opacity 500ms ease",
            }}
          >
            The path you&apos;re walking now.
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
            {isToday ? "locked at ideal" : "drag to feel the difference"}
          </div>
        </div>

        <div className="space-y-4" style={{ opacity: isToday ? 0.45 : 1, transition: "opacity 400ms ease" }}>
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
                  {isToday ? 100 : s.val}
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={isToday ? 100 : s.val}
                onChange={(e) => s.set(+e.target.value)}
                className="fy-slider light w-full"
                aria-label={s.label}
                disabled={isToday}
              />
            </div>
          ))}
        </div>

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
