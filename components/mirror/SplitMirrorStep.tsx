"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useMirror, findClosestPhoto } from "@/lib/store";
import type { SimulateResponse } from "@/app/api/simulate/route";
import { applyLifestyleDeltas, withoutOverlayIntensities } from "@/lib/lifestyle-deltas";
import { MONTH_CHOICES, simIntensitiesFor } from "@/lib/month-change";
import { monthSuggestion, type Citation } from "@/lib/recommendations";
import { QuietChoice } from "@/components/mirror/QuietChoice";
import { plainSimulateFailure } from "@/lib/plain-errors";
import { isSamplePhotoSource } from "@/lib/simulate-plan";

function CitationLinks({ citations }: { citations: Citation[] }) {
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
              color: "#F5D4B8",
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

export default function SplitMirrorStep() {
  const params = useSearchParams();
  const isDemo = params.get("demo") === "true";
  const result = useMirror((s) => s.result);
  const setStep = useMirror((s) => s.setStep);

  const scrubAge = useMirror((s) => s.scrubAge);
  const setScrubAge = useMirror((s) => s.setScrubAge);

  const sun = useMirror((s) => s.sun);
  const hyd = useMirror((s) => s.hyd);
  const sleepVal = useMirror((s) => s.sleep);
  const routine = useMirror((s) => s.routine);
  const monthChange = useMirror((s) => s.monthChange);
  const setMonthChange = useMirror((s) => s.setMonthChange);

  const [simUrl, setSimUrl] = useState<string | null>(null);
  const [simMode, setSimMode] = useState<"demo" | "live" | null>(null);
  const [simError, setSimError] = useState<string | null>(null);
  const [simLoading, setSimLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSimKey = useRef<string>("");
  const requestGen = useRef(0);
  const prevPhotoUrlRef = useRef<string | undefined>(undefined);

  const photo = useMemo(() => {
    if (!result) return null;
    return findClosestPhoto(result.aging.photos, scrubAge);
  }, [result, scrubAge]);

  const photoUrl = photo?.url;
  if (photoUrl !== prevPhotoUrlRef.current) {
    prevPhotoUrlRef.current = photoUrl;
    if (simUrl !== null) setSimUrl(null);
    if (simMode !== null) setSimMode(null);
    if (simError !== null) setSimError(null);
  }

  const simParams = useMemo(
    () => (monthChange ? simIntensitiesFor(monthChange) : null),
    [monthChange],
  );

  const useBaked = Boolean(photo && (isDemo || isSamplePhotoSource(photo.url)));

  useEffect(() => {
    if (!photo) return;
    if (!useBaked && !simParams) {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      return;
    }

    const key = `${photo.url}|${useBaked ? "demo" : JSON.stringify(simParams)}`;
    if (key === lastSimKey.current) return;

    if (debounceRef.current) clearTimeout(debounceRef.current);
    const gen = ++requestGen.current;
    debounceRef.current = setTimeout(async () => {
      lastSimKey.current = key;
      setSimLoading(true);
      setSimError(null);
      try {
        const res = await fetch(useBaked ? "/api/simulate?demo=true" : "/api/simulate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(
            useBaked || !simParams
              ? { sourceUrl: photo.url, demo: true }
              : { sourceUrl: photo.url, ...simParams },
          ),
        });
        if (gen !== requestGen.current) return;
        const data = (await res.json()) as Partial<SimulateResponse> & { error?: string; message?: string };
        if (!res.ok || !data.imageUrl) {
          setSimUrl(null);
          setSimMode(null);
          setSimError(plainSimulateFailure(data.error, data.message));
          return;
        }
        setSimUrl(data.imageUrl);
        setSimMode(data.mode ?? (useBaked ? "demo" : "live"));
        setSimError(null);
      } catch {
        if (gen !== requestGen.current) return;
        setSimUrl(null);
        setSimMode(null);
        setSimError(plainSimulateFailure("simulation_failed", "The request did not finish."));
      } finally {
        if (gen === requestGen.current) setSimLoading(false);
      }
    }, useBaked ? 250 : 1200);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [photo, simParams, useBaked]);

  const ov = useMemo(() => {
    if (!result) return { spots: 0.5, underEye: 0.5, texture: 0.5, dullness: 0.5, redness: 0.3 };
    const adjusted = applyLifestyleDeltas(result.skin.concerns, {
      sun,
      hyd,
      sleep: sleepVal,
      routine,
    });
    return withoutOverlayIntensities(adjusted);
  }, [result, sun, hyd, sleepVal, routine]);

  const suggestion = monthChange ? monthSuggestion(monthChange) : null;

  if (!result) {
    return (
      <div className="flex-1 flex items-center justify-center" style={{ minHeight: "100dvh" }}>
        <div className="font-serif text-lg" style={{ color: "rgba(248,245,240,0.6)" }}>
          No reading yet.
        </div>
      </div>
    );
  }

  const ageMin = Math.max(25, result.aging.ageMin);
  const ageMax = result.aging.ageMax;

  return (
    <div
      className="flex-1 flex flex-col w-full"
      style={{
        background: "#1a1612",
        height: "100%",
        minHeight: 0,
        overflow: "hidden",
        paddingTop: "env(safe-area-inset-top)",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      {/* Age scrubber */}
      <div className="w-full shrink-0 px-5 pt-3">
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
                fontSize: 36,
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
      <div className="relative mt-2 min-h-0 w-full flex-1" style={{ overflow: "hidden" }}>
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
                filter: simUrl ? "brightness(1.04) saturate(1.08)" : "none",
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
            {simError ? "NOT SIMULATED" : "WITH CARE"}
          </div>
          <div
            className="flex-1 text-center text-[9px]"
            style={{ letterSpacing: "0.28em", color: "rgba(248,245,240,0.9)", fontWeight: 500 }}
          >
            WITHOUT
          </div>
        </div>
      </div>

      <div className="w-full shrink-0 px-5 pb-3 pt-3">
        <div
          className="text-[10px] uppercase"
          style={{ letterSpacing: "0.28em", color: "rgba(248,245,240,0.55)" }}
        >
          One change this month
        </div>
        <h2
          className="mt-1"
          style={{
            fontFamily: "var(--font-serif)",
            fontWeight: 400,
            fontSize: 22,
            lineHeight: 1.1,
            color: "#F8F5F0",
          }}
        >
          Which one feels possible?
        </h2>

        <div className="mt-1">
          {MONTH_CHOICES.map((choice) => (
            <QuietChoice
              key={choice.id}
              label={choice.label}
              selected={monthChange === choice.id}
              onClick={() => setMonthChange(choice.id)}
            />
          ))}
        </div>

        {suggestion && (
          <div className="mt-3" style={{ borderTop: "1px solid rgba(248,245,240,0.12)", paddingTop: 8 }}>
            <div
              style={{
                fontFamily: "var(--font-serif)",
                fontStyle: "italic",
                fontSize: 16,
                color: "#F5D4B8",
              }}
            >
              {suggestion.title}
            </div>
            <p
              className="mt-1 line-clamp-2 text-[13px] leading-snug"
              style={{ color: "rgba(248,245,240,0.84)" }}
            >
              {suggestion.body}
            </p>
            {suggestion.productType && (
              <p className="mt-1 text-[12px]" style={{ color: "rgba(248,245,240,0.72)" }}>
                Product: {suggestion.productType}
              </p>
            )}
            <CitationLinks citations={suggestion.citations} />
          </div>
        )}

        {simError && (
          <p
            role="alert"
            className="mt-2 line-clamp-2 text-[13px] leading-snug"
            style={{ color: "#F5D4B8", fontFamily: "var(--font-serif)", fontStyle: "italic" }}
          >
            {simError}
          </p>
        )}

        <p
          className="mt-2 line-clamp-2 text-[12px] leading-snug"
          style={{ color: "rgba(248,245,240,0.62)", fontFamily: "var(--font-serif)", fontStyle: "italic", minHeight: 20 }}
        >
          {simLoading
            ? useBaked
              ? "Loading the sample with-care photo…"
              : "Making the with-care photo…"
            : simError
              ? "Simulation did not run."
              : simMode === "demo"
                ? "Sample photo. Perfect Corp was not called."
                : simMode === "live"
                  ? "With-care photo from Perfect Corp."
                  : useBaked
                    ? ""
                    : "Pick one change. Then we ask Perfect Corp for the with-care photo."}
        </p>
        <button
          onClick={() => setStep("insights")}
          className="mt-2 w-full shrink-0 rounded-full font-medium"
          style={{
            height: 48,
            background: "rgba(248,245,240,0.92)",
            color: "#2A2826",
            fontSize: 15,
            letterSpacing: "0.02em",
          }}
        >
          See your insights
        </button>
      </div>
    </div>
  );
}
