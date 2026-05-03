// TODO: REMOVE BEFORE DEPLOY
// Temporary verification endpoint. Returns a fresh Perfect Corp access token.
// Disabled in production builds via NODE_ENV check.

import { NextResponse } from "next/server";
import { getAccessToken } from "@/lib/perfectcorp/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Disabled in production" }, { status: 404 });
  }

  try {
    const token = await getAccessToken();
    return NextResponse.json({
      access_token: token,
      preview: token.slice(0, 24) + "…",
      length: token.length,
    });
  } catch (err) {
    const e = err as Error & { cause?: { code?: string; message?: string } };
    return NextResponse.json(
      {
        error: e.message,
        cause_code: e.cause?.code,
        cause_message: e.cause?.message,
        stack: e.stack?.split("\n").slice(0, 6),
      },
      { status: 500 },
    );
  }
}
