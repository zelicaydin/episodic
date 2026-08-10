import { describe, it, expect } from "vitest";
import type { SeasonGrid, EpisodeCell } from "@scoretrack/shared";
import { computeInsights, seasonAverage } from "../src/insights/insights.js";

let n = 0;
function eps(ratings: (number | null)[], season: number): EpisodeCell[] {
  return ratings.map((r, i) => ({
    tconst: `tte${++n}`, season, episode: i + 1,
    title: r === null ? null : `E${i + 1}`, rating: r, votes: r === null ? 0 : 1000,
    watched: false,
  }));
}
function grid(...seasonRatings: (number | null)[][]): SeasonGrid[] {
  return seasonRatings.map((rs, i) => ({ season: i + 1, average: null, episodes: eps(rs, i + 1) }));
}

describe("seasonAverage", () => {
  it("averages rated episodes", () => {
    expect(seasonAverage(eps([8, 9], 1))).toBe(8.5);
  });
  it("returns null with fewer than 2 rated episodes", () => {
    expect(seasonAverage(eps([8, null], 1))).toBeNull();
    expect(seasonAverage(eps([], 1))).toBeNull();
  });
});

describe("computeInsights", () => {
  it("steady elite: golden era spans all, no fall-off, rising trajectory", () => {
    const i = computeInsights(grid([9, 9.2], [8.8, 9.4], [9.1, 9.9]));
    expect(i.goldenEra).toEqual({ from: 1, to: 3 });
    expect(i.fallOffSeason).toBeNull();
    expect(i.peak?.rating).toBe(9.9);
    expect(i.worst?.rating).toBe(8.8);
    expect(i.trajectory).toBe("rising");
  });
  it("collapse: fall-off at the crash season, never recovers, falling trajectory", () => {
    const i = computeInsights(grid([9, 9.2], [9.1, 9.3], [9.0, 9.4], [6.5, 5.5]));
    expect(i.fallOffSeason).toBe(4);
    expect(i.trajectory).toBe("falling");
  });
  it("a two-season crash is a fall-off", () => {
    const i = computeInsights(grid([9, 9.2], [8.0, 8.2]));
    expect(i.fallOffSeason).toBe(2);
  });
  it("trajectory is null for a single season and flat for stable shows", () => {
    expect(computeInsights(grid([8, 8.2])).trajectory).toBeNull();
    expect(computeInsights(grid([8, 8.2], [8.1, 8.3])).trajectory).toBe("flat");
  });
  it("dip with recovery is not a fall-off", () => {
    const i = computeInsights(grid([9, 9.2], [9.1, 9.3], [8.0, 8.2], [9.0, 9.4]));
    expect(i.fallOffSeason).toBeNull();
  });
  it("golden era fallback uses the show's own baseline", () => {
    const i = computeInsights(grid([7.0, 7.2], [7.9, 8.1], [8.0, 8.2], [7.0, 7.1]));
    expect(i.goldenEra).toEqual({ from: 2, to: 3 });
  });
  it("weighted average weights by votes", () => {
    const s: SeasonGrid[] = [{ season: 1, average: null, episodes: [
      { tconst: "a", season: 1, episode: 1, title: "A", rating: 10, votes: 3000, watched: false },
      { tconst: "b", season: 1, episode: 2, title: "B", rating: 7, votes: 1000, watched: false },
    ] }];
    expect(computeInsights(s).weightedAverage).toBeCloseTo(9.25);
  });
  it("most consistent season has the lowest spread", () => {
    const i = computeInsights(grid([8.0, 9.0], [8.5, 8.5]));
    expect(i.mostConsistentSeason).toBe(2);
  });
  it("handles a show with no rated episodes", () => {
    const i = computeInsights(grid([null, null]));
    expect(i.weightedAverage).toBeNull();
    expect(i.peak).toBeNull();
    expect(i.goldenEra).toBeNull();
    expect(i.fallOffSeason).toBeNull();
  });
  it("a null-average season breaks a golden era run, earlier tie wins", () => {
    const i = computeInsights(grid([9.0, 9.2], [9.0, null], [9.0, 9.2]));
    expect(i.goldenEra).toEqual({ from: 1, to: 1 });
  });
  it("fall-off skips a null-average drop season and detects at the next averaged one", () => {
    const i = computeInsights(grid([9, 9.2], [9.1, 9.3], [6.0, null], [6.0, 6.2]));
    expect(i.fallOffSeason).toBe(4);
  });
  it("trajectory uses first and last defined averages across a null edge season", () => {
    const i = computeInsights(grid([9, null], [8.0, 8.2], [9.0, 9.2]));
    expect(i.trajectory).toBe("rising");
  });
  it("empty seasons array returns empty and null results without crashing", () => {
    const i = computeInsights([]);
    expect(i.seasonAverages).toEqual([]);
    expect(i.weightedAverage).toBeNull();
    expect(i.goldenEra).toBeNull();
    expect(i.fallOffSeason).toBeNull();
    expect(i.trajectory).toBeNull();
  });
});
