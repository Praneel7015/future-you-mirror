import { NextRequest, NextResponse } from "next/server";
import { simulateSkin, type SkinSimParams } from "@/lib/perfectcorp/skin-sim";
import { toAbsoluteRequestUrl } from "@/lib/request-absolute-url";

export const maxDuration = 60;

export interface SimulateResponse {
  imageUrl: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Partial<SkinSimParams>;

    if (!body.sourceUrl || typeof body.sourceUrl !== "string") {
      return NextResponse.json({ error: "sourceUrl required" }, { status: 400 });
    }

    const imageUrl = await simulateSkin({
      sourceUrl: toAbsoluteRequestUrl(body.sourceUrl, req.nextUrl.origin),
      radiance: body.radiance ?? 0,
      wrinkles: body.wrinkles ?? 0,
      spots: body.spots ?? 0,
      eye_bags: body.eye_bags ?? 0,
      dark_circles: body.dark_circles ?? 0,
      pores: body.pores ?? 0,
      texture: body.texture ?? 0,
      redness: body.redness ?? 0,
      oiliness: body.oiliness ?? 0,
      acne: body.acne ?? 0,
    });

    return NextResponse.json({ imageUrl } satisfies SimulateResponse);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Simulation failed";
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
