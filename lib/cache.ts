import "server-only";
import { promises as fs } from "node:fs";
import path from "node:path";

/**
 * Hash-keyed response cache for Perfect Corp API calls.
 *
 * Two layers:
 *   1. In-memory Map — fast for the lifetime of the dev server / serverless instance.
 *   2. Disk under `.cache/` — survives restarts so we don't burn the 1k credit budget
 *      while iterating on UI code.
 *
 * Disk persistence is best-effort: a failed write is logged but never throws, since the
 * in-memory layer alone is enough for correctness within a single run.
 */

const CACHE_DIR = path.join(process.cwd(), ".cache");
const memory = new Map<string, unknown>();
let dirEnsured: Promise<void> | null = null;

function ensureDir(): Promise<void> {
  if (!dirEnsured) {
    dirEnsured = fs.mkdir(CACHE_DIR, { recursive: true }).then(() => undefined);
  }
  return dirEnsured;
}

function fileFor(key: string): string {
  // Keys are already hex-safe (sha256 hex + scope string).
  return path.join(CACHE_DIR, `${key}.json`);
}

export async function cacheGet<T>(key: string): Promise<T | null> {
  if (memory.has(key)) {
    return memory.get(key) as T;
  }
  try {
    const raw = await fs.readFile(fileFor(key), "utf8");
    const parsed = JSON.parse(raw) as T;
    memory.set(key, parsed);
    return parsed;
  } catch {
    return null;
  }
}

export async function cacheSet<T>(key: string, value: T): Promise<void> {
  memory.set(key, value);
  try {
    await ensureDir();
    await fs.writeFile(fileFor(key), JSON.stringify(value, null, 2), "utf8");
  } catch (err) {
    console.warn(`[cache] disk write failed for ${key}:`, err);
  }
}

export function cacheKey(scope: string, hash: string): string {
  return `${scope}_${hash}`;
}
