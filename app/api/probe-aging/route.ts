// TODO: REMOVE BEFORE DEPLOY
// Dev-only probe to discover the AI Aging v2.0 task body schema.
// Sends several invalid POSTs and returns each error so we can read the field
// names Perfect Corp complains about. Disabled in production.

import { NextResponse } from "next/server";
import { getAccessToken } from "@/lib/perfectcorp/auth";

export const dynamic = "force-dynamic";

const DATA_BASE =
  process.env.PERFECT_CORP_DATA_BASE ?? "https://yce-api-01.makeupar.com";

const VARIANTS: Array<{ label: string; body: unknown }> = [
  { label: "empty", body: {} },
  { label: "src_file_id only", body: { src_file_id: "probe_fake_id" } },
  { label: "src_file_id + format", body: { src_file_id: "probe_fake_id", format: "json" } },
  {
    label: "src_file_id + age_min/max + num_of_photos",
    body: { src_file_id: "probe_fake_id", age_min: 20, age_max: 70, num_of_photos: 16 },
  },
  {
    label: "v1.0-style payload envelope",
    body: { request_id: 1, payload: { file_sets: { src_ids: ["probe_fake_id"] } } },
  },
  {
    label: "src_file_id + dst_actions array",
    body: { src_file_id: "probe_fake_id", dst_actions: ["aging"], format: "json" },
  },
];

export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Disabled in production" }, { status: 404 });
  }

  let token: string;
  try {
    token = await getAccessToken();
  } catch (err) {
    return NextResponse.json(
      { error: "auth failed", detail: (err as Error).message },
      { status: 500 },
    );
  }

  const url = `${DATA_BASE}/s2s/v2.0/task/aging`;
  const results: Array<{
    label: string;
    sent: unknown;
    httpStatus: number;
    response: unknown;
  }> = [];

  for (const variant of VARIANTS) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(variant.body),
        cache: "no-store",
      });
      const text = await res.text();
      let parsed: unknown = text;
      try {
        parsed = JSON.parse(text);
      } catch {
        // keep as string
      }
      results.push({
        label: variant.label,
        sent: variant.body,
        httpStatus: res.status,
        response: parsed,
      });
    } catch (err) {
      results.push({
        label: variant.label,
        sent: variant.body,
        httpStatus: 0,
        response: { fetch_error: (err as Error).message },
      });
    }
  }

  return NextResponse.json({ url, results }, { status: 200 });
}
