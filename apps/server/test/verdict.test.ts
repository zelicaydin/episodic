import { describe, it, expect } from "vitest";
import type { Insights } from "@episodic/shared";
import { pickVerdict } from "../src/insights/verdict.js";

function base(over: Partial<Omit<Insights, "verdict">>): Omit<Insights, "verdict"> {
  return {
    seasonAverages: [
      { season: 1, average: 8.6 }, { season: 2, average: 8.8 }, { season: 3, average: 9.0 },
    ],
    weightedAverage: 8.8, peak: { tconst: "x", season: 3, episode: 2, title: "T", rating: 9.9 },
    worst: { tconst: "y", season: 1, episode: 1, title: "W", rating: 8.0 },
    mostConsistentSeason: 2, goldenEra: { from: 1, to: 3 }, fallOffSeason: null,
    trajectory: "rising",
    ...over,
  };
}

describe("pickVerdict", () => {
  it("is deterministic per show", () => {
    const i = base({});
    expect(pickVerdict(i, "tt0903747")).toBe(pickVerdict(i, "tt0903747"));
  });
  it("collapse mentions the fall-off season", () => {
    const v = pickVerdict(base({ fallOffSeason: 8 }), "tt0944947");
    expect(v).toContain("S8");
  });
  it("steady elite for consistently great shows", () => {
    const v = pickVerdict(base({}), "tt0903747");
    expect(v.toLowerCase()).toMatch(/elite|excellent|start to finish/);
  });
  it("no data verdict when unrated", () => {
    const v = pickVerdict(base({ weightedAverage: null, peak: null, worst: null,
      goldenEra: null, seasonAverages: [{ season: 1, average: null }] }), "tt1");
    expect(v.toLowerCase()).toContain("not enough ratings");
  });
});
