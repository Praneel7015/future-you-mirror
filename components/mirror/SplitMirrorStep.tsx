"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useMirror, findClosestPhoto } from "@/lib/store";
import type { SimulateResponse } from "@/app/api/simulate/route";
import { MONTH_CHOICES, simIntensitiesFor } from "@/lib/month-change";
import { monthSuggestion, type Citation } from "@/lib/recommendations";
import { plainSimulateFailure } from "@/lib/plain-errors";
import { isSamplePhotoSource } from "@/lib/simulate-plan";
import { earlierTimelineAge } from "@/lib/stated-age";

function CitationLinks({ citations }: { citations: Citation[] }) {
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
              color: "#F5D4B8",
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

export default function SplitMirrorStep() {
  const params = useSearchParams();
  const isDemo = params.get("demo") === "true";
  const result = useMirror((s) => s.result);
  const setStep = useMirror((s) => s.setStep);

  const scrubAge = useMirror((s) => s.scrubAge);
  const setScrubAge = useMirror((s) => s.setScrubAge);

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

  const earlier = useMemo(() => {
    if (!result || !photo) return photo;
    const target = earlierTimelineAge(scrubAge, result.aging.ageMin);
    return findClosestPhoto(result.aging.photos, target) ?? photo;
  }, [result, photo, scrubAge]);

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
  const careSourceUrl = useBaked ? (earlier?.url ?? photo?.url) : photo?.url;

  useEffect(() => {
    if (!photo || !careSourceUrl) return;
    if (!useBaked && !simParams) {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      return;
    }

    const key = `${careSourceUrl}|${useBaked ? "demo" : JSON.stringify(simParams)}`;
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
              ? { sourceUrl: careSourceUrl, demo: true }
              : { sourceUrl: careSourceUrl, ...simParams },
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
  }, [photo, careSourceUrl, simParams, useBaked]);

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

  const ageMin = result.aging.ageMin;
  const ageMax = result.aging.ageMax;

  return (
    <div className="min-h-dvh w-full flex justify-center" style={{ background: "#1a1612" }}>
    <div
      className="flex-1 flex flex-col w-full max-w-[440px]"
      style={{ minHeight: "100dvh" }}
    >
      {/* Age scrubber */}
      <div
        className="px-6 w-full"
        style={{ paddingTop: "max(48px, env(safe-area-inset-top))" }}
      >
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
        <p
          className="mt-4"
          style={{
            fontFamily: "var(--font-serif)",
            fontStyle: "italic",
            fontSize: 16,
            lineHeight: 1.4,
            color: "rgba(248,245,240,0.84)",
          }}
        >
          Drag the line. The picture moves through the ages.
        </p>
      </div>

      {/* Split portrait */}
      <div className="relative w-full mt-6" style={{ height: 480, overflow: "hidden" }}>
        {/* WITH CARE — left half */}
        <div className="absolute top-0 left-0 bottom-0 overflow-hidden" style={{ width: "50%" }}>
          {photo && (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={simUrl ?? earlier?.url ?? photo.url}
              alt="With care"
              className="absolute object-cover"
              style={{
                width: "200%",
                height: "100%",
                left: 0,
                top: 0,
                objectPosition: "center 18%",
                opacity: simLoading && !simUrl ? 0.7 : 1,
                transition: "opacity 600ms ease",
              }}
            />
          )}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: "linear-gradient(180deg, rgba(0,0,0,0) 72%, rgba(26,22,18,0.55) 100%)" }}
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
                objectPosition: "center 18%",
              }}
            />
          )}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: "linear-gradient(180deg, rgba(0,0,0,0) 72%, rgba(26,22,18,0.55) 100%)" }}
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

      <div
        className="w-full px-6 pt-6"
        style={{ paddingBottom: "max(32px, calc(env(safe-area-inset-bottom) + 24px))" }}
      >
        <div
          className="text-[10px] uppercase"
          style={{ letterSpacing: "0.28em", color: "rgba(248,245,240,0.55)" }}
        >
          One change this month
        </div>
        <h2
          className="mt-2"
          style={{
            fontFamily: "var(--font-serif)",
            fontWeight: 400,
            fontSize: 26,
            lineHeight: 1.15,
            color: "#F8F5F0",
          }}
        >
          Which one feels possible?
        </h2>

        <div className="mt-4 flex flex-col gap-3">
          {MONTH_CHOICES.map((choice) => {
            const selected = monthChange === choice.id;
            return (
              <button
                key={choice.id}
                type="button"
                aria-pressed={selected}
                onClick={() => setMonthChange(choice.id)}
                className="w-full rounded-2xl text-left"
                style={{
                  minHeight: 56,
                  padding: "14px 16px",
                  fontFamily: "var(--font-serif)",
                  fontSize: 18,
                  lineHeight: 1.25,
                  background: selected ? "#F5D4B8" : "rgba(248,245,240,0.06)",
                  color: selected ? "#2A2826" : "#F8F5F0",
                  border: selected ? "1px solid #F5D4B8" : "1px solid rgba(248,245,240,0.18)",
                }}
              >
                {choice.label}
              </button>
            );
          })}
        </div>

        {suggestion && (
          <div
            className="mt-4 rounded-2xl"
            style={{
              padding: "16px",
              background: "rgba(248,245,240,0.06)",
              border: "1px solid rgba(248,245,240,0.12)",
            }}
          >
            <div
              style={{
                fontFamily: "var(--font-serif)",
                fontStyle: "italic",
                fontSize: 18,
                color: "#F5D4B8",
              }}
            >
              {suggestion.title}
            </div>
            <p className="mt-2 text-[14px] leading-relaxed" style={{ color: "rgba(248,245,240,0.84)" }}>
              {suggestion.body}
            </p>
            {suggestion.productType && (
              <p className="mt-3 text-[13px]" style={{ color: "rgba(248,245,240,0.72)" }}>
                Product: {suggestion.productType}
              </p>
            )}
            <CitationLinks citations={suggestion.citations} />
          </div>
        )}

        {simError && (
          <p
            role="alert"
            className="mt-5 text-[13px] leading-snug"
            style={{ color: "#F5D4B8", fontFamily: "var(--font-serif)", fontStyle: "italic" }}
          >
            {simError}
          </p>
        )}

        <p
          className="mt-6 text-[13px] leading-snug"
          style={{ color: "rgba(248,245,240,0.62)", fontFamily: "var(--font-serif)", fontStyle: "italic", minHeight: 20 }}
        >
          {simLoading
            ? useBaked
              ? "Loading the sample with-care photo…"
              : "Making the with-care photo…"
            : simError
              ? "Simulation did not run."
              : simMode === "live" && simUrl
                ? "With care is the picture Perfect Corp made. Without is this age."
                : earlier?.url === photo?.url
                  ? "This is the earliest picture on the timeline."
                  : "With care is an earlier picture on this timeline. Without is this age."}
        </p>
        <button
          onClick={() => setStep("insights")}
          className="mt-4 w-full rounded-full font-medium"
          style={{
            height: 56,
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
    </div>
  );
}
