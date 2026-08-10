import { describe, it, expect } from "vitest";
import { gzipSync } from "node:zlib";
import { writeFileSync, mkdtempSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { parseTsvLine, toInt, toFloat, tsvRows } from "../src/parse.js";

describe("parseTsvLine", () => {
  it("splits tabs and converts \\N to null", () => {
    expect(parseTsvLine("tt1\t\\N\tBreaking Bad")).toEqual(["tt1", null, "Breaking Bad"]);
  });
  it("keeps empty strings as empty, not null", () => {
    expect(parseTsvLine("a\t\tb")).toEqual(["a", "", "b"]);
  });
  it("leaves quotes alone (IMDb TSVs are not quoted CSV)", () => {
    expect(parseTsvLine('say "hi"\t7')).toEqual(['say "hi"', "7"]);
  });
});

describe("coercion", () => {
  it("toInt parses and rejects junk", () => {
    expect(toInt("42")).toBe(42);
    expect(toInt(null)).toBeNull();
    expect(toInt("abc")).toBeNull();
  });
  it("toFloat parses ratings", () => {
    expect(toFloat("8.6")).toBe(8.6);
    expect(toFloat(null)).toBeNull();
  });
});

describe("tsvRows", () => {
  it("streams a gzipped TSV, skipping the header", async () => {
    const dir = mkdtempSync(join(tmpdir(), "st-"));
    const file = join(dir, "x.tsv.gz");
    writeFileSync(file, gzipSync("h1\th2\ntt1\t\\N\ntt2\t9.1\n"));
    const rows = [];
    for await (const r of tsvRows(file)) rows.push(r);
    expect(rows).toEqual([["tt1", null], ["tt2", "9.1"]]);
  });
});
