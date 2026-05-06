"use client";

import { useEffect, useState } from "react";

const LINES = [
  "Reading 14 dimensions of your skin…",
  "Mapping your aging trajectory…",
  "Securely processed via Perfect Corp.",
];

export default function LoadingStep() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setActive((a) => (a + 1) % LINES.length), 2000);
    return () => clearInterval(id);
  }, []);

  return (
    <div
      className="flex-1 flex flex-col w-full relative"
      style={{
        background: "radial-gradient(80% 60% at 50% 30%, #5C4E44 0%, #3A322C 50%, #2A2420 100%)",
        minHeight: "100vh",
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
        <div className="mt-32 max-w-xs w-full text-center">
          {LINES.map((line, i) => (
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

      <div className="pb-16 text-center">
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
