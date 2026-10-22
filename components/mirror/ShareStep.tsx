"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { useMirror, findClosestPhoto } from "@/lib/store";
import { futurePortrait } from "@/lib/stated-age";
import { lowestConcernWord, readingScore } from "@/lib/skin-score";
import {
  SHARE_CARD_H,
  SHARE_CARD_SITE_LINE,
  shareCardBackgroundFull,
  shareCardLayout,
  scaleSharePx,
} from "@/lib/share-card-spec";
import { MirrorFrame } from "./MirrorFrame";

function subscribeShare() {
  return () => {};
}

const HOLD_TO_SAVE = "Press and hold the picture, then tap Save to Photos.";

function phoneCanShareFile() {
  return navigator.maxTouchPoints > 0 && typeof navigator.share === "function";
}

function downloadPng(blob: Blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "future-you-mirror.png";
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 2000);
}

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
  const statedAge = useMirror((s) => s.statedAge);
  const setStep = useMirror((s) => s.setStep);

  const [copied, setCopied] = useState(false);
  const [cardBusy, setCardBusy] = useState(false);
  const [statusText, setStatusText] = useState<string | null>(null);
  const [holdUrl, setHoldUrl] = useState<string | null>(null);
  const [linkText, setLinkText] = useState<string | null>(null);
  const shareOnPhone = useSyncExternalStore(subscribeShare, phoneCanShareFile, () => false);

  useEffect(() => {
    return () => {
      if (holdUrl) URL.revokeObjectURL(holdUrl);
    };
  }, [holdUrl]);

  const cardData = useMemo(() => {
    if (!result || statedAge == null) return null;
    const portrait = futurePortrait(statedAge, result.aging.ageMin, result.aging.ageMax);
    const futureAge = portrait.future;
    const nowPhoto = findClosestPhoto(result.aging.photos, statedAge);
    const futurePhoto = findClosestPhoto(result.aging.photos, futureAge);
    const score = readingScore(result.skin);
    const concern = lowestConcernWord(result.skin.concerns);
    const thisYear = new Date().getFullYear();
    const yearsAhead = Math.max(0, Math.round(futureAge - statedAge));
    const futureYear = String(thisYear + yearsAhead);
    const futureLabel = `AT ${Math.round(futureAge)}`;

    return {
      futureAge,
      nowUrl: nowPhoto?.url ?? "",
      futureUrl: futurePhoto?.url ?? "",
      score,
      concern,
      nowYear: String(thisYear),
      futureYear,
      futureLabel,
    };
  }, [result, statedAge]);

  if (!result || !cardData) {
    return (
      <MirrorFrame className="items-center justify-center">
        <div className="font-serif text-lg" style={{ color: "rgba(42,40,38,0.5)" }}>
          No reading yet.
        </div>
      </MirrorFrame>
    );
  }

  const PREVIEW_W = 270;
  const L = shareCardLayout;
  const sc = (n: number) => scaleSharePx(n, PREVIEW_W);
  const ringR = sc(L.stats.ringRadius);
  const ringBox = sc(L.stats.ringSvg);
  const ringMid = ringBox / 2;

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
    const body = JSON.stringify(cardPostBody());

    const readOnce = async () => {
      const res = await fetch("/api/share-card", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
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
      const ab = await res.arrayBuffer();
      return { ab, ct };
    };

    let { ab } = await readOnce();
    if (ab.byteLength === 0) {
      ({ ab } = await readOnce());
    }
    if (!ab || ab.byteLength === 0) throw new Error("Server returned an empty image.");
    return new Blob([ab], { type: "image/png" });
  }

  const showHoldCard = (blob: Blob) => {
    const url = URL.createObjectURL(blob);
    setHoldUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return url;
    });
    setStatusText(HOLD_TO_SAVE);
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
      setLinkText(null);
      setStatusText("Mirror link copied.");
      setTimeout(() => {
        setCopied(false);
        setStatusText(null);
      }, 2000);
    } catch {
      setLinkText(link);
      setStatusText("Press and hold this link to copy it.");
    }
  };

  const onShare = async () => {
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

      if (!shareOnPhone || typeof nav.share !== "function") {
        downloadPng(blob);
        setStatusText("Saved future-you-mirror.png");
        return;
      }

      const canFiles = typeof nav.canShare === "function" && nav.canShare({ files: [file] });
      try {
        if (canFiles) {
          await nav.share({
            files: [file],
            title: "Future You Mirror",
            text: "A Future You Mirror reading. Not medical advice.",
          });
        } else {
          await nav.share({
            title: "Future You Mirror",
            text: "A Future You Mirror reading. Not medical advice.",
            url: pageUrl,
          });
        }
        setStatusText(null);
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") {
          showHoldCard(blob);
          return;
        }
        downloadPng(blob);
        showHoldCard(blob);
        setStatusText("Saved future-you-mirror.png");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Could not share.";
      setStatusText(msg);
    } finally {
      setCardBusy(false);
    }
  };

  return (
    <MirrorFrame>
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

      {/* Preview uses the same layout spec as POST /api/share-card (1080×1920 PNG) */}
      <div className="flex-1 flex items-center justify-center my-6">
        <div className="flex flex-col items-center">
          <div
            className="relative overflow-hidden"
            style={{
              width: PREVIEW_W,
              height: scaleSharePx(SHARE_CARD_H, PREVIEW_W),
              borderRadius: sc(L.outerRadius),
              boxShadow: "0 24px 48px -16px rgba(42,40,38,0.22), 0 8px 20px -8px rgba(42,40,38,0.10)",
              background: shareCardBackgroundFull,
            }}
          >
            {holdUrl && (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={holdUrl}
                alt="Your reading"
                className="absolute inset-0 z-10 h-full w-full object-cover"
              />
            )}

            <div
              className="absolute"
              style={{
                left: sc(L.watermark.left),
                top: sc(L.watermark.top),
                width: sc(L.watermark.width),
                height: sc(L.watermark.height),
                borderRadius: "50%",
                border: `${sc(L.watermark.borderWidth)} solid ${L.watermark.borderColor}`,
              }}
            />

            <div className="absolute left-0 right-0 text-center" style={{ top: sc(L.header.top) }}>
              <div
                style={{
                  fontSize: sc(L.header.kickerFont),
                  letterSpacing: `${L.header.kickerLetterSpacingEm}em`,
                  color: L.header.kickerColor,
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
                  fontSize: sc(L.header.editionFont),
                  color: L.header.editionColor,
                  marginTop: sc(L.header.editionMarginTop),
                }}
              >
                Edition Nº 01
              </div>
            </div>

            <div
              className="absolute left-0 right-0 flex justify-center"
              style={{ top: sc(L.portraits.top), gap: sc(L.portraits.gap) }}
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
                <div key={i} style={{ width: sc(L.portraits.ovalW), textAlign: "center" }}>
                  <div
                    className="overflow-hidden relative"
                    style={{
                      width: sc(L.portraits.ovalW),
                      height: sc(L.portraits.ovalH),
                      borderRadius: "50% / 50%",
                      border: `${sc(L.portraits.ovalBorderWidth)} solid ${L.portraits.ovalBorderColor}`,
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
                          objectPosition: L.portraits.imgObjectPosition,
                          filter: o.filter,
                        }}
                      />
                    )}
                  </div>
                  <div
                    style={{
                      fontFamily: "var(--font-serif)",
                      fontSize: sc(L.portraits.yearFont),
                      fontWeight: 400,
                      letterSpacing: "0.04em",
                      color: L.portraits.yearColor,
                      marginTop: sc(L.portraits.yearMarginTop),
                    }}
                  >
                    {o.year}
                  </div>
                  <div
                    style={{
                      fontSize: sc(L.portraits.labelFont),
                      letterSpacing: `${0.32}em`,
                      color: L.portraits.labelColor,
                      textTransform: "uppercase",
                      marginTop: sc(L.portraits.labelMarginTop),
                    }}
                  >
                    {o.label}
                  </div>
                </div>
              ))}
            </div>

            <div
              className="absolute text-center"
              style={{
                top: sc(L.tagline.top),
                left: sc(L.tagline.insetX),
                right: sc(L.tagline.insetX),
                fontFamily: "var(--font-serif)",
                fontStyle: "italic",
                fontSize: sc(L.tagline.font),
                lineHeight: L.tagline.lineHeight,
                fontWeight: 400,
                color: L.tagline.color,
                letterSpacing: L.tagline.letterSpacingEm,
              }}
            >
              a thirty-year letter,
              <br />
              written in skin.
            </div>

            <div
              className="absolute left-0 right-0 flex justify-center items-center"
              style={{ top: sc(L.stats.top), gap: sc(L.stats.gap) }}
            >
              <div className="flex items-center" style={{ gap: sc(L.stats.scoreGap) }}>
                <svg width={ringBox} height={ringBox} viewBox={`0 0 ${ringBox} ${ringBox}`}>
                  <circle
                    cx={ringMid}
                    cy={ringMid}
                    r={ringR}
                    fill="none"
                    stroke={L.stats.ringStrokeBg}
                    strokeWidth={sc(L.stats.ringStrokeWidth)}
                  />
                  <circle
                    cx={ringMid}
                    cy={ringMid}
                    r={ringR}
                    fill="none"
                    stroke={L.stats.ringStrokeFg}
                    strokeWidth={sc(L.stats.ringStrokeWidth)}
                    strokeDasharray={`${(cardData.score / 100) * 2 * Math.PI * ringR} ${2 * Math.PI * ringR}`}
                    transform={`rotate(-90 ${ringMid} ${ringMid})`}
                    strokeLinecap="round"
                  />
                </svg>
                <div>
                  <div
                    style={{
                      fontFamily: "var(--font-serif)",
                      fontSize: sc(L.stats.scoreNumberFont),
                      lineHeight: 1,
                      fontWeight: 300,
                      letterSpacing: L.stats.scoreNumberLetterSpacingEm,
                      fontVariantNumeric: "tabular-nums",
                      color: "#2A2826",
                    }}
                  >
                    {Math.round(cardData.score)}
                  </div>
                  <div
                    style={{
                      fontSize: sc(L.stats.scoreLabelFont),
                      color: "#A78B71",
                      letterSpacing: `${L.stats.scoreLabelLetterSpacingEm}em`,
                      textTransform: "uppercase",
                      marginTop: sc(L.stats.scoreLabelMarginTop),
                    }}
                  >
                    SKIN SCORE
                  </div>
                </div>
              </div>

              <div
                style={{
                  width: sc(L.stats.dividerW),
                  height: sc(L.stats.dividerH),
                  background: "rgba(42,40,38,0.18)",
                }}
              />

              <div>
                <div
                  style={{
                    fontSize: sc(L.stats.concernKickerFont),
                    color: "rgba(42,40,38,0.5)",
                    letterSpacing: `${L.stats.concernKickerLetterSpacingEm}em`,
                    textTransform: "uppercase",
                  }}
                >
                  YOUR ONE THING
                </div>
                <div
                  style={{
                    fontFamily: "var(--font-serif)",
                    fontStyle: "italic",
                    fontSize: sc(L.stats.concernFont),
                    lineHeight: 1,
                    color: "#A78B71",
                    marginTop: sc(L.stats.concernMarginTop),
                  }}
                >
                  {cardData.concern}
                </div>
              </div>
            </div>

            <div
              className="absolute"
              style={{
                top: sc(L.hairline.top),
                left: sc(L.hairline.insetX),
                right: sc(L.hairline.insetX),
                height: sc(L.hairline.height),
                background: L.hairline.color,
              }}
            />

            <div className="absolute left-0 right-0 text-center" style={{ bottom: sc(L.footer.bottom) }}>
              <div
                style={{
                  fontFamily: "var(--font-serif)",
                  fontStyle: "italic",
                  fontSize: sc(L.footer.siteFont),
                  color: L.footer.siteColor,
                }}
              >
                {SHARE_CARD_SITE_LINE}
              </div>
              <div
                style={{
                  fontSize: sc(L.footer.hashFont),
                  color: L.footer.hashColor,
                  letterSpacing: `${L.footer.hashLetterSpacingEm}em`,
                  textTransform: "uppercase",
                  marginTop: sc(L.footer.hashMarginTop),
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

      <button
        type="button"
        onClick={onShare}
        disabled={cardBusy}
        className="w-full rounded-full font-medium"
        style={{
          height: 56,
          fontSize: 15,
          letterSpacing: "0.02em",
          background: "#A78B71",
          color: "#FBF8F3",
          opacity: cardBusy ? 0.6 : 1,
        }}
      >
        {cardBusy ? "Working…" : shareOnPhone ? "Share this reading" : "Save PNG"}
      </button>

      <button
        type="button"
        onClick={onCopyLink}
        className="w-full rounded-full font-medium mt-3"
        style={{
          height: 48,
          fontSize: 14,
          letterSpacing: "0.02em",
          background: "transparent",
          color: "#2A2826",
          border: "1px solid rgba(42,40,38,0.18)",
        }}
      >
        {copied ? "Copied" : "Copy link"}
      </button>

      {linkText && (
        <p
          className="mt-3 text-center break-all"
          style={{ fontSize: 13, lineHeight: 1.4, color: "#2A2826" }}
        >
          {linkText}
        </p>
      )}

      <div
        className="text-center mt-4 text-[14px]"
        style={{
          color: "#6B5D52",
          fontFamily: "var(--font-serif)",
          fontStyle: "italic",
          lineHeight: 1.4,
          minHeight: 16,
        }}
      >
        {statusText ?? " "}
      </div>

      <div
        className="text-center mt-1 text-[10px] uppercase"
        style={{ letterSpacing: "0.18em", color: "#6B5D52" }}
      >
        Not medical advice. Not a dermatologist.
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
    </MirrorFrame>
  );
}
