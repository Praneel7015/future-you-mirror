"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useDropzone } from "react-dropzone";
import { useMirror } from "@/lib/store";
import type { AnalyzeResponse } from "@/app/api/analyze/route";

type CameraState = "idle" | "live" | "captured";

/**
 * Preload an image into the browser's HTTP cache so the next <img src=...>
 * paint is instant. Errors and timeouts resolve quietly — never reject —
 * so a single bad URL can't stall the flow.
 */
function preloadImage(url: string, timeoutMs = 12000): Promise<void> {
  return new Promise((resolve) => {
    if (!url) return resolve();
    const img = new Image();
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      resolve();
    };
    const timer = window.setTimeout(finish, timeoutMs);
    img.onload = () => {
      window.clearTimeout(timer);
      finish();
    };
    img.onerror = () => {
      window.clearTimeout(timer);
      finish();
    };
    img.src = url;
  });
}

function preloadAll(urls: string[]): Promise<void> {
  return Promise.all(urls.map((u) => preloadImage(u))).then(() => undefined);
}

export default function CaptureStep() {
  const setStep = useMirror((s) => s.setStep);
  const setResult = useMirror((s) => s.setResult);
  const setError = useMirror((s) => s.setError);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [cameraState, setCameraState] = useState<CameraState>("idle");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [statusText, setStatusText] = useState("Soft light, eyes forward, no glasses.");

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);

  useEffect(() => () => stopCamera(), [stopCamera]);

  const submitImage = useCallback(
    async (file: File) => {
      stopCamera();
      setCameraState("captured");
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
        clearInterval(fakeProgress);
        setProgress(100);

        // Parse as text first so a non-JSON response (HTML 500 page, etc.) never throws
        const text = await res.text();
        let data: AnalyzeResponse | { error: string; message?: string } | null = null;
        try {
          data = JSON.parse(text);
        } catch {
          // Server returned non-JSON — surface a helpful message
          const msg = res.ok
            ? "Something went wrong processing your photo. Please try again."
            : `Server error (${res.status}). Check that API keys are configured.`;
          setError(msg);
          setStatusText(msg);
          setProgress(null);
          setCameraState("idle");
          return;
        }

        if (!res.ok || !data || "error" in data) {
          const msg =
            data && "message" in data && data.message
              ? data.message
              : "We couldn't read this photo. Try another with a clear, frontal face.";
          setError(msg);
          setStatusText(msg);
          setProgress(null);
          setCameraState("idle");
          return;
        }

        setResult(data);
        setStep("loading");

        // Stay on the loading screen until every aging photo is cached so
        // morph + reveal + split don't render half-loaded images. We give
        // the screen a minimum hold so loading copy has time to be read.
        const photoUrls = data.aging.photos.map((p) => p.url);
        const minHold = new Promise<void>((r) => setTimeout(r, 2200));
        await Promise.all([preloadAll(photoUrls), minHold]);
        setStep("morph");
      } catch (err) {
        clearInterval(fakeProgress);
        const msg = err instanceof Error ? err.message : "Network issue — please try again.";
        setError(msg);
        setStatusText(msg);
        setProgress(null);
        setCameraState("idle");
      }
    },
    [setStep, setResult, setError, stopCamera],
  );

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 960 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraState("live");
      setStatusText("Position your face in the oval.");
    } catch {
      // getUserMedia not available — fall back to file input
      fileInputRef.current?.click();
    }
  }, []);

  const captureFrame = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d")!;
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0);
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        submitImage(new File([blob], "selfie.jpg", { type: "image/jpeg" }));
      },
      "image/jpeg",
      0.92,
    );
  }, [submitImage]);

  const onDrop = useCallback(
    (accepted: File[]) => {
      if (accepted[0]) submitImage(accepted[0]);
    },
    [submitImage],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/jpeg": [".jpg", ".jpeg"],
      "image/png": [".png"],
      "image/heic": [".heic"],
      "image/heif": [".heif"],
    },
    multiple: false,
    noClick: true,
    noKeyboard: true,
  });

  return (
    <div
      {...getRootProps()}
      className="flex-1 flex flex-col w-full relative"
      style={{
        background: "radial-gradient(80% 80% at 50% 45%, #2D2925 0%, #1A1714 70%, #0E0C0A 100%)",
        minHeight: "100dvh",
      }}
    >
      <input {...getInputProps()} />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/heic,image/heif"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) submitImage(file);
        }}
        className="hidden"
      />

      {/* vignette */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(120% 80% at 50% 40%, transparent 30%, rgba(0,0,0,0.55) 100%)",
        }}
      />

      {/* drag overlay */}
      {isDragActive && (
        <div
          className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none"
          style={{ background: "rgba(167,139,113,0.18)", backdropFilter: "blur(2px)" }}
        >
          <div className="font-serif text-2xl" style={{ color: "#F8F5F0" }}>
            Drop to read
          </div>
        </div>
      )}

      <div className="relative z-10 flex-1 flex flex-col px-6 pt-16 pb-12 w-full">
        <div
          className="text-[10px] uppercase"
          style={{ letterSpacing: "0.28em", color: "rgba(248,245,240,0.55)", fontStyle: "italic" }}
        >
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
            {/* oval container */}
            <div
              className="absolute inset-0 overflow-hidden"
              style={{
                borderRadius: "50% / 50%",
                border: "1px solid rgba(248,245,240,0.55)",
                boxShadow: "0 0 0 1px rgba(248,245,240,0.05) inset",
              }}
            >
              {/* live video */}
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="absolute w-full h-full object-cover"
                style={{
                  display: cameraState === "live" ? "block" : "none",
                  transform: "scaleX(-1)",
                }}
              />
              {/* captured preview */}
              {previewUrl && cameraState === "captured" && (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={previewUrl} alt="" className="absolute w-full h-full object-cover" style={{ opacity: 0.92 }} />
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
                  whiteSpace: "nowrap",
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
          <div className="flex items-center gap-3">
            {cameraState === "live" ? (
              <button
                onClick={captureFrame}
                className="flex-1 rounded-full font-medium"
                style={{
                  height: 52,
                  background: "#F8F5F0",
                  color: "#2A2826",
                  fontSize: 14,
                  letterSpacing: "0.02em",
                }}
              >
                Capture
              </button>
            ) : (
              <button
                onClick={startCamera}
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
            )}

            {cameraState !== "live" && (
              <>
                <span className="font-serif italic text-[14px]" style={{ color: "rgba(248,245,240,0.5)" }}>
                  or
                </span>
                <button
                  onClick={() => fileInputRef.current?.click()}
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
              </>
            )}
          </div>

          {cameraState === "live" && (
            <button
              onClick={() => {
                stopCamera();
                setCameraState("idle");
                setStatusText("Soft light, eyes forward, no glasses.");
              }}
              className="w-full mt-3 text-[11px]"
              style={{ color: "rgba(248,245,240,0.4)", letterSpacing: "0.06em" }}
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
