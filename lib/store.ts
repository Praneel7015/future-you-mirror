import { create } from "zustand";
import type { AnalyzeResponse } from "@/app/api/analyze/route";
import type { MonthChangeId } from "@/lib/month-change";

export type MirrorStep =
  | "consent"
  | "capture"
  | "loading"
  | "morph"
  | "reveal"
  | "split"
  | "insights"
  | "share";

interface MirrorState {
  step: MirrorStep;
  result: AnalyzeResponse | null;
  error: string | null;

  sun: number;
  hyd: number;
  sleep: number;
  routine: number;

  scrubAge: number;
  monthChange: MonthChangeId | null;

  setStep: (step: MirrorStep) => void;
  setResult: (result: AnalyzeResponse) => void;
  setError: (err: string | null) => void;
  setSun: (v: number) => void;
  setHyd: (v: number) => void;
  setSleep: (v: number) => void;
  setRoutine: (v: number) => void;
  setScrubAge: (v: number) => void;
  setMonthChange: (monthChange: MonthChangeId) => void;
  reset: () => void;
}

const initial = {
  step: "consent" as MirrorStep,
  result: null,
  error: null,
  sun: 72,
  hyd: 38,
  sleep: 55,
  routine: 82,
  scrubAge: 45,
  monthChange: null as MonthChangeId | null,
};

export const useMirror = create<MirrorState>((set) => ({
  ...initial,
  setStep: (step) => set({ step }),
  setResult: (result) => set({ result }),
  setError: (error) => set({ error }),
  setSun: (sun) => set({ sun }),
  setHyd: (hyd) => set({ hyd }),
  setSleep: (sleep) => set({ sleep }),
  setRoutine: (routine) => set({ routine }),
  setScrubAge: (scrubAge) => set({ scrubAge }),
  setMonthChange: (monthChange) => set({ monthChange }),
  reset: () => set(initial),
}));

// sun = "Sun protection" (0=none, 100=max). All inputs: higher is better.
export function careScore(s: { sun: number; hyd: number; sleep: number; routine: number }): number {
  return (s.sun + s.hyd + s.sleep + s.routine) / 4;
}

export function findClosestPhoto<T extends { res_age: number }>(photos: T[], targetAge: number): T | null {
  if (photos.length === 0) return null;
  return photos.reduce((best, p) =>
    Math.abs(p.res_age - targetAge) < Math.abs(best.res_age - targetAge) ? p : best,
  );
}
