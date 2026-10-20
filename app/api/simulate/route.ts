import { existsSync } from "node:fs";
import path from "node:path";
import { NextRequest, NextResponse } from "next/server";
import { simulateSkin, type SkinSimParams } from "@/lib/perfectcorp/skin-sim";
import { PerfectCorpError } from "@/lib/perfectcorp/client";
import { publicOriginFrom, toAbsoluteRequestUrl } from "@/lib/request-absolute-url";
import { plainMirrorError } from "@/lib/plain-errors";
import { planSimulate } from "@/lib/simulate-plan";

export const runtime = "nodejs";
export const maxDuration = 60;

export interface SimulateResponse {
  imageUrl: string;
  mode: "demo" | "live";
}

function fail(status: number, error: string, message: string) {
  return NextResponse.json({ error, message }, { status });
}

export async function POST(req: NextRequest) {
  let body: Partial<SkinSimParams> & { demo?: boolean };
  try {
    body = (await req.json()) as Partial<SkinSimParams> & { demo?: boolean };
  } catch {
    return fail(400, "invalid_body", "Could not read the simulation request.");
  }

  const demo =
    body.demo === true || req.nextUrl.searchParams.get("demo") === "true";
  const plan = planSimulate({ sourceUrl: body.sourceUrl, demo });

  if (plan.action === "error") {
    return fail(plan.status, plan.error, plan.message);
  }

  if (plan.action === "demo") {
    const file = path.join(process.cwd(), "public", plan.imageUrl.replace(/^\//, ""));
    if (!existsSync(file)) {
      return fail(
        500,
        "demo_asset_missing",
        "The sample with-care photo is missing on the server. Perfect Corp was not called.",
      );
    }
    return NextResponse.json({
      imageUrl: plan.imageUrl,
      mode: "demo",
    } satisfies SimulateResponse);
  }

  if (!body.sourceUrl) {
    return fail(400, "source_required", "sourceUrl required");
  }

  const origin = publicOriginFrom(req.headers, req.nextUrl.origin);
  const sourceUrl = toAbsoluteRequestUrl(body.sourceUrl, origin);

  try {
    const imageUrl = await simulateSkin({
      sourceUrl,
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

    return NextResponse.json({ imageUrl, mode: "live" } satisfies SimulateResponse);
  } catch (err) {
    if (err instanceof PerfectCorpError) {
      const status =
        err.code === "bad_source_url" ||
        err.code === "source_download_failed" ||
        err.code === "invalid_params"
          ? 400
          : 502;
      console.error("[simulate]", err.code, err.message);
      return fail(status, err.code, plainMirrorError({ code: err.code, message: err.message }));
    }
    const message = err instanceof Error ? err.message : "Simulation failed";
    console.error("[simulate]", message);
    if (/Missing Perfect Corp env/i.test(message)) {
      return fail(503, "missing_credentials", plainMirrorError({ code: "missing_credentials", message }));
    }
    if (/auth failed/i.test(message)) {
      return fail(502, "auth_failed", plainMirrorError({ code: "auth_failed", message }));
    }
    return fail(502, "simulation_failed", plainMirrorError({ code: "simulation_failed", message }));
  }
}
