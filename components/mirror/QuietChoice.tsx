"use client";

/** A magazine line, not a pill. The whole row is the tap target. */
export function QuietChoice({
  label,
  selected,
  onClick,
  tone = "dark",
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
  tone?: "light" | "dark";
}) {
  const ink = tone === "dark" ? "rgba(248,245,240,0.9)" : "#2A2826";
  const selectedInk = tone === "dark" ? "#F5D4B8" : "#2A2826";
  const rule = tone === "dark" ? "rgba(248,245,240,0.22)" : "rgba(42,40,38,0.16)";

  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className="w-full text-left"
      style={{
        minHeight: 44,
        padding: "8px 0",
        background: "transparent",
        border: "none",
        borderBottom: `1px solid ${rule}`,
        fontFamily: "var(--font-serif)",
        fontStyle: selected ? "italic" : "normal",
        fontWeight: 400,
        fontSize: 18,
        lineHeight: 1.2,
        color: selected ? selectedInk : ink,
        letterSpacing: "-0.01em",
      }}
    >
      <span
        style={{
          boxShadow: selected ? `inset 0 -1px 0 ${selectedInk}` : undefined,
          paddingBottom: 1,
        }}
      >
        {label}
      </span>
    </button>
  );
}
