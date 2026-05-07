import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";
import {
  SHARE_CARD_H,
  SHARE_CARD_SITE_LINE,
  SHARE_CARD_W,
  shareCardBackgroundFull,
  shareCardLayout,
} from "@/lib/share-card-spec";
import { toAbsoluteRequestUrl } from "@/lib/request-absolute-url";

export const runtime = "edge";

async function inlineImage(url: string, requestOrigin: string): Promise<string | null> {
  if (!url) return null;
  const trimmed = url.trim();
  if (trimmed.startsWith("data:")) return trimmed;

  const abs = toAbsoluteRequestUrl(trimmed, requestOrigin);
  if (!abs) return null;

  try {
    const r = await fetch(abs, {
      cache: "no-store",
      headers: {
        Accept: "image/*,*/*;q=0.8",
        "User-Agent": "FutureYouMirror/1.0 (share-card; +https://future-you-mirror.vercel.app)",
      },
    });
    if (!r.ok) return null;
    const ct = r.headers.get("content-type") ?? "image/jpeg";
    const buf = await r.arrayBuffer();
    const b64 = Buffer.from(buf).toString("base64");
    return `data:${ct};base64,${b64}`;
  } catch {
    return null;
  }
}

export type ShareCardFields = {
  nowUrl: string;
  futureUrl: string;
  score: number;
  concern: string;
  nowYear: string;
  futureYear: string;
  futureLabel: string;
};

export function normalizeSharePayload(input: Partial<ShareCardFields>): ShareCardFields {
  return {
    nowUrl: typeof input.nowUrl === "string" ? input.nowUrl : "",
    futureUrl: typeof input.futureUrl === "string" ? input.futureUrl : "",
    score: Math.max(0, Math.min(100, Number.isFinite(Number(input.score)) ? Number(input.score) : 73)),
    concern: (typeof input.concern === "string" ? input.concern : "hydration").slice(0, 24),
    nowYear: (typeof input.nowYear === "string" ? input.nowYear : String(new Date().getFullYear())).slice(0, 8),
    futureYear: (typeof input.futureYear === "string" ? input.futureYear : String(new Date().getFullYear() + 30)).slice(
      0,
      8,
    ),
    futureLabel: (typeof input.futureLabel === "string" ? input.futureLabel : "AT SIXTY-FIVE").slice(0, 32),
  };
}

async function renderShareCardImageResponse(fields: ShareCardFields, req: NextRequest): Promise<ImageResponse> {
  const { nowUrl, futureUrl, score, concern, nowYear, futureYear, futureLabel } = fields;
  const L = shareCardLayout;
  const origin = req.nextUrl.origin;

  const [nowSrc, futureSrc] = await Promise.all([
    inlineImage(nowUrl, origin),
    inlineImage(futureUrl, origin),
  ]);

  const rRing = L.stats.ringRadius;
  const filledArc = (score / 100) * 2 * Math.PI * rRing;
  const totalArc = 2 * Math.PI * rRing;
  const ringMid = L.stats.ringSvg / 2;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "stretch",
          justifyContent: "stretch",
          background: "transparent",
        }}
      >
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            position: "relative",
            borderRadius: L.outerRadius,
            overflow: "hidden",
            background: shareCardBackgroundFull,
          }}
        >

        <div
          style={{
            position: "absolute",
            left: L.watermark.left,
            top: L.watermark.top,
            width: L.watermark.width,
            height: L.watermark.height,
            borderRadius: 9999,
            border: `${L.watermark.borderWidth}px solid ${L.watermark.borderColor}`,
            display: "flex",
          }}
        />

        <div
          style={{
            position: "absolute",
            top: L.header.top,
            left: 0,
            right: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <div
            style={{
              fontSize: L.header.kickerFont,
              letterSpacing: `${L.header.kickerLetterSpacingEm}em`,
              color: L.header.kickerColor,
              fontWeight: 500,
              textTransform: "uppercase",
              display: "flex",
            }}
          >
            FUTURE YOU MIRROR
          </div>
          <div
            style={{
              fontStyle: "italic",
              fontSize: L.header.editionFont,
              color: L.header.editionColor,
              marginTop: L.header.editionMarginTop,
              display: "flex",
            }}
          >
            Edition Nº 01
          </div>
        </div>

        <div
          style={{
            position: "absolute",
            top: L.portraits.top,
            left: 0,
            right: 0,
            display: "flex",
            justifyContent: "center",
            gap: L.portraits.gap,
          }}
        >
          {[
            { src: nowSrc, year: nowYear, label: "NOW", filter: "brightness(1.04) saturate(1.05)" },
            {
              src: futureSrc,
              year: futureYear,
              label: futureLabel,
              filter: "brightness(0.94) saturate(0.85) contrast(1.02)",
            },
          ].map((o, i) => (
            <div
              key={i}
              style={{
                width: L.portraits.ovalW,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
              }}
            >
              <div
                style={{
                  width: L.portraits.ovalW,
                  height: L.portraits.ovalH,
                  borderRadius: 9999,
                  border: `${L.portraits.ovalBorderWidth}px solid ${L.portraits.ovalBorderColor}`,
                  overflow: "hidden",
                  position: "relative",
                  display: "flex",
                  background: "rgba(232,197,181,0.25)",
                }}
              >
                {o.src ? (
                  // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
                  <img
                    src={o.src}
                    width={L.portraits.ovalW}
                    height={L.portraits.ovalH}
                    style={{
                      width: L.portraits.ovalW,
                      height: L.portraits.ovalH,
                      objectFit: "cover",
                      objectPosition: L.portraits.imgObjectPosition,
                      filter: o.filter,
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: L.portraits.ovalW,
                      height: L.portraits.ovalH,
                      background:
                        "linear-gradient(180deg, rgba(232,197,181,0.4) 0%, rgba(167,139,113,0.25) 100%)",
                      display: "flex",
                    }}
                  />
                )}
              </div>
              <div
                style={{
                  fontSize: L.portraits.yearFont,
                  marginTop: L.portraits.yearMarginTop,
                  fontWeight: 400,
                  letterSpacing: "0.04em",
                  color: L.portraits.yearColor,
                  display: "flex",
                }}
              >
                {o.year}
              </div>
              <div
                style={{
                  fontSize: L.portraits.labelFont,
                  marginTop: L.portraits.labelMarginTop,
                  letterSpacing: "0.32em",
                  color: L.portraits.labelColor,
                  textTransform: "uppercase",
                  display: "flex",
                }}
              >
                {o.label}
              </div>
            </div>
          ))}
        </div>

        <div
          style={{
            position: "absolute",
            top: L.tagline.top,
            left: L.tagline.insetX,
            right: L.tagline.insetX,
            display: "flex",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              fontStyle: "italic",
              fontSize: L.tagline.font,
              lineHeight: L.tagline.lineHeight,
              fontWeight: 400,
              color: L.tagline.color,
              letterSpacing: L.tagline.letterSpacingEm,
              textAlign: "center",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <div style={{ display: "flex" }}>a thirty-year letter,</div>
            <div style={{ display: "flex" }}>written in skin.</div>
          </div>
        </div>

        <div
          style={{
            position: "absolute",
            top: L.stats.top,
            left: 0,
            right: 0,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: L.stats.gap,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: L.stats.scoreGap }}>
            <svg width={L.stats.ringSvg} height={L.stats.ringSvg} viewBox={`0 0 ${L.stats.ringSvg} ${L.stats.ringSvg}`}>
              <circle
                cx={ringMid}
                cy={ringMid}
                r={rRing}
                fill="none"
                stroke={L.stats.ringStrokeBg}
                strokeWidth={L.stats.ringStrokeWidth}
              />
              <circle
                cx={ringMid}
                cy={ringMid}
                r={rRing}
                fill="none"
                stroke={L.stats.ringStrokeFg}
                strokeWidth={L.stats.ringStrokeWidth}
                strokeDasharray={`${filledArc} ${totalArc}`}
                transform={`rotate(-90 ${ringMid} ${ringMid})`}
                strokeLinecap="round"
              />
            </svg>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div
                style={{
                  fontSize: L.stats.scoreNumberFont,
                  lineHeight: 1,
                  fontWeight: 300,
                  letterSpacing: L.stats.scoreNumberLetterSpacingEm,
                  color: "#2A2826",
                  fontVariantNumeric: "tabular-nums",
                  display: "flex",
                }}
              >
                {Math.round(score)}
              </div>
              <div
                style={{
                  fontSize: L.stats.scoreLabelFont,
                  color: "#A78B71",
                  marginTop: L.stats.scoreLabelMarginTop,
                  letterSpacing: `${L.stats.scoreLabelLetterSpacingEm}em`,
                  textTransform: "uppercase",
                  display: "flex",
                }}
              >
                SKIN SCORE
              </div>
            </div>
          </div>

          <div
            style={{
              width: L.stats.dividerW,
              height: L.stats.dividerH,
              background: "rgba(42,40,38,0.18)",
              display: "flex",
            }}
          />

          <div style={{ display: "flex", flexDirection: "column" }}>
            <div
              style={{
                fontSize: L.stats.concernKickerFont,
                color: "rgba(42,40,38,0.5)",
                letterSpacing: `${L.stats.concernKickerLetterSpacingEm}em`,
                textTransform: "uppercase",
                display: "flex",
              }}
            >
              YOUR ONE THING
            </div>
            <div
              style={{
                fontStyle: "italic",
                fontSize: L.stats.concernFont,
                lineHeight: 1,
                fontWeight: 400,
                color: "#A78B71",
                marginTop: L.stats.concernMarginTop,
                display: "flex",
              }}
            >
              {concern}
            </div>
          </div>
        </div>

        <div
          style={{
            position: "absolute",
            top: L.hairline.top,
            left: L.hairline.insetX,
            right: L.hairline.insetX,
            height: L.hairline.height,
            background: L.hairline.color,
            display: "flex",
          }}
        />

        <div
          style={{
            position: "absolute",
            bottom: L.footer.bottom,
            left: 0,
            right: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <div
            style={{
              fontStyle: "italic",
              fontSize: L.footer.siteFont,
              color: L.footer.siteColor,
              display: "flex",
            }}
          >
            {SHARE_CARD_SITE_LINE}
          </div>
          <div
            style={{
              fontSize: L.footer.hashFont,
              color: L.footer.hashColor,
              marginTop: L.footer.hashMarginTop,
              letterSpacing: `${L.footer.hashLetterSpacingEm}em`,
              textTransform: "uppercase",
              display: "flex",
            }}
          >
            share #futureyoumirror
          </div>
        </div>
        </div>
      </div>
    ),
    {
      width: SHARE_CARD_W,
      height: SHARE_CARD_H,
    },
  );
}

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  return renderShareCardImageResponse(
    normalizeSharePayload({
      nowUrl: sp.get("nowUrl") ?? "",
      futureUrl: sp.get("futureUrl") ?? "",
      score: Number(sp.get("score") ?? "73"),
      concern: sp.get("concern") ?? "hydration",
      nowYear: sp.get("nowYear") ?? String(new Date().getFullYear()),
      futureYear: sp.get("futureYear") ?? String(new Date().getFullYear() + 30),
      futureLabel: sp.get("futureLabel") ?? "AT SIXTY-FIVE",
    }),
    req,
  );
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "invalid_json", message: "Body must be JSON." }, { status: 400 });
  }
  if (!body || typeof body !== "object") {
    return Response.json({ error: "invalid_body", message: "Expected a JSON object." }, { status: 400 });
  }
  const o = body as Record<string, unknown>;
  return renderShareCardImageResponse(
    normalizeSharePayload({
      nowUrl: typeof o.nowUrl === "string" ? o.nowUrl : undefined,
      futureUrl: typeof o.futureUrl === "string" ? o.futureUrl : undefined,
      score: typeof o.score === "number" ? o.score : Number(o.score),
      concern: typeof o.concern === "string" ? o.concern : undefined,
      nowYear: typeof o.nowYear === "string" ? o.nowYear : undefined,
      futureYear: typeof o.futureYear === "string" ? o.futureYear : undefined,
      futureLabel: typeof o.futureLabel === "string" ? o.futureLabel : undefined,
    }),
    req,
  );
}
