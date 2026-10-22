"use client";

import { useEffect, useRef, useState } from "react";
import { useMirror, findClosestPhoto } from "@/lib/store";
import { futurePortrait } from "@/lib/stated-age";

/** Full morph dwell time before advancing to reveal. */
const TOTAL_MS = 3400;
/** Time until crossfade reaches full “future” (t = 1); remainder holds on final frame. */
const FADE_MS = 2300;

export default function MorphStep() {
  const result = useMirror((s) => s.result);
  const statedAge = useMirror((s) => s.statedAge);
  const setStep = useMirror((s) => s.setStep);

  const [t, setT] = useState(0);
  const startRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const tick = (now: number) => {
      if (startRef.current === null) startRef.current = now;
      const elapsed = now - startRef.current;
      const progress = Math.min(1, elapsed / FADE_MS);
      setT(progress);
      if (elapsed < TOTAL_MS) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        setStep("reveal");
      }
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [setStep]);

  const ageMin = result?.aging.ageMin ?? 12;
  const ageMax = result?.aging.ageMax ?? 70;
  const portrait =
    statedAge == null ? null : futurePortrait(statedAge, ageMin, ageMax);
  const futureAge = portrait?.future ?? ageMax;
  const photos = result?.aging.photos ?? [];
  const nowPhoto = statedAge == null ? null : findClosestPhoto(photos, statedAge);
  const futurePhoto = portrait ? findClosestPhoto(photos, portrait.future) : null;

  const captionAt = t < 0.33 ? 0 : t < 0.66 ? 1 : 2;
  const captions = portrait?.limited
    ? ["This is now.", "As far as the pictures go.", "This is what they leave."]
    : ["This is now.", "Thirty years pass.", "This is what they leave."];

  // Approximate ellipse perimeter (Ramanujan's approximation)
  const rx = 130;
  const ry = 170;
  const h = ((rx - ry) / (rx + ry)) ** 2;
  const arcLen = Math.PI * (rx + ry) * (1 + (3 * h) / (10 + Math.sqrt(4 - 3 * h)));

  return (
    <div
      className="flex-1 w-full relative"
      style={{
        background:
          "radial-gradient(80% 80% at 50% 45%, #2D2925 0%, #1A1714 70%, #0E0C0A 100%)",
        minHeight: "100dvh",
      }}
    >
      {/* eyebrow crossfade */}
      <div className="absolute left-0 right-0 text-center" style={{ top: "max(24px, env(safe-area-inset-top))" }}>
        <div className="relative" style={{ height: 14 }}>
          <div
            className="absolute inset-0 text-[10px] uppercase"
            style={{
              letterSpacing: "0.32em",
              color: "rgba(248,245,240,0.7)",
              opacity: t < 0.5 ? 1 : 0,
              transition: "opacity 750ms ease-in-out",
            }}
          >
            READING COMPLETE
          </div>
          <div
            className="absolute inset-0 text-[10px] uppercase"
            style={{
              letterSpacing: "0.32em",
              color: "rgba(245,212,184,0.85)",
              opacity: t >= 0.5 ? 1 : 0,
              transition: "opacity 750ms ease-in-out",
            }}
          >
            AT AGE {Math.round(futureAge)}
          </div>
        </div>
      </div>

      {/* oval with crossfade and traced arc */}
      <div
        className="absolute"
        style={{ top: 152, left: "50%", transform: "translateX(-50%)", width: 260, height: 340 }}
      >
        <div
          className="absolute inset-0 overflow-hidden"
          style={{
            borderRadius: "50% / 50%",
            border: "1px solid rgba(248,245,240,0.4)",
          }}
        >
          {nowPhoto && (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={nowPhoto.url}
              alt=""
              className="absolute object-cover"
              style={{
                inset: 0,
                width: "100%",
                height: "100%",
                objectPosition: "center 24%",
                filter: "brightness(1.02) saturate(1.05)",
                opacity: 1 - t,
                transition: "opacity 1100ms cubic-bezier(0.16,1,0.3,1)",
              }}
            />
          )}
          {futurePhoto && (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={futurePhoto.url}
              alt=""
              className="absolute object-cover"
              style={{
                inset: 0,
                width: "100%",
                height: "100%",
                objectPosition: "center 24%",
                filter: "brightness(0.86) saturate(0.78) contrast(1.04) sepia(0.08)",
                opacity: t,
                transition: "opacity 1100ms cubic-bezier(0.16,1,0.3,1)",
              }}
            />
          )}
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(180deg, rgba(245,212,184,${(0.16 - t * 0.04).toFixed(3)}) 0%, rgba(232,197,181,${(0.10 + t * 0.18).toFixed(3)}) 100%)`,
              mixBlendMode: "soft-light",
            }}
          />
        </div>

        {/* hairline arc tracing the oval */}
        <svg
          className="absolute pointer-events-none"
          style={{ inset: -2, width: 264, height: 344 }}
          viewBox="0 0 264 344"
        >
          <ellipse
            cx="132"
            cy="172"
            rx={rx}
            ry={ry}
            fill="none"
            stroke="#A78B71"
            strokeOpacity="0.7"
            strokeWidth="1"
            strokeDasharray={`${arcLen * t * 1.3} 9999`}
            transform="rotate(-90 132 172)"
            strokeLinecap="round"
          />
        </svg>
      </div>

      {/* captions */}
      <div
        className="absolute text-center"
        style={{
          bottom: "max(28px, calc(env(safe-area-inset-bottom) + 16px))",
          left: 24,
          right: 24,
          height: 28,
        }}
      >
        {captions.map((c, i) => (
          <div
            key={i}
            className="absolute inset-x-0"
            style={{
              fontFamily: "var(--font-serif)",
              fontStyle: "italic",
              fontSize: 18,
              lineHeight: 1.4,
              fontWeight: 400,
              color: "#F8F5F0",
              opacity: i === captionAt ? 1 : 0,
              transition: "opacity 750ms ease-in-out",
            }}
          >
            {c}
          </div>
        ))}
      </div>
    </div>
  );
}
