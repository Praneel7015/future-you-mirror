/**
 * Public origin for server-side fetches.
 * On Vercel, nextUrl.origin can be an internal host. Prefer the forwarded host.
 */
export function publicOriginFrom(
  headerList: { get(name: string): string | null },
  fallbackOrigin: string,
): string {
  const forwardedHost = headerList.get("x-forwarded-host")?.split(",")[0]?.trim();
  const host = forwardedHost || headerList.get("host")?.trim() || "";
  if (!host) return fallbackOrigin;
  const forwardedProto = headerList.get("x-forwarded-proto")?.split(",")[0]?.trim();
  const proto =
    forwardedProto || (/^(localhost|127\.0\.0\.1)(:|$)/.test(host) ? "http" : "https");
  try {
    return new URL(`${proto}://${host}`).origin;
  } catch {
    return fallbackOrigin;
  }
}

/**
 * Resolve same-origin paths for server-side fetch (Edge / Node).
 * Browsers resolve `/path` against the page origin; fetch() in route handlers has no default base.
 */
export function toAbsoluteRequestUrl(href: string, requestOrigin: string): string {
  const t = href.trim();
  if (!t) return "";
  if (t.startsWith("data:")) return t;
  if (t.startsWith("http://") || t.startsWith("https://")) return t;
  if (t.startsWith("//")) return `https:${t}`;
  return new URL(t, requestOrigin).toString();
}
