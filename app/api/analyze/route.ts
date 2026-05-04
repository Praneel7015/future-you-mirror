import { NextResponse } from "next/server";
import { processUpload, ImageError } from "@/lib/image-utils";
import { analyzeSkin } from "@/lib/perfectcorp/skin-analysis";
import { generateAging } from "@/lib/perfectcorp/aging";
import { PerfectCorpError } from "@/lib/perfectcorp/client";
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
  let form: FormData;
  try {
    form = await req.formData();
  } catch (err) {
    return NextResponse.json(
      { error: "invalid_body", message: `Could not read multipart form: ${(err as Error).message}` },
      { status: 400 },
    );
  }

  const file = form.get("image");
  if (!(file instanceof File)) {
    return NextResponse.json(
      { error: "missing_image", message: "Form field 'image' is required and must be a file." },
      { status: 400 },
    );
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  let processed;
  try {
    processed = await processUpload(bytes, file.type);
  } catch (err) {
    if (err instanceof ImageError) {
      return NextResponse.json({ error: err.code, message: err.message }, { status: 400 });
    }
    throw err;
  }

  const startedAt = Date.now();
  try {
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
        cached: elapsed < 500, // both layers hit memory/disk → near-instant
      },
    };
    return NextResponse.json(body, { status: 200 });
  } catch (err) {
    if (err instanceof PerfectCorpError) {
      return NextResponse.json(
        {
          error: err.code,
          message: err.message,
          httpStatus: err.httpStatus,
          payload: err.payload,
        },
        { status: 502 },
      );
    }
    throw err;
  }
}
