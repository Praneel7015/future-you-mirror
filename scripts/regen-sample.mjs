/**
 * Regenerates public/sample.json with fresh aging photo URLs, then downloads
 * all 16 aging photos to public/sample-photos/ so they never expire.
 *
 * Run with the dev server running:
 *   node scripts/regen-sample.mjs
 */

import { readFile, writeFile, mkdir } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { existsSync } from "node:fs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const SAMPLE_PHOTO = join(ROOT, "samples", "persona-1.png");
const PUBLIC_DIR = join(ROOT, "public");
const PHOTOS_DIR = join(PUBLIC_DIR, "sample-photos");
const OUT_JSON = join(PUBLIC_DIR, "sample.json");

async function main() {
  if (!existsSync(SAMPLE_PHOTO)) {
    console.error("Missing samples/persona-1.png — add the sample photo first.");
    process.exit(1);
  }

  console.log("1/3  Calling /api/analyze with persona-1.png…");
  const formData = new FormData();
  const photoBytes = await readFile(SAMPLE_PHOTO);
  formData.append("image", new Blob([photoBytes], { type: "image/png" }), "persona-1.png");

  const res = await fetch("http://localhost:3000/api/analyze", {
    method: "POST",
    body: formData,
  });

  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    console.error("API returned non-JSON:", text.slice(0, 400));
    process.exit(1);
  }

  if (!res.ok || data.error) {
    console.error("API error:", data.error, data.message);
    process.exit(1);
  }

  console.log(`    Got ${data.aging.photos.length} aging photos, skinAge=${data.skin.skinAge}`);

  console.log("2/3  Downloading aging photos to public/sample-photos/…");
  await mkdir(PHOTOS_DIR, { recursive: true });

  const updatedPhotos = [];
  for (const photo of data.aging.photos) {
    const filename = `age-${photo.res_age}.jpg`;
    const localPath = `/sample-photos/${filename}`;
    const diskPath = join(PHOTOS_DIR, filename);

    const imgRes = await fetch(photo.url);
    if (!imgRes.ok) {
      console.warn(`    Skipping age ${photo.res_age}: HTTP ${imgRes.status}`);
      updatedPhotos.push(photo); // keep original URL as fallback
      continue;
    }
    const buf = Buffer.from(await imgRes.arrayBuffer());
    await writeFile(diskPath, buf);
    console.log(`    Saved ${filename}`);
    updatedPhotos.push({ ...photo, url: localPath });
  }

  data.aging.photos = updatedPhotos;

  console.log("3/3  Writing public/sample.json…");
  await writeFile(OUT_JSON, JSON.stringify(data, null, 2));
  console.log("Done. sample.json updated with local photo paths.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
