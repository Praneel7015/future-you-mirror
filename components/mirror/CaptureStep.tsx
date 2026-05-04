"use client";

import { useCallback, useRef, useState } from "react";
import { useDropzone } from "react-dropzone";
import { useMirror } from "@/lib/store";
import type { AnalyzeResponse } from "@/app/api/analyze/route";

export default function CaptureStep() {
  const setStep = useMirror((s) => s.setStep);
  const setResult = useMirror((s) => s.setResult);
  const setError = useMirror((s) => s.setError);

  const cameraInputRef = useRef<HTMLInputElement>(null);

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [statusText, setStatusText] = useState<string>("Soft light, eyes forward, no glasses.");

  const submitImage = useCallback(
    async (file: File) => {
      setError(null);

      const objectUrl = URL.createObjectURL(file);
      setPreviewUrl(objectUrl);

      const fd = new FormData();
      fd.append("image", file);

      setProgress(0);
      setStatusText(`Reading · ${file.name.length > 28 ? file.name.slice(0, 28) + "…" : file.name}`);

      const fakeProgress = setInterval(() => {
        setProgress((p) => {
          if (p === null) return null;
          if (p >= 92) return p;
          return p + Math.random() * 6;
        });
      }, 350);

      try {
        const res = await fetch("/api/analyze", { method: "POST", body: fd });
        const data = (await res.json()) as AnalyzeResponse | { error: string; message?: string };

        clearInterval(fakeProgress);
        setProgress(100);

        if (!res.ok || "error" in data) {
          const msg = "message" in data && data.message ? data.message : "We couldn't read this photo. Try another with a clear, frontal face.";
          setError(msg);
          setStatusText(msg);
          setProgress(null);
          return;
        }

        setResult(data);
        setStep("loading");
        setTimeout(() => setStep("reveal"), 1800);
      } catch (err) {
        clearInterval(fakeProgress);
        const msg = (err as Error).message ?? "Network issue — please try again.";
        setError(msg);
        setStatusText(msg);
        setProgress(null);
      }
    },
    [setStep, setResult, setError],
  );

  const onDrop = useCallback(
    (accepted: File[]) => {
      if (accepted[0]) submitImage(accepted[0]);
    },
    [submitImage],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/jpeg": [".jpg", ".jpeg"], "image/png": [".png"], "image/heic": [".heic"], "image/heif": [".heif"] },
    multiple: false,
    noClick: true,
    noKeyboard: true,
  });

  const onCameraChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) submitImage(file);
  };

  return (
    <div
      {...getRootProps()}
      className="flex-1 flex flex-col w-full relative overflow-hidden"
      style={{
        background: "radial-gradient(80% 80% at 50% 45%, #2D2925 0%, #1A1714 70%, #0E0C0A 100%)",
        minHeight: "100vh",
      }}
    >
      <input {...getInputProps()} />

      {/* vignette */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: "radial-gradient(120% 80% at 50% 40%, transparent 30%, rgba(0,0,0,0.5) 100%)" }}
      />

      {/* Drag-active overlay */}
      {isDragActive && (
        <div
          className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none"
          style={{ background: "rgba(167,139,113,0.18)", backdropFilter: "blur(2px)" }}
        >
          <div
            className="font-serif text-2xl"
            style={{ color: "#F8F5F0" }}
          >
            Drop to read
          </div>
        </div>
      )}

      <div className="relative z-10 flex-1 flex flex-col px-6 pt-16 pb-12 max-w-md mx-auto w-full">
        <div className="text-[10px] uppercase" style={{ letterSpacing: "0.28em", color: "rgba(248,245,240,0.55)", fontStyle: "italic" }}>
          Capture
        </div>
        <div
          className="mt-2"
          style={{
            fontFamily: "var(--font-serif)",
            color: "#F8F5F0",
            fontSize: 22,
            fontWeight: 400,
            lineHeight: 1.25,
          }}
        >
          Frame your face within the oval.
        </div>

        {/* Oval */}
        <div className="flex-1 flex items-center justify-center my-8">
          <div className="relative" style={{ width: 240, height: 320 }}>
            <div
              className="absolute inset-0 overflow-hidden"
              style={{
                borderRadius: "50% / 50%",
                border: "1px solid rgba(248,245,240,0.55)",
                boxShadow: "0 0 0 1px rgba(248,245,240,0.05) inset",
              }}
            >
              {previewUrl ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={previewUrl} alt="" className="w-full h-full object-cover" style={{ opacity: 0.92 }} />
              ) : (
                <div className="w-full h-full" />
              )}
            </div>

            {/* corner ticks */}
            {[0, 90, 180, 270].map((deg) => (
              <div
                key={deg}
                className="absolute"
                style={{
                  top: "50%",
                  left: "50%",
                  width: 1,
                  height: 8,
                  background: "rgba(248,245,240,0.4)",
                  transform: `translate(-50%, -50%) rotate(${deg}deg) translateY(-168px)`,
                }}
              />
            ))}

            {progress !== null && (
              <div
                className="absolute text-[10px]"
                style={{
                  left: "50%",
                  bottom: -28,
                  transform: "translateX(-50%)",
                  letterSpacing: "0.22em",
                  color: "rgba(248,245,240,0.7)",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                READING · {Math.round(progress)}%
              </div>
            )}
          </div>
        </div>

        <div className="text-center text-[12px]" style={{ color: "rgba(248,245,240,0.55)" }}>
          {statusText}
        </div>

        <div className="mt-6">
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="user"
            onChange={onCameraChange}
            className="hidden"
          />

          <div className="flex items-center gap-3">
            <button
              onClick={() => cameraInputRef.current?.click()}
              disabled={progress !== null}
              className="flex-1 rounded-full font-medium transition-all disabled:opacity-50"
              style={{
                height: 52,
                background: "#F8F5F0",
                color: "#2A2826",
                fontSize: 14,
                letterSpacing: "0.02em",
              }}
            >
              Take a selfie
            </button>
            <span className="font-serif italic text-[14px]" style={{ color: "rgba(248,245,240,0.5)" }}>
              or
            </span>
            <button
              onClick={() => {
                const input = document.createElement("input");
                input.type = "file";
                input.accept = "image/jpeg,image/png,image/heic,image/heif";
                input.onchange = (e) => {
                  const file = (e.target as HTMLInputElement).files?.[0];
                  if (file) submitImage(file);
                };
                input.click();
              }}
              disabled={progress !== null}
              className="flex-1 rounded-full font-medium transition-all disabled:opacity-50"
              style={{
                height: 52,
                background: "transparent",
                color: "#F8F5F0",
                border: "1px solid rgba(248,245,240,0.4)",
                fontSize: 14,
                letterSpacing: "0.02em",
              }}
            >
              Upload a photo
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
