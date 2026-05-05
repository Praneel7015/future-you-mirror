import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

const W = 1080;
const H = 1920;

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const nowUrl = sp.get("nowUrl") ?? "";
  const futureUrl = sp.get("futureUrl") ?? "";
  const score = Math.max(0, Math.min(100, Number(sp.get("score") ?? "73")));
  const concern = sp.get("concern") ?? "hydration";
  const nowYear = sp.get("nowYear") ?? String(new Date().getFullYear());
  const futureYear = sp.get("futureYear") ?? String(new Date().getFullYear() + 35);
  const futureLabel = sp.get("futureLabel") ?? "AT SIXTY-FIVE";

  const filledArc = (score / 100) * 2 * Math.PI * 56;
  const totalArc = 2 * Math.PI * 56;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "flex-start",
          background:
            "linear-gradient(180deg, #F1E8DC 0%, #E8D9C7 100%)",
          position: "relative",
        }}
      >
        {/* layered hero gradients */}
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

        {/* faint mocha oval watermark */}
        <div
          style={{
            position: "absolute",
            left: 160,
            top: 410,
            width: 760,
            height: 1100,
            borderRadius: 760,
            border: "2px solid rgba(167,139,113,0.18)",
            display: "flex",
          }}
        />

        {/* editorial header */}
        <div
          style={{
            position: "absolute",
            top: 88,
            left: 0,
            right: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <div
            style={{
              fontSize: 22,
              letterSpacing: 8,
              color: "#A78B71",
              fontWeight: 500,
              textTransform: "uppercase",
            }}
          >
            FUTURE YOU MIRROR
          </div>
          <div
            style={{
              fontStyle: "italic",
              fontSize: 22,
              color: "rgba(42,40,38,0.55)",
              marginTop: 12,
            }}
          >
            Edition Nº 01
          </div>
        </div>

        {/* twin ovals */}
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
            { src: nowUrl, year: nowYear, label: "NOW" },
            { src: futureUrl, year: futureYear, label: futureLabel },
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
                  borderRadius: 380,
                  border: "2px solid rgba(42,40,38,0.18)",
                  overflow: "hidden",
                  position: "relative",
                  display: "flex",
                }}
              >
                {o.src ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={o.src}
                    alt=""
                    width={380}
                    height={500}
                    style={{
                      width: 380,
                      height: 500,
                      objectFit: "cover",
                      filter:
                        i === 0
                          ? "brightness(1.04) saturate(1.05)"
                          : "brightness(0.94) saturate(0.85) contrast(1.02)",
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
                  fontSize: 28,
                  marginTop: 24,
                  fontWeight: 400,
                  letterSpacing: 1.2,
                  color: "#2A2826",
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
                }}
              >
                {o.label}
              </div>
            </div>
          ))}
        </div>

        {/* italic mocha tagline */}
        <div
          style={{
            position: "absolute",
            top: 1000,
            left: 80,
            right: 80,
            display: "flex",
            justifyContent: "center",
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontStyle: "italic",
              fontSize: 64,
              lineHeight: 1.15,
              fontWeight: 400,
              color: "#A78B71",
              letterSpacing: -0.6,
              textAlign: "center",
            }}
          >
            a thirty-year letter,
            <br />
            written in skin.
          </div>
        </div>

        {/* score ring + concern */}
        <div
          style={{
            position: "absolute",
            top: 1280,
            left: 0,
            right: 0,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: 48,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
            <svg width="120" height="120" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="56" fill="none" stroke="rgba(167,139,113,0.18)" strokeWidth="3" />
              <circle
                cx="60"
                cy="60"
                r="56"
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
                  fontSize: 56,
                  lineHeight: 1,
                  fontWeight: 300,
                  letterSpacing: -2,
                  color: "#2A2826",
                }}
              >
                {Math.round(score)}
              </div>
              <div
                style={{
                  fontSize: 14,
                  color: "#A78B71",
                  marginTop: 6,
                  letterSpacing: 4,
                  textTransform: "uppercase",
                }}
              >
                SKIN SCORE
              </div>
            </div>
          </div>

          <div
            style={{ width: 1, height: 100, background: "rgba(42,40,38,0.18)", display: "flex" }}
          />

          <div style={{ display: "flex", flexDirection: "column" }}>
            <div
              style={{
                fontSize: 14,
                color: "rgba(42,40,38,0.5)",
                letterSpacing: 4,
                textTransform: "uppercase",
              }}
            >
              YOUR ONE THING
            </div>
            <div
              style={{
                fontStyle: "italic",
                fontSize: 56,
                lineHeight: 1,
                fontWeight: 400,
                color: "#A78B71",
                marginTop: 14,
              }}
            >
              {concern}
            </div>
          </div>
        </div>

        {/* hairline */}
        <div
          style={{
            position: "absolute",
            top: 1500,
            left: 200,
            right: 200,
            height: 1,
            background: "rgba(42,40,38,0.18)",
            display: "flex",
          }}
        />

        {/* signature */}
        <div
          style={{
            position: "absolute",
            bottom: 80,
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
              fontSize: 22,
              color: "rgba(42,40,38,0.6)",
            }}
          >
            futureyou.mirror
          </div>
          <div
            style={{
              fontSize: 14,
              color: "rgba(42,40,38,0.45)",
              marginTop: 10,
              letterSpacing: 5,
              textTransform: "uppercase",
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
