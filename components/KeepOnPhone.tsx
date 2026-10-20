/** Short Add to Home Screen note. iPhone first. */
export function KeepOnPhone({ tone = "light" }: { tone?: "light" | "dark" }) {
  const title = tone === "dark" ? "#F8F5F0" : "#2A2826";
  const body = tone === "dark" ? "rgba(248,245,240,0.62)" : "#6B5D52";

  return (
    <section aria-label="Keep this on your phone" className="text-center">
      <p
        style={{
          fontFamily: "var(--font-serif)",
          fontStyle: "italic",
          fontSize: 15,
          lineHeight: 1.3,
          color: title,
        }}
      >
        Keep this on your phone
      </p>
      <p className="mt-1 text-[12px] leading-snug" style={{ color: body }}>
        iPhone: tap Share, then Add to Home Screen.
      </p>
      <p className="text-[12px] leading-snug" style={{ color: body }}>
        Android: tap the menu, then Install app.
      </p>
    </section>
  );
}
