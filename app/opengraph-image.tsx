import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OGImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(150deg, #F8F5F0 0%, #EFE6D8 60%, #E8D9C7 100%)",
        position: "relative",
      }}
    >
      {/* Oval mirror motif */}
      <div
        style={{
          position: "absolute",
          width: 380,
          height: 460,
          borderRadius: "50%",
          border: "1px solid rgba(167,139,113,0.35)",
          background: "rgba(245,212,184,0.12)",
        }}
      />
      <div
        style={{
          position: "absolute",
          width: 240,
          height: 300,
          borderRadius: "50%",
          border: "1px solid rgba(42,40,38,0.12)",
        }}
      />

      {/* Content */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          position: "relative",
          zIndex: 1,
        }}
      >
        <div
          style={{
            fontSize: 13,
            letterSpacing: "0.28em",
            color: "rgba(42,40,38,0.5)",
            textTransform: "uppercase",
            marginBottom: 28,
          }}
        >
          EDITION · Nº 01
        </div>

        <div
          style={{
            fontSize: 88,
            fontWeight: 300,
            color: "#2A2826",
            letterSpacing: "-0.02em",
            lineHeight: 1,
            textAlign: "center",
          }}
        >
          Future You Mirror
        </div>

        <div
          style={{
            marginTop: 32,
            fontSize: 30,
            color: "#A78B71",
            fontStyle: "italic",
            textAlign: "center",
            maxWidth: 640,
            lineHeight: 1.4,
          }}
        >
          See the skin you&apos;ll have — and the one you could.
        </div>

        <div
          style={{
            marginTop: 28,
            fontSize: 13,
            color: "rgba(42,40,38,0.38)",
            letterSpacing: "0.22em",
            textTransform: "uppercase",
          }}
        >
          ONE SELFIE · TWO MINUTES
        </div>
      </div>

      {/* Bottom edge label */}
      <div
        style={{
          position: "absolute",
          bottom: 32,
          fontSize: 11,
          letterSpacing: "0.2em",
          color: "rgba(42,40,38,0.3)",
          textTransform: "uppercase",
        }}
      >
        PERFECT CORP × PEGASUS STARTUP WORLD CUP
      </div>
    </div>,
    size,
  );
}
