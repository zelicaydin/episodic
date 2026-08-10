import { describe, it, expect } from "vitest";
import { tierFor, TIERS } from "../src/lib/colors";
import { formatWatchTime } from "../src/lib/format";

describe("tierFor", () => {
  it("maps boundaries to the right tiers", () => {
    expect(tierFor(4.9)?.bg).toBe("#4c1d95");
    expect(tierFor(5)?.bg).toBe("#831843");
    expect(tierFor(6.4)?.bg).toBe("#7f1d1d");
    expect(tierFor(7.9)?.bg).toBe("#585212");
    expect(tierFor(8.2)?.bg).toBe("#3f6212");
    expect(tierFor(8.7)?.bg).toBe("#166534");
    expect(tierFor(9.2)?.bg).toBe("#14532d");
    expect(tierFor(9.5)?.bg).toBe("#22c55e");
    expect(tierFor(9.5)?.standout).toBe(true);
    expect(tierFor(null)).toBeNull();
  });
  it("has 8 tiers", () => { expect(TIERS.length).toBe(8); });
});

describe("formatWatchTime", () => {
  it("formats", () => {
    expect(formatWatchTime(90)).toBe("1h 30m");
    expect(formatWatchTime(3000)).toBe("50h");
    expect(formatWatchTime(null)).toBeNull();
  });
});
