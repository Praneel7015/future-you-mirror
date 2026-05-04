import "server-only";
import { getAccessToken, invalidateAccessToken } from "./auth";
import type {
  FileUploadRequest,
  FileUploadResponse,
  TaskCreateResponse,
  TaskPollResponse,
} from "./types";
import type { ProcessedImage } from "../image-utils";

/**
 * Authenticated fetch wrapper + task lifecycle helpers for Perfect Corp YCE v2.0.
 *
 * Auth host (RSA handshake) is `yce-api-01.perfectcorp.com` — owned by lib/perfectcorp/auth.ts.
 * Data endpoints live on `yce-api-01.makeupar.com` per current public docs.
 *
 * Token can expire mid-session. We retry once on 401 with a forced re-auth.
 */

const DATA_BASE =
  process.env.PERFECT_CORP_DATA_BASE ?? "https://yce-api-01.makeupar.com";
const API_VERSION = "v2.0";

const DEFAULT_POLL_INTERVAL_MS = 2000;
const MAX_POLL_DURATION_MS = 90_000;

export class PerfectCorpError extends Error {
  constructor(
    public code: string,
    message: string,
    public httpStatus?: number,
    public payload?: unknown,
  ) {
    super(message);
    this.name = "PerfectCorpError";
  }
}

interface PcFetchInit extends Omit<RequestInit, "headers"> {
  headers?: Record<string, string>;
}

async function pcFetch(url: string, init: PcFetchInit = {}, retried = false): Promise<Response> {
  const token = await getAccessToken();
  const res = await fetch(url, {
    ...init,
    headers: {
      ...(init.headers ?? {}),
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  });

  if (res.status === 401 && !retried) {
    invalidateAccessToken();
    return pcFetch(url, init, true);
  }
  return res;
}

async function readJson<T>(res: Response, context: string): Promise<T> {
  const text = await res.text();
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new PerfectCorpError(
      "invalid_response",
      `${context}: non-JSON response (HTTP ${res.status}): ${text.slice(0, 200)}`,
      res.status,
      text,
    );
  }
  return parsed as T;
}

/**
 * Upload an already-processed image to Perfect Corp and return the file_id.
 *
 * Two-step: POST to `/s2s/v2.0/file/{api}` with metadata to get a pre-signed PUT URL,
 * then PUT the bytes directly to S3 (no auth header on the PUT).
 */
export async function uploadFile(api: string, image: ProcessedImage): Promise<string> {
  const initBody: FileUploadRequest = {
    files: [
      {
        content_type: image.contentType,
        file_name: `upload_${image.hash.slice(0, 12)}.jpg`,
        file_size: image.bytes.byteLength,
      },
    ],
  };

  const initRes = await pcFetch(`${DATA_BASE}/s2s/${API_VERSION}/file/${api}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(initBody),
  });

  const initData = await readJson<FileUploadResponse>(initRes, `upload init (${api})`);
  if (!initRes.ok || initData.status !== 200 || !initData.data?.files?.[0]) {
    throw new PerfectCorpError(
      "upload_init_failed",
      `Upload init failed for ${api} (HTTP ${initRes.status}, status=${initData.status}).`,
      initRes.status,
      initData,
    );
  }

  const file = initData.data.files[0];
  const putReq = file.requests[0];

  const putRes = await fetch(putReq.url, {
    method: putReq.method,
    headers: Object.fromEntries(
      Object.entries(putReq.headers).map(([k, v]) => [k, String(v)]),
    ),
    body: image.bytes,
  });
  if (!putRes.ok) {
    const detail = await putRes.text().catch(() => "");
    throw new PerfectCorpError(
      "upload_put_failed",
      `S3 PUT failed (HTTP ${putRes.status}): ${detail.slice(0, 200)}`,
      putRes.status,
    );
  }

  return file.file_id;
}

/**
 * Create an async task and return the task_id. The body shape is API-specific —
 * caller passes their own JSON-serializable payload.
 */
export async function createTask<TBody>(api: string, body: TBody): Promise<string> {
  const res = await pcFetch(`${DATA_BASE}/s2s/${API_VERSION}/task/${api}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = await readJson<TaskCreateResponse>(res, `task create (${api})`);
  if (!res.ok || data.status !== 200 || !data.data?.task_id) {
    throw new PerfectCorpError(
      "task_create_failed",
      `Task create failed for ${api} (HTTP ${res.status}, status=${data.status}).`,
      res.status,
      data,
    );
  }
  return data.data.task_id;
}

/**
 * Poll a task until it reaches `success` or `error`. Throws on error status,
 * timeout, or non-200 HTTP. Returns the parsed `results` block.
 */
export async function pollTask<TResults>(api: string, taskId: string): Promise<TResults> {
  const startedAt = Date.now();
  let interval = DEFAULT_POLL_INTERVAL_MS;

  while (Date.now() - startedAt < MAX_POLL_DURATION_MS) {
    const res = await pcFetch(
      `${DATA_BASE}/s2s/${API_VERSION}/task/${api}/${encodeURIComponent(taskId)}`,
    );
    const data = await readJson<TaskPollResponse<TResults>>(res, `task poll (${api})`);

    if (!res.ok || data.status !== 200) {
      throw new PerfectCorpError(
        "task_poll_failed",
        `Poll failed for ${api}/${taskId} (HTTP ${res.status}, status=${data.status}).`,
        res.status,
        data,
      );
    }

    const status = data.data.task_status;
    if (status === "success" && data.data.results !== undefined) {
      return data.data.results;
    }
    if (status === "error") {
      throw new PerfectCorpError(
        data.data.error_code ?? "task_error",
        `Task ${taskId} failed: ${data.data.error ?? data.data.error_code ?? "unknown"}`,
        res.status,
        data,
      );
    }

    if (typeof data.data.polling_interval === "number" && data.data.polling_interval > 0) {
      interval = data.data.polling_interval;
    }
    await new Promise((r) => setTimeout(r, interval));
  }

  throw new PerfectCorpError(
    "task_timeout",
    `Task ${taskId} for ${api} did not complete within ${MAX_POLL_DURATION_MS}ms.`,
  );
}

/**
 * Convenience: upload + create task + poll, all in one call.
 */
export async function runFullTask<TBody, TResults>(
  api: string,
  image: ProcessedImage,
  buildBody: (file_id: string) => TBody,
): Promise<TResults> {
  const fileId = await uploadFile(api, image);
  const taskId = await createTask<TBody>(api, buildBody(fileId));
  return pollTask<TResults>(api, taskId);
}
