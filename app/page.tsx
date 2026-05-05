"use client";

import Link from "next/link";

export default function LandingPage() {
  return (
    <main
      className="min-h-[100svh] flex flex-col items-center justify-center px-6 py-8"
      style={{
        background: "#F8F5F0",
        color: "#2A2826",
        paddingTop: "max(24px, env(safe-area-inset-top))",
        paddingBottom: "max(24px, env(safe-area-inset-bottom))",
      }}
    >
      {/* Abstract editorial hero — the "mirror" motif */}
      <div className="relative w-full max-w-sm mb-10">
        <div
          className="w-full rounded-2xl overflow-hidden relative"
          style={{
            height: 320,
            background:
              "radial-gradient(120% 80% at 30% 20%, rgba(232,197,181,0.55), transparent 60%), radial-gradient(100% 70% at 80% 70%, rgba(167,139,113,0.35), transparent 65%), linear-gradient(180deg, #F1E8DC 0%, #E8D9C7 100%)",
          }}
        >
          {/* Oval mirror motif */}
          <div
            className="absolute"
            style={{
              left: "50%",
              top: "50%",
              transform: "translate(-50%, -50%)",
              width: 180,
              height: 230,
              borderRadius: "50%",
              background:
                "radial-gradient(60% 50% at 50% 40%, rgba(255,253,249,0.55), rgba(255,253,249,0.0) 70%)",
              border: "1px solid rgba(255,253,249,0.4)",
            }}
          />
          <div
            className="absolute"
            style={{
              left: "50%",
              top: "50%",
              transform: "translate(-50%, -50%)",
              width: 110,
              height: 145,
              borderRadius: "50%",
              border: "1px solid rgba(42,40,38,0.18)",
            }}
          />
          <div
            className="absolute bottom-4 left-5 text-[10px] tracking-widest"
            style={{ color: "rgba(42,40,38,0.5)", fontFamily: "var(--font-inter)" }}
          >
            EDITION · Nº 01
          </div>
          <div
            className="absolute bottom-4 right-5 text-[10px] tracking-widest"
            style={{ color: "rgba(42,40,38,0.5)", fontFamily: "var(--font-inter)" }}
          >
            SPRING — 2026
          </div>
        </div>
      </div>

      {/* Headline */}
      <div className="max-w-sm w-full">
        <h1
          style={{
            fontFamily: "var(--font-serif)",
            fontSize: 38,
            lineHeight: 1.05,
            fontWeight: 400,
            letterSpacing: "-0.01em",
          }}
        >
          See the skin you&apos;ll have.
          <br />
          <span style={{ fontStyle: "italic", color: "#A78B71" }}>
            And the one you could.
          </span>
        </h1>

        <p
          className="mt-5 text-sm leading-relaxed"
          style={{ color: "rgba(42,40,38,0.7)", maxWidth: 320 }}
        >
          One selfie. Two minutes. A question you&apos;ve never been asked.
        </p>

        {/* CTAs */}
        <div className="mt-10 space-y-4">
          <Link
            href="/mirror"
            className="flex items-center justify-center w-full rounded-full text-[15px] font-medium transition-colors"
            style={{
              height: 56,
              background: "#A78B71",
              color: "#FBF8F3",
              letterSpacing: "0.02em",
              fontFamily: "var(--font-sans)",
            }}
          >
            Begin the Mirror Test
          </Link>

          <Link
            href="/mirror?demo=true"
            className="flex items-center justify-center w-full rounded-full text-[14px] transition-colors"
            style={{
              height: 48,
              background: "transparent",
              color: "#2A2826",
              border: "1px solid rgba(42,40,38,0.18)",
              letterSpacing: "0.02em",
              fontFamily: "var(--font-sans)",
            }}
          >
            Try with sample photo
          </Link>
        </div>

        <p
          className="mt-6 text-center text-[10px]"
          style={{ color: "#A78B71", letterSpacing: "0.18em" }}
        >
          YOUR PHOTO NEVER LEAVES YOUR DEVICE UNENCRYPTED
        </p>
      </div>
    </main>
  );
}
