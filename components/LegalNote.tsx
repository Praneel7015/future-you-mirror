import Link from "next/link";
import { NOT_MEDICAL_ADVICE } from "@/lib/copy";

export function NotMedicalAdvice({ tone = "light" }: { tone?: "light" | "dark" }) {
  const color = tone === "dark" ? "rgba(248,245,240,0.72)" : "#6B5D52";
  return (
    <p
      style={{
        fontFamily: "var(--font-serif)",
        fontStyle: "italic",
        fontSize: 13,
        lineHeight: 1.45,
        color,
        textWrap: "pretty",
      }}
    >
      {NOT_MEDICAL_ADVICE}
    </p>
  );
}

const linkStyle = (color: string) => ({
  fontFamily: "var(--font-serif)",
  fontStyle: "italic" as const,
  fontSize: 14,
  color,
  textDecoration: "none",
  borderBottom: "0.5px solid rgba(167,139,113,0.45)",
  padding: "12px 2px",
});

export function LegalLinks({
  tone = "light",
  compact = false,
}: {
  tone?: "light" | "dark";
  compact?: boolean;
}) {
  const color = tone === "dark" ? "rgba(248,245,240,0.8)" : "#A78B71";
  const style = { ...linkStyle(color), padding: compact ? "2px" : "12px 2px" };
  return (
    <nav aria-label="Legal" className="flex items-center justify-center gap-8">
      <Link href="/privacy" style={style}>
        Privacy
      </Link>
      <Link href="/terms" style={style}>
        Terms
      </Link>
    </nav>
  );
}
