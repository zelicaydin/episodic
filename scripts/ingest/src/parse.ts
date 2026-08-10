import { createReadStream } from "node:fs";
import { createGunzip } from "node:zlib";
import { createInterface } from "node:readline";

export function parseTsvLine(line: string): (string | null)[] {
  return line.split("\t").map((f) => (f === "\\N" ? null : f));
}

export function toInt(v: string | null): number | null {
  if (v === null) return null;
  const n = Number.parseInt(v, 10);
  return Number.isNaN(n) ? null : n;
}

export function toFloat(v: string | null): number | null {
  if (v === null) return null;
  const n = Number.parseFloat(v);
  return Number.isNaN(n) ? null : n;
}

export async function* tsvRows(filePath: string): AsyncGenerator<(string | null)[]> {
  const rl = createInterface({
    input: createReadStream(filePath).pipe(createGunzip()),
    crlfDelay: Infinity,
  });
  let first = true;
  for await (const line of rl) {
    if (first) { first = false; continue; }
    if (line.length === 0) continue;
    yield parseTsvLine(line);
  }
}
