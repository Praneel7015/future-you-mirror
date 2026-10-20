"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

const LIVE_LINES = [
  "Reading your skin…",
  "Your photo is sent to Perfect Corp.",
  "Making the age pictures…",
];

const DEMO_LINES = [
  "Loading a sample reading…",
  "No photo is uploaded.",
  "This is not a live skin test.",
];

export default function LoadingStep() {
  const isDemo = useSearchParams().get("demo") === "true";
  const lines = isDemo ? DEMO_LINES : LIVE_LINES;
  const [active, setActive] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setActive((a) => (a + 1) % lines.length), 2000);
    return () => clearInterval(id);
  }, [lines.length]);

  return (
    <div
      className="flex-1 flex flex-col w-full relative"
      style={{
        background: "radial-gradient(80% 60% at 50% 30%, #5C4E44 0%, #3A322C 50%, #2A2420 100%)",
        height: "100%",
        minHeight: 0,
        overflow: "hidden",
        paddingTop: "env(safe-area-inset-top)",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      <div className="flex-1 flex flex-col items-center justify-center px-6">
        {/* Pulse */}
        <div className="relative" style={{ width: 64, height: 64 }}>
          <div
            className="absolute inset-0 rounded-full"
            style={{
              background: "rgba(248,245,240,0.18)",
              animation: "breathe 3.6s ease-in-out infinite",
            }}
          />
          <div
            className="absolute rounded-full"
            style={{
              inset: 14,
              background: "rgba(248,245,240,0.55)",
              animation: "breathe-core 3.6s ease-in-out infinite",
            }}
          />
        </div>

        {/* Crossfading lines */}
        <div className="mt-10 max-w-xs w-full text-center">
          {lines.map((line, i) => (
            <div
              key={i}
              style={{
                fontFamily: "var(--font-serif)",
                fontSize: 18,
                lineHeight: 1.55,
                fontWeight: 300,
                color: "#F8F5F0",
                opacity: i === active ? 1 : 0.32,
               marginBottom: 22,
                letterSpacing: "0.005em",
                textWrap: "pretty" as const,
                transition: "opacity 1100ms ease-in-out",
              }}
            >
              {line}
            </div>
          ))}
        </div>
      </div>

      <div className="pb-6 text-center">
        <span
          className="text-[10px] uppercase"
          style={{ letterSpacing: "0.28em", color: "rgba(248,245,240,0.4)" }}
        >
          A moment, please
        </span>
      </div>
    </div>
  );
}
