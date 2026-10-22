"use client";

import { Suspense, useEffect, useLayoutEffect } from "react";
import { useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { useMirror } from "@/lib/store";
import type { AnalyzeResponse } from "@/app/api/analyze/route";

import ConsentStep from "@/components/mirror/ConsentStep";
import AgeStep from "@/components/mirror/AgeStep";
import CaptureStep from "@/components/mirror/CaptureStep";
import LoadingStep from "@/components/mirror/LoadingStep";
import MorphStep from "@/components/mirror/MorphStep";
import SkinAgeRevealStep from "@/components/mirror/SkinAgeRevealStep";
import SplitMirrorStep from "@/components/mirror/SplitMirrorStep";
import InsightsStep from "@/components/mirror/InsightsStep";
import ShareStep from "@/components/mirror/ShareStep";

function MirrorFlow() {
  const params = useSearchParams();
  const isDemo = params.get("demo") === "true";

  const step = useMirror((s) => s.step);
  const setStep = useMirror((s) => s.setStep);
  const setResult = useMirror((s) => s.setResult);
  const setError = useMirror((s) => s.setError);
  const reset = useMirror((s) => s.reset);

  useLayoutEffect(() => {
    if (!isDemo) return;
    reset();
    setStep("age");
  }, [isDemo, reset, setStep]);

  useEffect(() => {
    if (!isDemo || step !== "loading") return;
    let cancelled = false;

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
        setStep("age");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isDemo, step, setStep, setResult, setError]);

  return (
    <main
      className="min-h-dvh w-full flex flex-col"
      style={{ overscrollBehaviorY: "contain" }}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
          className="min-h-dvh w-full flex flex-col"
        >
          {step === "consent" && <ConsentStep />}
          {step === "age" && <AgeStep />}
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
