import "server-only";
import type { AnalyzeErrorBody, AnalyzeRejectReason } from "@/lib/analyze-error-types";
import { ImageError } from "@/lib/image-utils";
import { PerfectCorpError } from "@/lib/perfectcorp/client";

function compactPayload(payload: unknown): string {
  if (payload === undefined || payload === null) return "";
  if (typeof payload === "string") return payload;
  try {
    return JSON.stringify(payload);
  } catch {
    return "";
  }
}

/**
 * Turn upstream failures into a single clear line + stable `reason` for the capture UI.
 */
export function analyzeErrorResponse(err: unknown): { status: number; body: AnalyzeErrorBody } {
  if (err instanceof ImageError) {
    const { message, reason } = friendlyImageError(err);
    return { status: 400, body: { error: err.code, reason, message } };
  }

  if (err instanceof PerfectCorpError) {
    const mapped = mapPerfectCorpError(err);
    return {
      status: mapped.status,
      body: { error: mapped.code, reason: mapped.reason, message: mapped.message },
    };
  }

  if (err instanceof Error) {
    const m = err.message ?? "";
    if (/failed to parse url|invalid url/i.test(m)) {
      return {
        status: 502,
        body: {
          error: "upstream_url",
          reason: "connection",
          message: "We can’t reach the photo service right now — try again in a moment.",
        },
      };
    }
    return {
      status: 500,
      body: {
        error: "server_error",
        reason: "server",
        message: "Something went wrong — try another photo, or wait a moment and retry.",
      },
    };
  }

  return {
    status: 500,
    body: {
      error: "server_error",
      reason: "server",
      message: "Something went wrong — try again.",
    },
  };
}

function friendlyImageError(err: ImageError): { message: string; reason: AnalyzeRejectReason } {
  switch (err.code) {
    case "file_too_large":
      return {
        reason: "file_too_large",
        message: "This file is over 10MB — choose a smaller photo.",
      };
    case "unsupported_format":
      return { reason: "unsupported_format", message: "Use a JPG, PNG, or HEIC photo." };
    case "invalid_image":
      return { reason: "invalid_image", message: "That file isn’t a usable image — try another." };
    case "image_too_small":
      return {
        reason: "image_too_small",
        message: "Move closer — your face should fill most of the oval.",
      };
    default:
      return { reason: "invalid_image", message: err.message };
  }
}

function mapPerfectCorpError(err: PerfectCorpError): {
  code: string;
  message: string;
  reason: AnalyzeRejectReason;
  status: number;
} {
  const code = (err.code ?? "").toLowerCase();
  const detail = `${err.message} ${compactPayload(err.payload)}`.toLowerCase();
  const haystack = `${code} ${detail}`;

  const userPhoto = (reason: AnalyzeRejectReason, message: string) =>
    ({ code: "photo_not_suitable", message, reason, status: 400 as const });

  if (haystack.includes("face") && (haystack.includes("not") || haystack.includes("no ") || haystack.includes("detect"))) {
    return userPhoto(
      "face_not_detected",
      "We can’t see your face clearly — center it in the oval and look at the camera.",
    );
  }
  if (
    haystack.includes("landmark") ||
    haystack.includes("facial") ||
    haystack.includes("alignment") ||
    /no\s*face|face\s*count|multiple\s*face|more\s*than\s*one/.test(haystack)
  ) {
    return userPhoto(
      "face_framing",
      "Use one face in the frame, straight on, filling the oval.",
    );
  }

  if (
    haystack.includes("light") ||
    haystack.includes("dark") ||
    haystack.includes("exposure") ||
    haystack.includes("underexpos") ||
    haystack.includes("bright") ||
    haystack.includes("illumination") ||
    haystack.includes("shadow")
  ) {
    return userPhoto(
      "lighting",
      "Lighting is too dark or too harsh — try soft, even light on your face.",
    );
  }

  if (
    haystack.includes("blur") ||
    haystack.includes("sharp") ||
    haystack.includes("quality") ||
    haystack.includes("noise")
  ) {
    return userPhoto("blur", "Image looks blurry — hold steady and tap to focus.");
  }

  if (
    haystack.includes("small") ||
    haystack.includes("resolution") ||
    haystack.includes("pixel") ||
    haystack.includes("size") ||
    haystack.includes("crop") ||
    haystack.includes("scale")
  ) {
    return userPhoto(
      "too_far_or_low_res",
      "You’re too far away or the photo is too soft — move closer to the camera.",
    );
  }

  if (
    haystack.includes("pose") ||
    haystack.includes("angle") ||
    haystack.includes("yaw") ||
    haystack.includes("pitch") ||
    haystack.includes("roll") ||
    haystack.includes("profile") ||
    haystack.includes("sideways") ||
    haystack.includes("tilt")
  ) {
    return userPhoto("pose", "Face the camera squarely — head level, not turned away.");
  }

  if (haystack.includes("glass") || haystack.includes("goggle")) {
    return userPhoto("glasses", "Remove glasses if you can so we can see your eyes clearly.");
  }

  if (
    haystack.includes("mouth") ||
    haystack.includes("lip") ||
    haystack.includes("smile") ||
    haystack.includes("expression")
  ) {
    return userPhoto("expression", "Use a relaxed, neutral expression — mouth easy, eyes natural.");
  }

  if (haystack.includes("eye") && (haystack.includes("close") || haystack.includes("blink"))) {
    return userPhoto("eyes", "Keep your eyes open and looking at the camera.");
  }

  if (haystack.includes("occlu") || haystack.includes("hidden") || haystack.includes("mask")) {
    return userPhoto(
      "face_obstructed",
      "Keep hair, hands, and masks clear of your face.",
    );
  }

  if (err.code === "task_timeout" || haystack.includes("timeout")) {
    return {
      code: "task_timeout",
      reason: "timeout",
      message: "That took too long — try again with simpler lighting and background.",
      status: 504,
    };
  }

  if (
    err.code === "upload_init_failed" ||
    err.code === "upload_put_failed" ||
    err.code === "invalid_upload_url" ||
    err.code === "misconfigured_data_host" ||
    err.code === "invalid_response"
  ) {
    return {
      code: err.code,
      reason: "upload_or_service",
      message: "Couldn’t upload your photo — check your connection and try again.",
      status: 502,
    };
  }

  if (err.code === "task_poll_failed" || err.code === "task_create_failed") {
    return {
      code: err.code,
      reason: "service_retry",
      message: "Something hiccupped — wait a few seconds and try again.",
      status: 502,
    };
  }

  if (err.code === "task_error") {
    return userPhoto(
      "photo_generic",
      "This photo didn’t work — use bright, even light and fill the oval with your face.",
    );
  }

  return {
    code: err.code || "upstream_error",
    reason: "upstream_generic",
    message: "We couldn’t read this photo — try softer light, move closer, and hold still.",
    status: 502,
  };
}
