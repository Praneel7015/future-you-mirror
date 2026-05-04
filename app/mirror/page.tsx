"use client";

import { Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { useMirror } from "@/lib/store";
import type { AnalyzeResponse } from "@/app/api/analyze/route";

import ConsentStep from "@/components/mirror/ConsentStep";
import CaptureStep from "@/components/mirror/CaptureStep";
import LoadingStep from "@/components/mirror/LoadingStep";
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

  useEffect(() => {
    if (!isDemo) return;
    let cancelled = false;
    setStep("loading");
    fetch("/sample.json")
      .then((r) => {
        if (!r.ok) throw new Error(`sample.json fetch failed (${r.status})`);
        return r.json() as Promise<AnalyzeResponse>;
      })
      .then((data) => {
        if (cancelled) return;
        setResult(data);
        setTimeout(() => !cancelled && setStep("reveal"), 1800);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err.message ?? "Could not load sample");
        setStep("capture");
      });
    return () => {
      cancelled = true;
    };
  }, [isDemo, setStep, setResult, setError]);

  return (
    <main className="min-h-screen w-full flex flex-col">
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
          className="min-h-screen w-full flex flex-col"
        >
          {step === "consent" && <ConsentStep />}
          {step === "capture" && <CaptureStep />}
          {step === "loading" && <LoadingStep />}
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
        <main className="min-h-screen w-full flex items-center justify-center" style={{ background: "#F8F5F0" }}>
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
