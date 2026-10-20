/** Keep only https mask URLs from a Skin Analysis `mask_urls` array. */
export function httpsUrls(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const out: string[] = [];
  for (const item of value) {
    if (typeof item !== "string") continue;
    const url = item.trim();
    if (/^https:\/\//i.test(url)) out.push(url);
  }
  return out;
}
