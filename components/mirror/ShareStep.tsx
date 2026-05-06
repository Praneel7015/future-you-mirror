"use client";

import { useMemo, useState } from "react";
import { useMirror, findClosestPhoto } from "@/lib/store";
import { compositeSkinScore, topConcernWord } from "@/lib/skin-score";

const SaveIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 18 18"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.25"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M9 2v10" />
    <path d="M5 8.5l4 4 4-4" />
    <path d="M3 14v1.5h12V14" />
  </svg>
);

const LinkIcon = () => (
  <svg
    width={18}
    height={18}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.75}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
  >
    <path d="M10 13a5 5 0 0 1 0-7l1-1a5 5 0 0 1 7 7l-1 1" />
    <path d="M14 11a5 5 0 0 1 0 7l-1 1a5 5 0 0 1-7-7l1-1" />
  </svg>
);

const StoryIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round">
    <rect x="4" y="2.5" width="10" height="13" rx="2" />
    <circle cx="9" cy="6" r="0.5" fill="currentColor" />
  </svg>
);

type ShareCardPostBody = {
  nowUrl: string;
  futureUrl: string;
  score: number;
  concern: string;
  nowYear: string;
  futureYear: string;
  futureLabel: string;
};

function mirrorEntryUrl(): string {
  const u = new URL("/mirror", window.location.origin);
  const demo = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("demo") : null;
  if (demo === "true") u.searchParams.set("demo", "true");
  return u.href;
}

export default function ShareStep() {
  const result = useMirror((s) => s.result);
  const setStep = useMirror((s) => s.setStep);
  const sun = useMirror((s) => s.sun);
  const hyd = useMirror((s) => s.hyd);
  const sleep = useMirror((s) => s.sleep);
  const routine = useMirror((s) => s.routine);

  const [copied, setCopied] = useState(false);
  const [cardBusy, setCardBusy] = useState(false);
  const [statusText, setStatusText] = useState<string | null>(null);

  const cardData = useMemo(() => {
    if (!result) return null;
    const realAge = Math.round(result.aging.currentAge ?? 30);
    // Future portrait = chronological age + 30, clamped to Perfect Corp outputs.
    const desiredFuture = realAge + 30;
    const futureAge = Math.min(result.aging.ageMax, Math.max(result.aging.ageMin, desiredFuture));
    const nowPhoto = findClosestPhoto(result.aging.photos, realAge);
    const futurePhoto = findClosestPhoto(result.aging.photos, futureAge);
    const score = compositeSkinScore(result.skin.concerns, { sun, hyd, sleep, routine });
    const concern = topConcernWord(result.skin.concerns, { sun, hyd, sleep, routine });
    const thisYear = new Date().getFullYear();
    const yearsAhead = Math.max(0, Math.round(futureAge - realAge));
    const futureYear = String(thisYear + yearsAhead);
    const futureLabel = `AT ${futureAge}`;

    return {
      realAge,
      futureAge,
      nowUrl: nowPhoto?.url ?? "",
      futureUrl: futurePhoto?.url ?? "",
      score,
      concern,
      nowYear: String(thisYear),
      futureYear,
      futureLabel,
    };
  }, [result, sun, hyd, sleep, routine]);

  if (!result || !cardData) {
    return (
      <div className="flex-1 flex items-center justify-center" style={{ minHeight: "100vh" }}>
        <div className="font-serif text-lg" style={{ color: "rgba(42,40,38,0.5)" }}>
          No reading yet.
        </div>
      </div>
    );
  }

  const cardPostBody = (): ShareCardPostBody => ({
    nowUrl: cardData.nowUrl,
    futureUrl: cardData.futureUrl,
    score: Math.round(cardData.score),
    concern: cardData.concern,
    nowYear: cardData.nowYear,
    futureYear: cardData.futureYear,
    futureLabel: cardData.futureLabel,
  });

  async function fetchShareCardBlob(): Promise<Blob> {
    const res = await fetch("/api/share-card", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(cardPostBody()),
      cache: "no-store",
    });
    const ct = res.headers.get("content-type") ?? "";
    if (!res.ok) {
      let detail = "";
      try {
        detail = ct.includes("application/json") ? JSON.stringify(await res.json()) : await res.text();
      } catch {
        detail = "";
      }
      throw new Error(`Could not compose card (${res.status}). ${detail.slice(0, 160)}`);
    }
    const blob = await res.blob();
    if (blob.size === 0) throw new Error("Server returned an empty image.");
    return blob;
  }

  const triggerDownloadFromBlob = (blob: Blob) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "future-you-mirror.png";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1600);
  };

  const onSaveReading = async () => {
    if (cardBusy) return;
    setCardBusy(true);
    setStatusText("Composing your card…");
    try {
      const blob = await fetchShareCardBlob();
      triggerDownloadFromBlob(blob);
      setStatusText("Saved to your downloads.");
      setTimeout(() => setStatusText(null), 2200);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Could not save.";
      setStatusText(msg);
      setTimeout(() => setStatusText(null), 4000);
    } finally {
      setCardBusy(false);
    }
  };

  /** Opens PNG in a new tab for long‑press Save; falls back to download if pop-ups are blocked. */
  const onOpenImageTab = async () => {
    if (cardBusy) return;
    setCardBusy(true);
    setStatusText("Opening PNG…");
    try {
      const blob = await fetchShareCardBlob();
      const url = URL.createObjectURL(blob);
      const popup = window.open(url, "_blank", "noopener,noreferrer");
      if (!popup) {
        triggerDownloadFromBlob(blob);
        URL.revokeObjectURL(url);
        setStatusText("Popup blocked — saved to downloads instead.");
        setTimeout(() => setStatusText(null), 3400);
        return;
      }
      setTimeout(() => URL.revokeObjectURL(url), 180000);
      setStatusText("In the image tab: use your browser menu to save.");
      setTimeout(() => setStatusText(null), 4200);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Could not open PNG.";
      setStatusText(msg);
      setTimeout(() => setStatusText(null), 4000);
    } finally {
      setCardBusy(false);
    }
  };

  const onCopyLink = async () => {
    const link = mirrorEntryUrl();
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(link);
      } else {
        const ta = document.createElement("textarea");
        ta.value = link;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }
      setCopied(true);
      setStatusText("Mirror link copied.");
      setTimeout(() => {
        setCopied(false);
        setStatusText(null);
      }, 2000);
    } catch {
      setStatusText("Couldn't copy — long-press the address bar.");
      setTimeout(() => setStatusText(null), 2600);
    }
  };

  const onShareStory = async () => {
    if (cardBusy) return;
    const pageUrl = mirrorEntryUrl();
    setCardBusy(true);
    setStatusText("Preparing share…");
    try {
      const blob = await fetchShareCardBlob();
      const file = new File([blob], "future-you-mirror.png", { type: "image/png" });
      const nav = navigator as Navigator & {
        canShare?: (data: { files?: File[] }) => boolean;
        share?: (data: { files?: File[]; title?: string; text?: string; url?: string }) => Promise<void>;
      };

      if (typeof nav.share === "function") {
        const canFiles = typeof nav.canShare === "function" && nav.canShare({ files: [file] });
        try {
          if (canFiles) {
            try {
              await nav.share({
                files: [file],
                title: "Future You Mirror",
                text: "My Future You Mirror reading.",
                url: pageUrl,
              });
            } catch {
              await nav.share({
                files: [file],
                title: "Future You Mirror",
                text: "My Future You Mirror reading.",
              });
            }
          } else {
            await nav.share({
              title: "Future You Mirror",
              text: `My Future You Mirror reading — try it here: ${pageUrl}`,
              url: pageUrl,
            });
          }
        } catch (err) {
          if (err instanceof Error && err.name === "AbortError") {
            setStatusText(null);
            return;
          }
          throw err;
        }
        setStatusText(null);
        return;
      }

      setStatusText("Sharing not available here — opening PNG…");
      const url = URL.createObjectURL(blob);
      const popup = window.open(url, "_blank", "noopener,noreferrer");
      if (!popup) {
        triggerDownloadFromBlob(blob);
        URL.revokeObjectURL(url);
        setStatusText("Saved to downloads instead.");
        setTimeout(() => setStatusText(null), 3200);
      } else {
        setTimeout(() => URL.revokeObjectURL(url), 180000);
        setStatusText("Use the image tab to save, or try on your phone for Instagram.");
        setTimeout(() => setStatusText(null), 4200);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Could not share.";
      setStatusText(msg);
      setTimeout(() => setStatusText(null), 4000);
    } finally {
      setCardBusy(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col px-6 pt-16 pb-12 max-w-md mx-auto w-full" style={{ minHeight: "100vh" }}>
      <button
        onClick={() => setStep("insights")}
        className="text-[10px] uppercase self-start mb-6"
        style={{ letterSpacing: "0.28em", color: "rgba(42,40,38,0.55)", fontStyle: "italic" }}
      >
        ← back
      </button>

      <div
        className="text-[10px] uppercase"
        style={{ letterSpacing: "0.28em", color: "rgba(42,40,38,0.55)", fontStyle: "italic" }}
      >
        Keep this
      </div>
      <h1
        className="mt-2"
        style={{
          fontFamily: "var(--font-serif)",
          fontSize: 28,
          lineHeight: 1.1,
          fontWeight: 400,
        }}
      >
        Save this reading,
        <br />
        <span style={{ color: "#A78B71", fontStyle: "italic" }}>or pass it on.</span>
      </h1>

      {/* Detailed mini preview — mirrors the 1080×1920 export */}
      <div className="flex-1 flex items-center justify-center my-6">
        <div className="flex flex-col items-center">
          <div
            className="relative overflow-hidden"
            style={{
              width: 270,
              height: 480,
              borderRadius: 12,
              boxShadow: "0 24px 48px -16px rgba(42,40,38,0.22), 0 8px 20px -8px rgba(42,40,38,0.10)",
              background: "linear-gradient(180deg, #F1E8DC 0%, #E8D9C7 100%)",
            }}
          >
            {/* gradient washes */}
            <div
              className="absolute inset-0"
              style={{
                background:
                  "radial-gradient(120% 80% at 30% 20%, rgba(232,197,181,0.55), transparent 60%), radial-gradient(100% 70% at 80% 70%, rgba(167,139,113,0.30), transparent 65%)",
              }}
            />
            {/* faint mocha oval watermark */}
            <div
              className="absolute"
              style={{
                left: "50%",
                top: "50%",
                transform: "translate(-50%, -50%)",
                width: 190,
                height: 275,
                borderRadius: "50%",
                border: "1px solid rgba(167,139,113,0.18)",
              }}
            />

            {/* editorial header */}
            <div
              className="absolute left-0 right-0 text-center"
              style={{ top: 22 }}
            >
              <div
                style={{
                  fontSize: 7,
                  letterSpacing: "0.36em",
                  color: "#A78B71",
                  fontWeight: 500,
                  textTransform: "uppercase",
                }}
              >
                FUTURE YOU MIRROR
              </div>
              <div
                style={{
                  fontFamily: "var(--font-serif)",
                  fontStyle: "italic",
                  fontSize: 8,
                  color: "rgba(42,40,38,0.55)",
                  marginTop: 4,
                }}
              >
                Edition Nº 01
              </div>
            </div>

            {/* twin ovals: NOW + AT FUTURE */}
            <div
              className="absolute left-0 right-0 flex justify-center"
              style={{ top: 70, gap: 14 }}
            >
              {[
                {
                  src: cardData.nowUrl,
                  year: cardData.nowYear,
                  label: "NOW",
                  filter: "brightness(1.04) saturate(1.05)",
                },
                {
                  src: cardData.futureUrl,
                  year: cardData.futureYear,
                  label: cardData.futureLabel,
                  filter: "brightness(0.94) saturate(0.85) contrast(1.02)",
                },
              ].map((o, i) => (
                <div key={i} style={{ width: 95, textAlign: "center" }}>
                  <div
                    className="overflow-hidden relative"
                    style={{
                      width: 95,
                      height: 125,
                      borderRadius: "50% / 50%",
                      border: "1px solid rgba(42,40,38,0.18)",
                    }}
                  >
                    {o.src && (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={o.src}
                        alt=""
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                          objectPosition: "center 28%",
                          filter: o.filter,
                        }}
                      />
                    )}
                  </div>
                  <div
                    className="mt-2"
                    style={{
                      fontFamily: "var(--font-serif)",
                      fontSize: 10,
                      fontWeight: 400,
                      letterSpacing: "0.04em",
                      color: "#2A2826",
                    }}
                  >
                    {o.year}
                  </div>
                  <div
                    className="mt-0.5"
                    style={{
                      fontSize: 6.5,
                      letterSpacing: "0.32em",
                      color: "rgba(42,40,38,0.5)",
                      textTransform: "uppercase",
                    }}
                  >
                    {o.label}
                  </div>
                </div>
              ))}
            </div>

            {/* italic mocha tagline */}
            <div
              className="absolute left-4 right-4 text-center"
              style={{
                top: 252,
                fontFamily: "var(--font-serif)",
                fontStyle: "italic",
                fontSize: 18,
                lineHeight: 1.15,
                fontWeight: 400,
                color: "#A78B71",
                letterSpacing: "-0.01em",
              }}
            >
              a thirty-year letter,
              <br />
              written in skin.
            </div>

            {/* score + concern row */}
            <div
              className="absolute left-0 right-0 flex justify-center items-center"
              style={{ top: 330, gap: 14 }}
            >
              <div className="flex items-center" style={{ gap: 8 }}>
                <svg width="36" height="36" viewBox="0 0 36 36">
                  <circle cx="18" cy="18" r="16" fill="none" stroke="rgba(167,139,113,0.18)" strokeWidth="1.5" />
                  <circle
                    cx="18"
                    cy="18"
                    r="16"
                    fill="none"
                    stroke="#A78B71"
                    strokeWidth="1.5"
                    strokeDasharray={`${(cardData.score / 100) * 2 * Math.PI * 16} ${2 * Math.PI * 16}`}
                    transform="rotate(-90 18 18)"
                    strokeLinecap="round"
                  />
                </svg>
                <div>
                  <div
                    style={{
                      fontFamily: "var(--font-serif)",
                      fontSize: 18,
                      lineHeight: 1,
                      fontWeight: 300,
                      letterSpacing: "-0.04em",
                      fontVariantNumeric: "tabular-nums",
                      color: "#2A2826",
                    }}
                  >
                    {Math.round(cardData.score)}
                  </div>
                  <div
                    className="mt-0.5"
                    style={{
                      fontSize: 6,
                      color: "#A78B71",
                      letterSpacing: "0.28em",
                      textTransform: "uppercase",
                    }}
                  >
                    SKIN SCORE
                  </div>
                </div>
              </div>

              <div style={{ width: 1, height: 28, background: "rgba(42,40,38,0.18)" }} />

              <div>
                <div
                  style={{
                    fontSize: 6,
                    color: "rgba(42,40,38,0.5)",
                    letterSpacing: "0.28em",
                    textTransform: "uppercase",
                  }}
                >
                  YOUR ONE THING
                </div>
                <div
                  className="mt-1"
                  style={{
                    fontFamily: "var(--font-serif)",
                    fontStyle: "italic",
                    fontSize: 18,
                    lineHeight: 1,
                    color: "#A78B71",
                  }}
                >
                  {cardData.concern}
                </div>
              </div>
            </div>

            {/* hairline */}
            <div
              className="absolute"
              style={{
                top: 388,
                left: 50,
                right: 50,
                height: 1,
                background: "rgba(42,40,38,0.18)",
              }}
            />

            {/* signature */}
            <div className="absolute left-0 right-0 text-center" style={{ bottom: 24 }}>
              <div
                style={{
                  fontFamily: "var(--font-serif)",
                  fontStyle: "italic",
                  fontSize: 12,
                  color: "rgba(42,40,38,0.6)",
                }}
              >
                futureyou.mirror
              </div>
              <div
                className="mt-1"
                style={{
                  fontSize: 6.5,
                  color: "rgba(42,40,38,0.45)",
                  letterSpacing: "0.32em",
                  textTransform: "uppercase",
                }}
              >
                share #futureyoumirror
              </div>
            </div>
          </div>
          <div
            className="mt-3 text-[10px]"
            style={{ color: "rgba(42,40,38,0.5)", fontStyle: "italic", letterSpacing: "0.06em" }}
          >
            1080 × 1920 · ready to save
          </div>
        </div>
      </div>

      {/* Save — download card PNG */}
      <button
        type="button"
        onClick={onSaveReading}
        disabled={cardBusy}
        className="w-full rounded-full font-medium"
        style={{
          height: 52,
          fontSize: 14,
          letterSpacing: "0.02em",
          background: "#A78B71",
          color: "#FBF8F3",
          opacity: cardBusy ? 0.6 : 1,
        }}
      >
        {cardBusy ? "Working…" : "Save this reading"}
      </button>

      {/* Save image opens tab; Story uses native share; Copy copies app link */}
      <div className="grid grid-cols-3 gap-2 mt-3">
        <button
          type="button"
          onClick={onOpenImageTab}
          disabled={cardBusy}
          className="rounded-full"
          style={{
            height: 64,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 4,
            background: "transparent",
            color: "#2A2826",
            border: "1px solid rgba(42,40,38,0.15)",
            fontSize: 11,
            letterSpacing: "0.02em",
            opacity: cardBusy ? 0.55 : 1,
          }}
        >
          <SaveIcon />
          <span>Save image</span>
        </button>
        <button
          type="button"
          onClick={onCopyLink}
          className="rounded-full"
          style={{
            height: 64,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 4,
            background: "transparent",
            color: "#2A2826",
            border: "1px solid rgba(42,40,38,0.15)",
            fontSize: 11,
            letterSpacing: "0.02em",
          }}
        >
          <LinkIcon />
          <span>{copied ? "Copied" : "Copy link"}</span>
        </button>
        <button
          type="button"
          onClick={onShareStory}
          disabled={cardBusy}
          className="rounded-full"
          style={{
            height: 64,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 4,
            background: "transparent",
            color: "#2A2826",
            border: "1px solid rgba(42,40,38,0.15)",
            fontSize: 11,
            letterSpacing: "0.02em",
            opacity: cardBusy ? 0.55 : 1,
          }}
        >
          <StoryIcon />
          <span>Story</span>
        </button>
      </div>

      <div
        className="text-center mt-4 text-[11px]"
        style={{ color: "rgba(42,40,38,0.55)", fontStyle: "italic", minHeight: 16 }}
      >
        {statusText ?? " "}
      </div>

      <div
        className="text-center mt-1 text-[10px] uppercase"
        style={{ letterSpacing: "0.18em", color: "#6B5D52" }}
      >
        ⏤ HIPAA &amp; GDPR COMPLIANT VIA PERFECT CORP ⏤
      </div>

      <div className="text-center mt-4">
        <a
          href="https://www.praneel.tech"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block transition-opacity hover:opacity-80"
          style={{
            fontFamily: "var(--font-sans)",
            fontSize: 10,
            letterSpacing: "0.14em",
            color: "rgba(42,40,38,0.45)",
            textDecoration: "none",
            borderBottom: "0.5px solid rgba(167,139,113,0.35)",
            paddingBottom: 2,
          }}
        >
          Made By Praneel S.
        </a>
      </div>
    </div>
  );
}
