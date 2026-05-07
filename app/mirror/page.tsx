"use client";

import { Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { useMirror } from "@/lib/store";
import type { AnalyzeResponse } from "@/app/api/analyze/route";

import ConsentStep from "@/components/mirror/ConsentStep";
import CaptureStep from "@/components/mirror/CaptureStep";
import LoadingStep from "@/components/mirror/LoadingStep";
import MorphStep from "@/components/mirror/MorphStep";
import SkinAgeRevealStep from "@/components/mirror/SkinAgeRevealStep";
import SplitMirrorStep from "@/components/mirror/SplitMirrorStep";
import InsightsStep from "@/components/mirror/InsightsStep";
import ShareStep from "@/components/mirror/ShareStep";

const STEP_DOCUMENT_BG: Record<string, string> = {
  consent: "#F8F5F0",
  capture: "#0E0C0A",
  loading: "#2A2420",
  morph: "#0E0C0A",
  reveal: "#F8F5F0",
  split: "#1a1612",
  insights: "#F8F5F0",
  share: "#F8F5F0",
};

function MirrorFlow() {
  const params = useSearchParams();
  const isDemo = params.get("demo") === "true";

  const step = useMirror((s) => s.step);
  const setStep = useMirror((s) => s.setStep);
  const setResult = useMirror((s) => s.setResult);
  const setError = useMirror((s) => s.setError);

  useEffect(() => {
    const bg = STEP_DOCUMENT_BG[step] ?? "#F8F5F0";
    const html = document.documentElement;
    const body = document.body;
    const prevHtml = html.style.backgroundColor;
    const prevBody = body.style.backgroundColor;
    html.style.backgroundColor = bg;
    body.style.backgroundColor = bg;
    return () => {
      html.style.backgroundColor = prevHtml;
      body.style.backgroundColor = prevBody;
    };
  }, [step]);

  useEffect(() => {
    if (!isDemo) return;
    let cancelled = false;
    setStep("loading");

    const preload = (url: string) =>
      new Promise<void>((resolve) => {
        if (!url) return resolve();
        const img = new Image();
        const timer = window.setTimeout(resolve, 12000);
        img.onload = () => {
          window.clearTimeout(timer);
          resolve();
        };
        img.onerror = () => {
          window.clearTimeout(timer);
          resolve();
        };
        img.src = url;
      });

    (async () => {
      try {
        const r = await fetch("/sample.json");
        if (!r.ok) throw new Error(`sample.json fetch failed (${r.status})`);
        const data = (await r.json()) as AnalyzeResponse;
        if (cancelled) return;
        setResult(data);

        // Wait for every aging photo to cache before leaving the loading screen
        const photoUrls = data.aging.photos.map((p) => p.url);
        const minHold = new Promise<void>((res) => setTimeout(res, 2200));
        await Promise.all([Promise.all(photoUrls.map(preload)), minHold]);
        if (cancelled) return;
        setStep("morph");
      } catch (err) {
        if (cancelled) return;
        const msg = err instanceof Error ? err.message : "Could not load sample";
        setError(msg);
        setStep("capture");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isDemo, setStep, setResult, setError]);

  return (
    <main className="min-h-dvh w-full flex flex-col">
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
          className="min-h-dvh w-full flex flex-col bg-transparent"
        >
          {step === "consent" && <ConsentStep />}
          {step === "capture" && <CaptureStep />}
          {step === "loading" && <LoadingStep />}
          {step === "morph" && <MorphStep />}
          {step === "reveal" && <SkinAgeRevealStep />}
          {step === "split" && <SplitMirrorStep />}
          {step === "insights" && <InsightsStep />}
          {step === "share" && <ShareStep />}
        </motion.div>
      </AnimatePresence>
    </main>
  );
}

export default function MirrorPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-dvh w-full flex items-center justify-center" style={{ background: "#F8F5F0" }}>
          <div className="font-serif text-lg" style={{ color: "rgba(42,40,38,0.5)" }}>
            Preparing your mirror…
          </div>
        </main>
      }
    >
      <MirrorFlow />
    </Suspense>
  );
}
