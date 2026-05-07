/**
 * Single source of truth for share-card layout at export resolution (1080×1920).
 * On-screen preview scales all numeric values by (previewWidth / SHARE_CARD_W).
 */

export const SHARE_CARD_W = 1080;
export const SHARE_CARD_H = 1920;

/** Displayed on card preview and PNG export */
export const SHARE_CARD_SITE_LINE = "future-you-mirror.vercel.app";

export const shareCardBackground = {
  base: "linear-gradient(180deg, #F1E8DC 0%, #E8D9C7 100%)",
  wash1: "radial-gradient(120% 80% at 30% 20%, rgba(232,197,181,0.55), transparent 60%)",
  /** Slightly stronger mocha wash (matches landing hero) so OG render reads less “flat”. */
  wash2: "radial-gradient(100% 70% at 80% 70%, rgba(167,139,113,0.35), transparent 65%)",
} as const;

/**
 * One background shorthand for preview + PNG: radials paint over the linear base.
 * Use this instead of stacked absolute divs — Satori often only reliably paints the first full-area fill.
 */
export const shareCardBackgroundFull = `${shareCardBackground.wash1}, ${shareCardBackground.wash2}, ${shareCardBackground.base}`;

/** Layout tokens in export pixels (1080 wide) */
export const shareCardLayout = {
  outerRadius: 48,
  watermark: {
    width: 760,
    height: 1100,
    left: (SHARE_CARD_W - 760) / 2,
    top: (SHARE_CARD_H - 1100) / 2,
    borderWidth: 4,
    borderColor: "rgba(167,139,113,0.18)",
  },
  header: {
    top: 88,
    kickerFont: 28,
    kickerLetterSpacingEm: 0.36,
    kickerColor: "#A78B71",
    editionFont: 32,
    editionMarginTop: 16,
    editionColor: "rgba(42,40,38,0.55)",
  },
  portraits: {
    top: 280,
    gap: 56,
    ovalW: 380,
    ovalH: 500,
    ovalBorderWidth: 4,
    ovalBorderColor: "rgba(42,40,38,0.18)",
    yearFont: 40,
    yearMarginTop: 32,
    labelFont: 26,
    labelMarginTop: 8,
    yearColor: "#2A2826",
    labelColor: "rgba(42,40,38,0.5)",
    imgObjectPosition: "center 28%" as const,
  },
  tagline: {
    top: 1008,
    insetX: 80,
    font: 72,
    lineHeight: 1.15,
    color: "#A78B71",
    letterSpacingEm: "-0.01em" as const,
  },
  stats: {
    top: 1320,
    gap: 56,
    ringSvg: 144,
    ringRadius: 64,
    ringStrokeBg: "rgba(167,139,113,0.18)",
    ringStrokeFg: "#A78B71",
    ringStrokeWidth: 6,
    scoreGap: 32,
    scoreNumberFont: 72,
    scoreNumberLetterSpacingEm: "-0.04em" as const,
    scoreLabelFont: 24,
    scoreLabelMarginTop: 8,
    scoreLabelLetterSpacingEm: 0.28,
    dividerW: 4,
    dividerH: 112,
    concernKickerFont: 24,
    concernKickerLetterSpacingEm: 0.28,
    concernFont: 72,
    concernMarginTop: 8,
  },
  hairline: {
    top: 1552,
    insetX: 200,
    height: 4,
    color: "rgba(42,40,38,0.18)",
  },
  footer: {
    bottom: 96,
    siteFont: 48,
    siteColor: "rgba(42,40,38,0.6)",
    hashFont: 26,
    hashMarginTop: 16,
    hashLetterSpacingEm: 0.32,
    hashColor: "rgba(42,40,38,0.45)",
  },
} as const;

export function scaleSharePx(value: number, previewWidth: number): number {
  return (value * previewWidth) / SHARE_CARD_W;
}
