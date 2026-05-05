"use client";

import { useEffect, useState } from "react";
import type { ClimateResponse } from "@/app/api/climate/route";

function SunGlyph({ size = 32 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      stroke="#A78B71"
      strokeWidth="1.25"
      strokeLinecap="round"
    >
      <circle cx="16" cy="16" r="5" />
      <circle cx="16" cy="16" r="9" strokeOpacity="0.35" />
      {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => {
        const rad = (deg * Math.PI) / 180;
        const x1 = 16 + Math.cos(rad) * 12;
        const y1 = 16 + Math.sin(rad) * 12;
        const x2 = 16 + Math.cos(rad) * 14.5;
        const y2 = 16 + Math.sin(rad) * 14.5;
        return <line key={deg} x1={x1} y1={y1} x2={x2} y2={y2} />;
      })}
    </svg>
  );
}

function ParticulateGlyph({ size = 28 }: { size?: number }) {
  const dots: [number, number, number][] = [
    [10, 12, 1],
    [16, 9, 0.7],
    [22, 12, 1],
    [13, 17, 0.8],
    [19, 17, 1],
    [24, 18, 0.7],
    [11, 22, 0.9],
    [17, 23, 1.2],
    [23, 23, 0.8],
  ];
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      {dots.map(([x, y, r], i) => (
        <circle key={i} cx={x} cy={y} r={r} fill="#A78B71" opacity={0.7} />
      ))}
    </svg>
  );
}

function monthName() {
  return new Date().toLocaleString("en-US", { month: "long" });
}

function spelled(n: number): string {
  const words = [
    "zero",
    "one",
    "two",
    "three",
    "four",
    "five",
    "six",
    "seven",
    "eight",
    "nine",
    "ten",
    "eleven",
    "twelve",
    "thirteen",
    "fourteen",
    "fifteen",
    "sixteen",
    "seventeen",
    "eighteen",
    "nineteen",
    "twenty",
  ];
  return words[n] ?? String(n);
}

export default function ClimateCard() {
  const [data, setData] = useState<ClimateResponse | null>(null);
  const [errored, setErrored] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/climate")
      .then((r) => r.json())
      .then((j: ClimateResponse | { error: string }) => {
        if (cancelled) return;
        if ("error" in j) {
          setErrored(true);
        } else {
          setData(j);
        }
      })
      .catch(() => {
        if (!cancelled) setErrored(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (errored || !data) {
    // Quietly omit when we can't get climate. Avoids a broken card.
    return null;
  }

  // Rough multiplier: every UV point above 6 ~+2% faster aging vs global mean (~5).
  const uvFasterPct = Math.max(0, Math.round((data.uv - 5) * 2));
  const fasterWord = spelled(uvFasterPct);

  return (
    <div>
      <div
        style={{
          padding: "20px 20px 18px",
          background: "linear-gradient(180deg, #FBF7F0 0%, #F4ECDF 100%)",
          border: "1px solid rgba(167,139,113,0.30)",
          borderRadius: 14,
        }}
      >
        <div
          style={{
            display: "flex",
            gap: 14,
            alignItems: "center",
            marginBottom: 16,
          }}
        >
          <SunGlyph size={32} />
          <div style={{ width: 1, height: 24, background: "rgba(42,40,38,0.18)" }} />
          <ParticulateGlyph size={28} />
          <div style={{ marginLeft: "auto" }}>
            <div
              className="text-[10px] uppercase"
              style={{
                letterSpacing: "0.28em",
                color: "rgba(42,40,38,0.55)",
                fontStyle: "italic",
              }}
            >
              Your climate
            </div>
          </div>
        </div>
        <div
          style={{
            fontFamily: "var(--font-serif)",
            fontSize: 17,
            lineHeight: 1.4,
            fontWeight: 400,
            textWrap: "pretty" as const,
          }}
        >
          <span style={{ fontVariantNumeric: "tabular-nums" }}>{data.city}</span> sits at UV{" "}
          <span style={{ fontVariantNumeric: "tabular-nums" }}>{data.uv}</span> today.
          {uvFasterPct > 0 ? (
            <>
              {" "}
              Skin here ages{" "}
              <span style={{ fontStyle: "italic", color: "#A78B71" }}>
                {fasterWord} percent faster
              </span>{" "}
              than the global mean.
            </>
          ) : (
            <>
              {" "}
              <span style={{ fontStyle: "italic", color: "#A78B71" }}>
                Gentle on your skin
              </span>{" "}
              compared to the global mean.
            </>
          )}
        </div>
        <div className="my-4" style={{ height: 1, background: "rgba(42,40,38,0.12)" }} />
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          {[
            { l: "UV INDEX", v: String(data.uv) },
            { l: "HUMIDITY", v: `${data.humidity}%` },
            { l: "AIR PM2.5", v: String(data.pm25) },
          ].map((s) => (
            <div key={s.l} style={{ textAlign: "center", flex: 1 }}>
              <div
                className="text-[9px] uppercase"
                style={{
                  letterSpacing: "0.22em",
                  color: "rgba(42,40,38,0.55)",
                }}
              >
                {s.l}
              </div>
              <div
                style={{
                  fontFamily: "var(--font-serif)",
                  fontSize: 22,
                  fontWeight: 400,
                  marginTop: 3,
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {s.v}
              </div>
            </div>
          ))}
        </div>
      </div>
      <div
        className="mt-4 text-center"
        style={{
          fontFamily: "var(--font-serif)",
          fontStyle: "italic",
          fontSize: 14,
          color: "#A78B71",
        }}
      >
        This is why your routine should change in {monthName()}.
      </div>
    </div>
  );
}
