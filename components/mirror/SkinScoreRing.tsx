"use client";

export const SCORE_BANDS = [
  { name: "weathered", min: 0, max: 39, color: "#6B5D52" },
  { name: "tender", min: 40, max: 59, color: "#C9B58F" },
  { name: "steady", min: 60, max: 74, color: "#A78B71" },
  { name: "radiant", min: 75, max: 89, color: "#F5D4B8" },
  { name: "exquisite", min: 90, max: 100, color: "#E8C5B5" },
] as const;

export type ScoreBand = (typeof SCORE_BANDS)[number]["name"];

export function bandFor(score: number) {
  return SCORE_BANDS.find((b) => score >= b.min && score <= b.max) ?? SCORE_BANDS[2];
}

interface Props {
  score: number;
  lowestName?: string;
  lowestScore?: number;
  size?: number;
}

export default function SkinScoreRing({ score, lowestName, lowestScore, size = 200 }: Props) {
  const r = size * 0.45;
  const cx = size / 2;
  const cy = size / 2;
  const C = 2 * Math.PI * r;
  const filled = (Math.max(0, Math.min(100, score)) / 100) * C;
  const band = bandFor(score);

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="#A78B71" strokeOpacity="0.15" strokeWidth="2" />
          <circle
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke="#A78B71"
            strokeWidth="2"
            strokeDasharray={`${filled} ${C}`}
            transform={`rotate(-90 ${cx} ${cy})`}
            strokeLinecap="round"
          />
          {[0, 90, 180, 270].map((deg) => {
            const rad = ((deg - 90) * Math.PI) / 180;
            const x1 = cx + Math.cos(rad) * (r - 5);
            const y1 = cy + Math.sin(rad) * (r - 5);
            const x2 = cx + Math.cos(rad) * (r + 5);
            const y2 = cy + Math.sin(rad) * (r + 5);
            return (
              <line
                key={deg}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="rgba(42,40,38,0.35)"
                strokeWidth="1"
              />
            );
          })}
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            style={{
              fontFamily: "var(--font-serif)",
              fontSize: Math.round(size * 0.44),
              lineHeight: 0.9,
              fontWeight: 300,
              letterSpacing: "-0.04em",
              color: "#2A2826",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {Math.round(score)}
          </div>
        </div>
      </div>

      <div
        className="mt-4"
        style={{
          fontFamily: "var(--font-serif)",
          fontStyle: "italic",
          fontSize: 18,
          color: "#A78B71",
          fontWeight: 400,
        }}
      >
        {band.name}
      </div>

      <p
        className="mt-3 text-center"
        style={{
          fontFamily: "var(--font-serif)",
          fontSize: 14,
          lineHeight: 1.45,
          color: "#6B5D52",
          maxWidth: 260,
        }}
      >
        Average of the 14 checks. Higher means healthier on this reading.
      </p>
      {lowestName != null && lowestScore != null && (
        <p
          className="mt-2 text-center"
          style={{
            fontFamily: "var(--font-serif)",
            fontStyle: "italic",
            fontSize: 16,
            color: "#2A2826",
          }}
        >
          Lowest: {lowestName}, {lowestScore}.
        </p>
      )}
    </div>
  );
}

export function ScoreBandsList({ activeName }: { activeName: ScoreBand }) {
  return (
    <div className="space-y-2">
      {SCORE_BANDS.map((b) => {
        const isCurrent = b.name === activeName;
        return (
          <div
            key={b.name}
            className="flex items-baseline gap-3"
            style={{ opacity: isCurrent ? 1 : 0.55 }}
          >
            <div
              style={{
                width: 14,
                height: 14,
                borderRadius: 999,
                background: b.color,
                flexShrink: 0,
                alignSelf: "center",
              }}
            />
            <div
              className="flex-1"
              style={{
                fontFamily: "var(--font-serif)",
                fontStyle: "italic",
                fontSize: 15,
                color: "#2A2826",
              }}
            >
              {b.name}
            </div>
            <div
              className="text-[11px]"
              style={{
                color: "rgba(42,40,38,0.55)",
                letterSpacing: "0.08em",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {b.min}–{b.max}
            </div>
          </div>
        );
      })}
    </div>
  );
}
