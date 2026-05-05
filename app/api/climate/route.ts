import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";
export const dynamic = "force-dynamic";

export interface ClimateResponse {
  city: string;
  uv: number;
  humidity: number;
  pm25: number;
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const queryLat = url.searchParams.get("lat");
    const queryLng = url.searchParams.get("lng");

    let city: string | null =
      req.headers.get("x-vercel-ip-city") ?? null;
    let lat: string | null = queryLat ?? req.headers.get("x-vercel-ip-latitude");
    let lng: string | null = queryLng ?? req.headers.get("x-vercel-ip-longitude");

    if (city) {
      try {
        city = decodeURIComponent(city);
      } catch {
        // leave as-is
      }
    }

    if (!lat || !lng) {
      const forwarded = req.headers.get("x-forwarded-for") ?? "";
      const ip = forwarded.split(",")[0].trim();
      const ipResp = await fetch(
        `http://ip-api.com/json/${ip}?fields=status,city,lat,lon`,
        { cache: "no-store" },
      );
      if (ipResp.ok) {
        const ipData = (await ipResp.json()) as {
          status: string;
          city?: string;
          lat?: number;
          lon?: number;
        };
        if (ipData.status === "success") {
          city = city ?? ipData.city ?? null;
          lat = lat ?? (ipData.lat != null ? String(ipData.lat) : null);
          lng = lng ?? (ipData.lon != null ? String(ipData.lon) : null);
        }
      }
    }

    if (!lat || !lng) {
      return NextResponse.json(
        { error: "no_location", message: "Could not resolve a location for this request." },
        { status: 200 },
      );
    }

    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=uv_index,relative_humidity_2m`;
    const airUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lng}&current=pm2_5`;

    const [wResp, aResp] = await Promise.all([
      fetch(weatherUrl, { cache: "no-store" }),
      fetch(airUrl, { cache: "no-store" }),
    ]);

    const w = wResp.ok
      ? ((await wResp.json()) as {
          current?: { uv_index?: number; relative_humidity_2m?: number };
        })
      : null;
    const a = aResp.ok
      ? ((await aResp.json()) as { current?: { pm2_5?: number } })
      : null;

    const body: ClimateResponse = {
      city: city ?? "your area",
      uv: Math.max(0, Math.round(w?.current?.uv_index ?? 0)),
      humidity: Math.max(0, Math.round(w?.current?.relative_humidity_2m ?? 0)),
      pm25: Math.max(0, Math.round(a?.current?.pm2_5 ?? 0)),
    };

    return NextResponse.json(body, { status: 200 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "climate_error";
    return NextResponse.json({ error: "server_error", message }, { status: 200 });
  }
}
