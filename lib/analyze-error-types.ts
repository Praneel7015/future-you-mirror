/**
 * Shared with the capture UI — keep in sync with `lib/analyze-errors.ts`.
 */
export type AnalyzeRejectReason =
  | "file_too_large"
  | "unsupported_format"
  | "invalid_image"
  | "image_too_small"
  | "face_not_detected"
  | "face_framing"
  | "lighting"
  | "blur"
  | "too_far_or_low_res"
  | "pose"
  | "glasses"
  | "expression"
  | "eyes"
  | "face_obstructed"
  | "timeout"
  | "upload_or_service"
  | "service_retry"
  | "photo_generic"
  | "upstream_generic"
  | "connection"
  | "server"
  | "invalid_upload"
  | "missing_image";

export interface AnalyzeErrorBody {
  error: string;
  reason: AnalyzeRejectReason;
  message: string;
}
