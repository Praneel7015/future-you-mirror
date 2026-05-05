"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

const LEDGER = [
  {
    title: "Your photo",
    body: "Encrypted in transit. Held for 24 hours so we can finish your reading. Then erased.",
    tag: "24 HOURS",
  },
  {
    title: "Your reading",
    body: "Stored as numbers - never the photo - for 30 days, only on your device.",
    tag: "30 DAYS",
  },
  {
    title: "Your email",
    body: "Only if you ask us to remind you. Never sold. Never shared.",
    tag: "OPT-IN ONLY",
  },
];

type Phase = "rest" | "erasing" | "gone";

export default function PrivacyPage() {
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

  const startErase = () => {
    if (phase !== "rest") return;
    setPhase("erasing");
    window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
    window.setTimeout(() => setPhase("gone"), motion.hold);
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
            className="text-[10px] uppercase inline-block mb-8"
            style={{ letterSpacing: "0.28em", color: "rgba(42,40,38,0.55)", fontStyle: "italic" }}
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
            <span style={{ color: "#A78B71", fontStyle: "italic" }}>and for how long.</span>
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
            You can take everything back. Here, in one tap.
          </div>

          <div className="mt-8" style={{ height: 1, background: "rgba(42,40,38,0.12)" }} />

          {LEDGER.map((row, i) => (
            <div key={i}>
              <div className="py-5">
                <div className="flex items-baseline justify-between gap-4">
                  <div style={{ fontFamily: "var(--font-serif)", fontSize: 17, fontWeight: 400 }}>
                    {row.title}
                  </div>
                  <div
                    className="text-[10px] uppercase"
                    style={{
                      letterSpacing: "0.28em",
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
              Erase everything we have on you.
            </div>
            <button
              onClick={startErase}
              disabled={phase !== "rest"}
              className="w-full mt-5 rounded-full font-medium"
              style={{
                height: 50,
                fontSize: 14,
                letterSpacing: "0.02em",
                background: "#A78B71",
                color: "#FBF8F3",
                cursor: phase === "rest" ? "pointer" : "default",
              }}
            >
              Erase my reading
            </button>
            <div
              className="text-center mt-4 text-[10px] uppercase"
              style={{
                letterSpacing: "0.28em",
                color: "rgba(42,40,38,0.5)",
                opacity: phase === "rest" ? 1 : 0,
                transition: `opacity ${motion.line}ms ease ${reduceMotion ? 0 : 140}ms`,
              }}
            >
              THIS IS PERMANENT · NO CONFIRMATION SCREENS · TRUSTING YOU
            </div>
          </div>

          <div
            className="mt-12 text-center"
            style={{
              fontFamily: "var(--font-serif)",
              fontStyle: "italic",
              fontSize: 13,
              color: "rgba(42,40,38,0.55)",
            }}
          >
            Built in the open. Audited by no one yet.
          </div>
          <div
            className="mt-2 text-center text-[10px]"
            style={{
              color: "rgba(42,40,38,0.4)",
              letterSpacing: "0.06em",
              fontStyle: "italic",
            }}
          >
            /privacy
          </div>
        </div>
      </div>

      <div
        role="status"
        aria-live="polite"
        className="fixed inset-0 min-h-screen flex flex-col items-center justify-center px-6"
        style={{
          opacity: phase === "gone" ? 1 : 0,
          pointerEvents: phase === "gone" ? "auto" : "none",
          transition: `opacity ${motion.gone}ms ${motion.easing}`,
        }}
      >
        <div
          style={{
            fontFamily: "var(--font-serif)",
            fontStyle: "italic",
            fontSize: 56,
            fontWeight: 300,
            color: "#A78B71",
            letterSpacing: "-0.02em",
            opacity: phase === "gone" ? 1 : 0,
            transform: phase === "gone" ? motion.restY : motion.goneInY,
            transition: `opacity ${motion.gone}ms ${motion.easing}, transform ${motion.gone}ms ${motion.easing}`,
          }}
        >
          Gone.
        </div>
        <div
          className="mt-6"
          style={{
            width: 24,
            height: 1,
            background: "rgba(42,40,38,0.2)",
            opacity: phase === "gone" ? 1 : 0,
            transition: `opacity ${motion.line}ms ease ${motion.delayLine}ms`,
          }}
        />
        <Link
          href="/"
          className="mt-6 inline-block"
          style={{
            fontFamily: "var(--font-serif)",
            fontStyle: "italic",
            fontSize: 14,
            color: "#A78B71",
            textDecoration: "underline",
            textUnderlineOffset: 4,
            textDecorationThickness: 0.5,
            opacity: phase === "gone" ? 1 : 0,
            transition: `opacity ${motion.line}ms ease ${motion.delayLink}ms`,
          }}
        >
          Return home
        </Link>
      </div>
    </main>
  );
}
