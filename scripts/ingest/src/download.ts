import { createWriteStream, mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";

const PROGRESS_STEP = 25 * 1024 * 1024;

export async function downloadFile(url: string, destPath: string): Promise<{ lastModified: string | null }> {
  const res = await fetch(url);
  if (!res.ok || res.body === null) {
    throw new Error(`Download failed: ${url} returned ${res.status}`);
  }
  mkdirSync(dirname(destPath), { recursive: true });
  const total = Number(res.headers.get("content-length") ?? 0);
  let bytes = 0;
  let nextMark = PROGRESS_STEP;
  // undici's ReadableStream type and node:stream/web's disagree under @types/node 24,
  // hence the cast; runtime is fine either way
  const body = Readable.fromWeb(res.body as import("node:stream/web").ReadableStream);
  body.on("data", (chunk: Buffer) => {
    bytes += chunk.length;
    if (bytes >= nextMark) {
      const pct = total > 0 ? ` (${Math.round((bytes / total) * 100)}%)` : "";
      console.log(`  ${Math.round(bytes / 1024 / 1024)} MB${pct}`);
      nextMark += PROGRESS_STEP;
    }
  });
  await pipeline(body, createWriteStream(destPath));
  return { lastModified: res.headers.get("last-modified") };
}
