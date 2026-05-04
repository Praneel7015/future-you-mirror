import "server-only";

/**
 * Perfect Corp YCE API types (v2.0 / v2.1).
 *
 * Source of truth: https://docs.perfectcorp.com/reference/ai_skin_analysis
 *                  https://docs.perfectcorp.com/reference/ai_aging_simulation
 *
 * Aging request body is partly speculative — the public docs page only shows
 * endpoint paths. We model the same envelope as skin-analysis (`src_file_id` +
 * task params) and refine after probing the live endpoint.
 */

// ─────────────────────────────────────────────────────────────────────
// File upload (shared envelope)
// ─────────────────────────────────────────────────────────────────────

export interface FileUploadRequest {
  files: Array<{
    content_type: "image/jpeg" | "image/png";
    file_name: string;
    file_size: number;
  }>;
}

export interface FileUploadResponse {
  status: number;
  data: {
    files: Array<{
      file_id: string;
      requests: Array<{
        method: "PUT";
        url: string;
        headers: Record<string, string | number>;
      }>;
    }>;
  };
}

// ─────────────────────────────────────────────────────────────────────
// Generic task response
// ─────────────────────────────────────────────────────────────────────

export interface TaskCreateResponse {
  status: number;
  data: { task_id: string };
}

export type TaskStatus = "success" | "running" | "error";

export interface TaskPollResponse<TResults = unknown> {
  status: number;
  data: {
    task_status: TaskStatus;
    results?: TResults;
    error?: string;
    error_code?: string;
    polling_interval?: number;
  };
}

// ─────────────────────────────────────────────────────────────────────
// AI Skin Analysis (SD set — 14 concerns)
// ─────────────────────────────────────────────────────────────────────

export const SD_CONCERNS = [
  "wrinkle",
  "droopy_upper_eyelid",
  "droopy_lower_eyelid",
  "firmness",
  "acne",
  "moisture",
  "eye_bag",
  "dark_circle_v2",
  "age_spot",
  "radiance",
  "redness",
  "oiliness",
  "pore",
  "texture",
] as const;

export type SdConcern = (typeof SD_CONCERNS)[number];

export interface SkinAnalysisRequest {
  src_file_id: string;
  dst_actions: SdConcern[];
  format?: "json";
}

export interface SkinConcernResult {
  type: SdConcern;
  raw_score: number;
  ui_score: number;
  mask_urls?: string[];
  url?: string | null;
}

// `all` and `skin_age` come back as entries inside `output[]` with these
// special `type` values, NOT as top-level fields on `results`.
export interface SkinSpecialResult {
  type: "all" | "skin_age" | "resize_image";
  score?: number;
  value?: number;
  age?: number;
  url?: string | null;
}

export type SkinOutputItem = SkinConcernResult | SkinSpecialResult;

export interface SkinAnalysisOutput {
  output: SkinOutputItem[];
}

export interface SkinResult {
  concerns: Record<SdConcern, { raw: number; ui: number }>;
  overallScore: number | null;
  skinAge: number | null;
}

// ─────────────────────────────────────────────────────────────────────
// AI Aging (v2.0)
// ─────────────────────────────────────────────────────────────────────
//
// NOTE: docs page (samples/ai_aging_simulation.{json,yaml}) describes a
// nested `payload.file_sets.src_ids` envelope, but the live endpoint at
// makeupar.com/s2s/v2.0/task/aging actually accepts the flat skin-analysis
// envelope (`src_file_id`). Probe + first live call confirmed this on
// 2026-05-04. Treat the docs as out-of-date for the request body, but
// canonical for the response shape.

export interface AgingRequest {
  src_file_id: string;
}

export interface AgingPhoto {
  url: string;
  res_age: number;
}

export interface AgingOutput {
  output?: AgingPhoto[];
  age?: number; // estimated age of input photo
  agd_idx?: number; // index in output[] closest to estimated age
  age_min?: number;
  age_max?: number;
  num_of_photos?: number;
}

export interface AgingResult {
  photos: AgingPhoto[];
  currentAge: number | null;
  ageMin: number;
  ageMax: number;
}
