import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

const W = 1080;
const H = 1920;

// Fetch a remote image and inline it as a data URI so Satori never has to
// reach across the network mid-render. Falls back to the original URL if
// fetching fails — Satori can sometimes still pull it.
async function inlineImage(url: string): Promise<string | null> {
  if (!url) return null;
  try {
    const r = await fetch(url, { cache: "no-store" });
    if (!r.ok) return null;
    const ct = r.headers.get("content-type") ?? "image/jpeg";
    const buf = await r.arrayBuffer();
    const b64 = Buffer.from(buf).toString("base64");
    return `data:${ct};base64,${b64}`;
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const nowUrl = sp.get("nowUrl") ?? "";
  const futureUrl = sp.get("futureUrl") ?? "";
  const score = Math.max(0, Math.min(100, Number(sp.get("score") ?? "73")));
  const concern = (sp.get("concern") ?? "hydration").slice(0, 24);
  const nowYear = (sp.get("nowYear") ?? String(new Date().getFullYear())).slice(0, 8);
  const futureYear = (sp.get("futureYear") ?? String(new Date().getFullYear() + 35)).slice(0, 8);
  const futureLabel = (sp.get("futureLabel") ?? "AT SIXTY-FIVE").slice(0, 32);

  // Pre-fetch both photos in parallel so we don't double-pay latency
  const [nowSrc, futureSrc] = await Promise.all([
    inlineImage(nowUrl),
    inlineImage(futureUrl),
  ]);

  const radius = 56;
  const filledArc = (score / 100) * 2 * Math.PI * radius;
  const totalArc = 2 * Math.PI * radius;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          background: "linear-gradient(180deg, #F1E8DC 0%, #E8D9C7 100%)",
          position: "relative",
        }}
      >
        {/* Layered hero gradients */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(120% 80% at 30% 20%, rgba(232,197,181,0.55), transparent 60%)",
            display: "flex",
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(100% 70% at 80% 70%, rgba(167,139,113,0.30), transparent 65%)",
            display: "flex",
          }}
        />

        {/* Faint mocha oval watermark — circular for Satori reliability */}
        <div
          style={{
            position: "absolute",
            left: 160,
            top: 410,
            width: 760,
            height: 760,
            borderRadius: 9999,
            border: "2px solid rgba(167,139,113,0.18)",
            display: "flex",
          }}
        />

        {/* Editorial header */}
        <div
          style={{
            position: "absolute",
            top: 96,
            left: 0,
            right: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <div
            style={{
              fontSize: 26,
              letterSpacing: 10,
              color: "#A78B71",
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
              fontSize: 24,
              color: "rgba(42,40,38,0.55)",
              marginTop: 14,
              display: "flex",
            }}
          >
            Edition Nº 01
          </div>
        </div>

        {/* Twin ovals: NOW + AT FUTURE */}
        <div
          style={{
            position: "absolute",
            top: 280,
            left: 0,
            right: 0,
            display: "flex",
            justifyContent: "center",
            gap: 56,
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
                width: 380,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
              }}
            >
              <div
                style={{
                  width: 380,
                  height: 500,
                  borderRadius: 9999,
                  border: "2px solid rgba(42,40,38,0.18)",
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
                    width={380}
                    height={500}
                    style={{
                      width: 380,
                      height: 500,
                      objectFit: "cover",
                      filter: o.filter,
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: 380,
                      height: 500,
                      background:
                        "linear-gradient(180deg, rgba(232,197,181,0.4) 0%, rgba(167,139,113,0.25) 100%)",
                      display: "flex",
                    }}
                  />
                )}
              </div>
              <div
                style={{
                  fontSize: 30,
                  marginTop: 26,
                  fontWeight: 400,
                  letterSpacing: 1.4,
                  color: "#2A2826",
                  display: "flex",
                }}
              >
                {o.year}
              </div>
              <div
                style={{
                  fontSize: 16,
                  marginTop: 6,
                  letterSpacing: 5,
                  color: "rgba(42,40,38,0.5)",
                  textTransform: "uppercase",
                  display: "flex",
                }}
              >
                {o.label}
              </div>
            </div>
          ))}
        </div>

        {/* Italic mocha tagline */}
        <div
          style={{
            position: "absolute",
            top: 1010,
            left: 80,
            right: 80,
            display: "flex",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              fontStyle: "italic",
              fontSize: 68,
              lineHeight: 1.15,
              fontWeight: 400,
              color: "#A78B71",
              letterSpacing: -0.6,
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

        {/* Score ring + concern */}
        <div
          style={{
            position: "absolute",
            top: 1300,
            left: 0,
            right: 0,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: 52,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
            <svg width="120" height="120" viewBox="0 0 120 120">
              <circle
                cx="60"
                cy="60"
                r={radius}
                fill="none"
                stroke="rgba(167,139,113,0.18)"
                strokeWidth="3"
              />
              <circle
                cx="60"
                cy="60"
                r={radius}
                fill="none"
                stroke="#A78B71"
                strokeWidth="3"
                strokeDasharray={`${filledArc} ${totalArc}`}
                transform="rotate(-90 60 60)"
                strokeLinecap="round"
              />
            </svg>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div
                style={{
                  fontSize: 60,
                  lineHeight: 1,
                  fontWeight: 300,
                  letterSpacing: -2,
                  color: "#2A2826",
                  display: "flex",
                }}
              >
                {Math.round(score)}
              </div>
              <div
                style={{
                  fontSize: 14,
                  color: "#A78B71",
                  marginTop: 8,
                  letterSpacing: 4,
                  textTransform: "uppercase",
                  display: "flex",
                }}
              >
                SKIN SCORE
              </div>
            </div>
          </div>

          <div style={{ width: 1, height: 100, background: "rgba(42,40,38,0.18)", display: "flex" }} />

          <div style={{ display: "flex", flexDirection: "column" }}>
            <div
              style={{
                fontSize: 14,
                color: "rgba(42,40,38,0.5)",
                letterSpacing: 4,
                textTransform: "uppercase",
                display: "flex",
              }}
            >
              YOUR ONE THING
            </div>
            <div
              style={{
                fontStyle: "italic",
                fontSize: 60,
                lineHeight: 1,
                fontWeight: 400,
                color: "#A78B71",
                marginTop: 14,
                display: "flex",
              }}
            >
              {concern}
            </div>
          </div>
        </div>

        {/* Hairline */}
        <div
          style={{
            position: "absolute",
            top: 1520,
            left: 200,
            right: 200,
            height: 1,
            background: "rgba(42,40,38,0.18)",
            display: "flex",
          }}
        />

        {/* Signature */}
        <div
          style={{
            position: "absolute",
            bottom: 84,
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
              fontSize: 24,
              color: "rgba(42,40,38,0.6)",
              display: "flex",
            }}
          >
            futureyou.mirror
          </div>
          <div
            style={{
              fontSize: 14,
              color: "rgba(42,40,38,0.45)",
              marginTop: 12,
              letterSpacing: 5,
              textTransform: "uppercase",
              display: "flex",
            }}
          >
            share #futureyoumirror
          </div>
        </div>
      </div>
    ),
    {
      width: W,
      height: H,
    },
  );
}
