"use client";

import { useState } from "react";
import { useMirror, findClosestPhoto } from "@/lib/store";

export default function ShareStep() {
  const result = useMirror((s) => s.result);
  const scrubAge = useMirror((s) => s.scrubAge);
  const setStep = useMirror((s) => s.setStep);
  const [copied, setCopied] = useState(false);

  if (!result) {
    return (
      <div className="flex-1 flex items-center justify-center" style={{ minHeight: "100vh" }}>
        <div className="font-serif text-lg" style={{ color: "rgba(42,40,38,0.5)" }}>
          No reading yet.
        </div>
      </div>
    );
  }

  const realAge = result.aging.currentAge ?? 30;
  const skinAge = result.skin.skinAge ?? realAge;
  const gap = Math.round(skinAge - realAge);
  const photo = findClosestPhoto(result.aging.photos, scrubAge);

  const onCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.origin);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  const onDownload = () => {
    const payload = {
      realAge,
      skinAge: Math.round(skinAge),
      skinGapYears: gap,
      concerns: result.skin.concerns,
      generatedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "future-you-reading.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex-1 flex flex-col px-6 pt-16 pb-12 max-w-md mx-auto w-full" style={{ minHeight: "100vh" }}>
      <button
        onClick={() => setStep("insights")}
        className="text-[10px] uppercase self-start mb-6"
        style={{ letterSpacing: "0.28em", color: "rgba(42,40,38,0.55)", fontStyle: "italic" }}
      >
        ← back
      </button>

      <div className="text-[10px] uppercase" style={{ letterSpacing: "0.28em", color: "rgba(42,40,38,0.55)", fontStyle: "italic" }}>
        Keep this
      </div>
      <h1
        className="mt-2"
        style={{
          fontFamily: "var(--font-serif)",
          fontSize: 28,
          lineHeight: 1.1,
          fontWeight: 400,
        }}
      >
        A composed card
        <br />
        <span style={{ color: "#A78B71", fontStyle: "italic" }}>of your reading.</span>
      </h1>

      {/* Share card preview */}
      <div className="flex-1 flex items-center justify-center">
        <div
          className="relative overflow-hidden"
          style={{
            width: 256,
            height: 320,
            borderRadius: 14,
            background: "#EFE6D8",
            boxShadow: "0 12px 28px -8px rgba(42,40,38,0.18), 0 4px 8px -4px rgba(42,40,38,0.08)",
          }}
        >
          {/* Mini split mirror */}
          <div className="absolute top-0 left-0 right-0 overflow-hidden" style={{ height: 200 }}>
            <div className="absolute top-0 left-0 bottom-0 overflow-hidden" style={{ width: "50%" }}>
              {photo && (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={photo.url}
                  alt=""
                  className="absolute object-cover"
                  style={{
                    width: "200%",
                    height: "100%",
                    left: 0,
                    top: 0,
                    objectPosition: "center 28%",
                    filter: "brightness(1.06) saturate(1.05) contrast(0.98)",
                  }}
                />
              )}
              <div
                className="absolute inset-0"
                style={{
                  background: "linear-gradient(180deg, rgba(245,212,184,0.18) 0%, rgba(245,212,184,0.04) 100%)",
                  mixBlendMode: "soft-light",
                }}
              />
            </div>
            <div className="absolute top-0 right-0 bottom-0 overflow-hidden" style={{ width: "50%" }}>
              {photo && (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={photo.url}
                  alt=""
                  className="absolute object-cover"
                  style={{
                    width: "200%",
                    height: "100%",
                    right: 0,
                    top: 0,
                    objectPosition: "center 28%",
                    filter: "brightness(0.86) saturate(0.7) contrast(1.04)",
                  }}
                />
              )}
              <div
                className="absolute inset-0"
                style={{
                  background: "linear-gradient(180deg, rgba(201,181,143,0.22) 0%, rgba(74,66,52,0.22) 100%)",
                  mixBlendMode: "multiply",
                }}
              />
            </div>
            <div
              className="absolute top-0 bottom-0"
              style={{ left: "50%", width: 1, background: "rgba(248,245,240,0.5)" }}
            />
            <div className="absolute bottom-2 left-0 right-0 flex">
              <div
                className="flex-1 text-center text-[8px]"
                style={{ letterSpacing: "0.18em", color: "#F8F5F0" }}
              >
                WITH CARE
              </div>
              <div
                className="flex-1 text-center text-[8px]"
                style={{ letterSpacing: "0.18em", color: "#F8F5F0" }}
              >
                WITHOUT
              </div>
            </div>
          </div>

          {/* Lower stat */}
          <div className="absolute left-0 right-0 bottom-0" style={{ top: 200, padding: "16px 18px" }}>
            <div className="flex items-end justify-between">
              <div>
                <div
                  className="text-[8px] uppercase"
                  style={{ letterSpacing: "0.28em", color: "rgba(42,40,38,0.55)" }}
                >
                  SKIN GAP
                </div>
                <div
                  style={{
                    fontFamily: "var(--font-serif)",
                    fontSize: 56,
                    lineHeight: 0.9,
                    fontWeight: 300,
                    color: "#2A2826",
                    letterSpacing: "-0.03em",
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {Math.abs(gap)}
                  <span style={{ fontSize: 22, color: "#A78B71" }}>yr</span>
                </div>
              </div>
              <div className="text-right">
                <div
                  style={{
                    fontFamily: "var(--font-serif)",
                    fontStyle: "italic",
                    fontSize: 11,
                    color: "rgba(42,40,38,0.65)",
                    lineHeight: 1.3,
                  }}
                >
                  My Future You
                  <br />
                  reading.
                </div>
              </div>
            </div>
            <div className="mt-3" style={{ height: 1, background: "rgba(42,40,38,0.12)" }} />
            <div className="text-[9px] mt-2 uppercase" style={{ letterSpacing: "0.18em", color: "rgba(42,40,38,0.5)" }}>
              FUTURE YOU MIRROR · EDITION 01
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mt-8">
        <button
          onClick={onDownload}
          className="rounded-full font-medium"
          style={{
            height: 52,
            fontSize: 14,
            letterSpacing: "0.02em",
            background: "#A78B71",
            color: "#FBF8F3",
          }}
        >
          Download
        </button>
        <button
          onClick={onCopyLink}
          className="rounded-full font-medium"
          style={{
            height: 52,
            fontSize: 14,
            letterSpacing: "0.02em",
            background: "transparent",
            color: "#2A2826",
            border: "1px solid rgba(42,40,38,0.15)",
          }}
        >
          {copied ? "Copied" : "Copy link"}
        </button>
      </div>
      <div
        className="text-center mt-4 text-[10px] uppercase"
        style={{ letterSpacing: "0.18em", color: "#6B5D52" }}
      >
        ⏤ HIPAA &amp; GDPR COMPLIANT VIA PERFECT CORP ⏤
      </div>
    </div>
  );
}
