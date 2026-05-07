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
