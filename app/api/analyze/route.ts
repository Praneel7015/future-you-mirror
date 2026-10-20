import { NextResponse } from "next/server";
import { processUpload, ImageError } from "@/lib/image-utils";
import { analyzeSkin } from "@/lib/perfectcorp/skin-analysis";
import { generateAging } from "@/lib/perfectcorp/aging";
import { PerfectCorpError } from "@/lib/perfectcorp/client";
import { plainMirrorError } from "@/lib/plain-errors";
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
    } catch (err) {
      console.error("[analyze]", "invalid_body", (err as Error).message);
      return NextResponse.json(
        {
          error: "invalid_body",
          message: plainMirrorError({ code: "invalid_body", message: "Could not read the photo." }),
        },
        { status: 400 },
      );
    }

    const file = form.get("image");
    if (!(file instanceof File)) {
      return NextResponse.json(
        {
          error: "missing_image",
          message: plainMirrorError({ code: "missing_image", message: "A photo is required." }),
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
        console.error("[analyze]", err.code, err.message);
        return NextResponse.json(
          { error: err.code, message: plainMirrorError({ code: err.code, message: err.message }) },
          { status: 400 },
        );
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
    // Always return JSON — never let Next.js return an HTML error page
    if (err instanceof PerfectCorpError) {
      console.error("[analyze]", err.code, err.message);
      return NextResponse.json(
        { error: err.code, message: plainMirrorError({ code: err.code, message: err.message }) },
        { status: 502 },
      );
    }
    const message = err instanceof Error ? err.message : "Unexpected server error";
    console.error("[analyze]", message);
    return NextResponse.json(
      { error: "server_error", message: plainMirrorError({ code: "server_error", message }) },
      { status: 500 },
    );
  }
}
