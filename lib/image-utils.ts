import "server-only";
import crypto from "node:crypto";
import sharp from "sharp";

/**
 * Image preprocessing for Perfect Corp uploads.
 *
 * Both AI Skin Analysis (SD) and AI Aging accept JPG/PNG up to 10MB with
 * specific dimension caps. We normalize every upload to:
 *   - long side ≤ MAX_LONG_SIDE (1024px) to stay well under the 4096px ceiling
 *     and keep upload time short on mobile
 *   - JPEG with quality 90 for predictable file sizes
 *
 * The sha256 of the resized bytes is the cache key for downstream API responses,
 * so identical photos (even if uploaded twice) hit cache.
 */

const MAX_INPUT_BYTES = 10 * 1024 * 1024;
const MAX_LONG_SIDE = 1024;
const MIN_SHORT_SIDE = 480; // Perfect Corp v2.0 SD floor
const ALLOWED_MIME = new Set(["image/jpeg", "image/jpg", "image/png", "image/heic", "image/heif"]);

export class ImageError extends Error {
  constructor(public code: string, message: string) {
    super(message);
    this.name = "ImageError";
  }
}

export interface ProcessedImage {
  bytes: Buffer;
  hash: string;
  width: number;
  height: number;
  contentType: "image/jpeg";
}

export async function processUpload(input: Buffer, mime: string): Promise<ProcessedImage> {
  if (input.byteLength > MAX_INPUT_BYTES) {
    throw new ImageError("file_too_large", `Image is ${(input.byteLength / 1024 / 1024).toFixed(1)}MB; max 10MB.`);
  }
  if (!ALLOWED_MIME.has(mime.toLowerCase())) {
    throw new ImageError("unsupported_format", `Format ${mime} not supported. Use JPG, PNG, or HEIC.`);
  }

  const pipeline = sharp(input, { failOn: "error" }).rotate(); // honor EXIF orientation
  const metadata = await pipeline.metadata();
  const sourceWidth = metadata.width ?? 0;
  const sourceHeight = metadata.height ?? 0;
  if (!sourceWidth || !sourceHeight) {
    throw new ImageError("invalid_image", "Could not read image dimensions.");
  }

  const longSide = Math.max(sourceWidth, sourceHeight);
  const shortSide = Math.min(sourceWidth, sourceHeight);

  // Reject only if the source is so small Perfect Corp will refuse it. We don't
  // upscale — better to surface the error early than to send a blurry photo.
  if (shortSide < MIN_SHORT_SIDE && longSide < MAX_LONG_SIDE) {
    throw new ImageError(
      "image_too_small",
      `Image is ${sourceWidth}×${sourceHeight}; short side must be ≥ ${MIN_SHORT_SIDE}px.`,
    );
  }

  const needsResize = longSide > MAX_LONG_SIDE;
  const resized = needsResize
    ? pipeline.resize({ width: sourceWidth >= sourceHeight ? MAX_LONG_SIDE : undefined, height: sourceHeight > sourceWidth ? MAX_LONG_SIDE : undefined, fit: "inside", withoutEnlargement: true })
    : pipeline;

  const bytes = await resized.jpeg({ quality: 90, mozjpeg: true }).toBuffer();
  const finalMeta = await sharp(bytes).metadata();
  const outW = finalMeta.width ?? 0;
  const outH = finalMeta.height ?? 0;
  const finalShort = Math.min(outW, outH);

  if (outW && outH && finalShort < MIN_SHORT_SIDE) {
    throw new ImageError(
      "image_too_small",
      `After sizing, the image is ${outW}×${outH}; short side must be ≥ ${MIN_SHORT_SIDE}px — move closer or use a higher-resolution photo.`,
    );
  }

  const hash = crypto.createHash("sha256").update(bytes).digest("hex");

  return {
    bytes,
    hash,
    width: outW,
    height: outH,
    contentType: "image/jpeg",
  };
}
