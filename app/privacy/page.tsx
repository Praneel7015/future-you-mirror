"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { LegalLinks, NotMedicalAdvice } from "@/components/LegalNote";
import { PHOTO_DEMO, PHOTO_LIVE } from "@/lib/copy";
import { useMirror } from "@/lib/store";

const LEDGER = [
  {
    title: "Your photo",
    body: `${PHOTO_LIVE} ${PHOTO_DEMO} A live with-care photo is also sent to Perfect Corp. We cannot delete their copy from here.`,
    tag: "SENT ONLY IF LIVE",
  },
  {
    title: "This reading",
    body: "Scores and pictures for this visit stay in this browser tab. We do not save them on a server, and we do not keep them for 30 days.",
    tag: "THIS VISIT",
  },
  {
    title: "Your email",
    body: "We do not ask for your email. There is no account to sell or share.",
    tag: "NOT COLLECTED",
  },
];

type Phase = "rest" | "clearing" | "cleared";

export default function PrivacyPage() {
  const reset = useMirror((s) => s.reset);
  const [phase, setPhase] = useState<Phase>("rest");
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setReduceMotion(media.matches);
    apply();
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, []);

  const motion = useMemo(
    () => ({
      quick: reduceMotion ? 200 : 400,
      gone: reduceMotion ? 200 : 700,
      line: reduceMotion ? 200 : 600,
      delayLine: reduceMotion ? 0 : 200,
      delayLink: reduceMotion ? 0 : 400,
      hold: reduceMotion ? 200 : 1000,
      easing: "cubic-bezier(0.16, 1, 0.3, 1)",
      restY: "translateY(0)",
      ledgerOutY: reduceMotion ? "translateY(0)" : "translateY(-8px)",
      cardOutY: reduceMotion ? "translateY(0)" : "translateY(8px)",
      goneInY: reduceMotion ? "translateY(0)" : "translateY(12px)",
    }),
    [reduceMotion]
  );

  const startClear = () => {
    if (phase !== "rest") return;
    reset();
    try {
      sessionStorage.clear();
    } catch {
      // Private mode can block storage. The in-memory reading is still cleared.
    }
    setPhase("clearing");
    window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
    window.setTimeout(() => setPhase("cleared"), motion.hold);
  };

  return (
    <main
      className="min-h-screen w-full relative overflow-hidden"
      style={{ background: "#F8F5F0", color: "#2A2826" }}
    >
      <div
        aria-hidden={phase !== "rest"}
        style={{
          opacity: phase === "rest" ? 1 : 0,
          transform: phase === "rest" ? motion.restY : motion.ledgerOutY,
          transition: `opacity ${motion.quick}ms ${motion.easing}, transform ${motion.quick}ms ${motion.easing}`,
          pointerEvents: phase === "rest" ? "auto" : "none",
        }}
      >
        <div className="max-w-md mx-auto px-6 pt-16 pb-24">
          <Link
            href="/"
            className="text-[14px] inline-block mb-8"
            style={{
              fontFamily: "var(--font-serif)",
              fontStyle: "italic",
              color: "#A78B71",
              padding: "12px 0",
            }}
          >
            ← back
          </Link>

          <div
            className="text-[10px] uppercase"
            style={{ letterSpacing: "0.28em", color: "rgba(42,40,38,0.55)", fontStyle: "italic" }}
          >
            The ledger
          </div>
          <h1
            className="mt-3"
            style={{
              fontFamily: "var(--font-serif)",
              fontSize: 32,
              lineHeight: 1.1,
              fontWeight: 400,
              letterSpacing: "-0.01em",
              textWrap: "pretty" as const,
            }}
          >
            What we keep,
            <br />
            <span style={{ color: "#A78B71", fontStyle: "italic" }}>and what we don&apos;t.</span>
          </h1>
          <div
            className="mt-4"
            style={{
              fontFamily: "var(--font-serif)",
              fontStyle: "italic",
              fontSize: 14,
              color: "#A78B71",
              lineHeight: 1.5,
            }}
          >
            You can clear this phone. We do not have a photo library to wipe.
          </div>

          <div className="mt-8" style={{ height: 1, background: "rgba(42,40,38,0.12)" }} />

          {LEDGER.map((row) => (
            <div key={row.title}>
              <div className="py-5">
                <div className="flex items-baseline justify-between gap-4">
                  <div style={{ fontFamily: "var(--font-serif)", fontSize: 17, fontWeight: 400 }}>
                    {row.title}
                  </div>
                  <div
                    className="text-[10px] uppercase"
                    style={{
                      letterSpacing: "0.18em",
                      color: "#A78B71",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {row.tag}
                  </div>
                </div>
                <div
                  className="mt-2"
                  style={{
                    fontSize: 13,
                    lineHeight: 1.55,
                    color: "rgba(42,40,38,0.7)",
                    textWrap: "pretty" as const,
                  }}
                >
                  {row.body}
                </div>
              </div>
              <div style={{ height: 1, background: "rgba(42,40,38,0.12)" }} />
            </div>
          ))}

          <div className="mt-8">
            <NotMedicalAdvice />
          </div>

          <div
            className="mt-8"
            style={{
              padding: "28px 24px",
              border: "1px solid rgba(42,40,38,0.18)",
              borderRadius: 14,
              background: "#F8F5F0",
              opacity: phase === "rest" ? 1 : 0,
              transform: phase === "rest" ? motion.restY : motion.cardOutY,
              transition: `opacity ${motion.quick}ms ${motion.easing}, transform ${motion.quick}ms ${motion.easing}`,
            }}
          >
            <div
              style={{
                fontFamily: "var(--font-serif)",
                fontStyle: "italic",
                fontSize: 21,
                lineHeight: 1.3,
                fontWeight: 400,
                color: "#2A2826",
                textWrap: "pretty" as const,
              }}
            >
              Clear this reading on this phone.
            </div>
            <p className="mt-3 text-[13px] leading-relaxed" style={{ color: "rgba(42,40,38,0.7)" }}>
              This removes the reading from this browser. It does not delete a photo Perfect Corp already received.
            </p>
            <button
              onClick={startClear}
              disabled={phase !== "rest"}
              className="w-full mt-5 rounded-full font-medium"
              style={{
                height: 52,
                fontSize: 15,
                letterSpacing: "0.02em",
                background: "#A78B71",
                color: "#FBF8F3",
                cursor: phase === "rest" ? "pointer" : "default",
              }}
            >
              Clear on this phone
            </button>
          </div>

          <div className="mt-10">
            <LegalLinks />
          </div>
        </div>
      </div>

      <div
        role="status"
        aria-live="polite"
        className="fixed inset-0 min-h-screen flex flex-col items-center justify-center px-6"
        style={{
          opacity: phase === "cleared" ? 1 : 0,
          pointerEvents: phase === "cleared" ? "auto" : "none",
          transition: `opacity ${motion.gone}ms ${motion.easing}`,
        }}
      >
        <div
          className="text-center"
          style={{
            fontFamily: "var(--font-serif)",
            fontStyle: "italic",
            fontSize: 40,
            fontWeight: 300,
            color: "#A78B71",
            letterSpacing: "-0.02em",
            opacity: phase === "cleared" ? 1 : 0,
            transform: phase === "cleared" ? motion.restY : motion.goneInY,
            transition: `opacity ${motion.gone}ms ${motion.easing}, transform ${motion.gone}ms ${motion.easing}`,
          }}
        >
          Cleared on this phone.
        </div>
        <p
          className="mt-4 text-center max-w-xs text-[14px] leading-relaxed"
          style={{
            color: "rgba(42,40,38,0.7)",
            opacity: phase === "cleared" ? 1 : 0,
            transition: `opacity ${motion.line}ms ease ${motion.delayLine}ms`,
          }}
        >
          Nothing was deleted from Perfect Corp. We don&apos;t hold an account to wipe.
        </p>
        <Link
          href="/"
          className="mt-6 inline-block"
          style={{
            fontFamily: "var(--font-serif)",
            fontStyle: "italic",
            fontSize: 16,
            color: "#A78B71",
            textDecoration: "underline",
            textUnderlineOffset: 4,
            padding: "12px 8px",
            opacity: phase === "cleared" ? 1 : 0,
            transition: `opacity ${motion.line}ms ease ${motion.delayLink}ms`,
          }}
        >
          Return home
        </Link>
      </div>
    </main>
  );
}
