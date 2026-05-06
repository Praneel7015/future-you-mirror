import { NextResponse } from "next/server";
import { analyzeErrorResponse } from "@/lib/analyze-errors";
import { processUpload, ImageError } from "@/lib/image-utils";
import { analyzeSkin } from "@/lib/perfectcorp/skin-analysis";
import { generateAging } from "@/lib/perfectcorp/aging";
import type { SkinResult, AgingResult } from "@/lib/perfectcorp/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

export interface AnalyzeResponse {
  skin: SkinResult;
  aging: AgingResult;
  meta: {
    hash: string;
    width: number;
    height: number;
    cached: boolean; // true if both results came from cache
  };
}

export async function POST(req: Request) {
  try {
    let form: FormData;
    try {
      form = await req.formData();
    } catch {
      return NextResponse.json(
        { error: "invalid_body", reason: "invalid_upload", message: "We couldn’t read your upload — please try again." },
        { status: 400 },
      );
    }

    const file = form.get("image");
    if (!(file instanceof File)) {
      return NextResponse.json(
        {
          error: "missing_image",
          reason: "missing_image",
          message: "No photo was attached — choose or take a picture first.",
        },
        { status: 400 },
      );
    }

    const bytes = Buffer.from(await file.arrayBuffer());
    let processed;
    try {
      processed = await processUpload(bytes, file.type);
    } catch (err) {
      if (err instanceof ImageError) {
        const { status, body } = analyzeErrorResponse(err);
        return NextResponse.json(body, { status });
      }
      throw err;
    }

    const startedAt = Date.now();
    const [skin, aging] = await Promise.all([
      analyzeSkin(processed),
      generateAging(processed),
    ]);

    const elapsed = Date.now() - startedAt;
    const body: AnalyzeResponse = {
      skin,
      aging,
      meta: {
        hash: processed.hash,
        width: processed.width,
        height: processed.height,
        cached: elapsed < 500,
      },
    };
    return NextResponse.json(body, { status: 200 });
  } catch (err) {
    const { status, body } = analyzeErrorResponse(err);
    if (status >= 500) {
      console.error("[analyze] error:", err);
    }
    return NextResponse.json(body, { status });
  }
}
