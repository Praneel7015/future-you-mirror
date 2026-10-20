/**
 * Bake sample "with care" portraits from public/sample-photos/age-*.jpg.
 * Demo mode serves these and does not call Perfect Corp.
 */
import { mkdir, readdir } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const srcDir = path.join(process.cwd(), "public/sample-photos");
const outDir = path.join(srcDir, "with-care");

await mkdir(outDir, { recursive: true });

const files = (await readdir(srcDir)).filter((name) => /^age-\d+\.jpg$/i.test(name));
if (files.length === 0) {
  throw new Error("No sample age photos found.");
}

for (const name of files) {
  await sharp(path.join(srcDir, name))
    .modulate({ brightness: 1.08, saturation: 1.12 })
    .jpeg({ quality: 80 })
    .toFile(path.join(outDir, name));
  console.log(name);
}
