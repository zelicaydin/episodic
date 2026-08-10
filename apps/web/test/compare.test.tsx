import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import type { ShowDetails } from "@scoretrack/shared";
import { renderApp } from "./helpers";

function mkShow(tconst: string, title: string): ShowDetails {
  return {
    tconst, title, startYear: 2010, endYear: 2015, genres: ["Drama"],
    episodeCount: 2, unplacedCount: 0, totalWatchMinutes: 90, rating: 8.9, votes: 1000,
    saved: false, myRating: null, watchedCount: 0, poster: null, overview: null,
    seasons: [{ season: 1, average: 8.7, episodes: [
      { tconst: tconst + "e1", season: 1, episode: 1, title: "A", rating: 9.1, votes: 100, watched: false },
      { tconst: tconst + "e2", season: 1, episode: 2, title: "B", rating: 8.3, votes: 100, watched: false },
    ] }],
    insights: {
      seasonAverages: [{ season: 1, average: 8.7 }], weightedAverage: 8.7,
      peak: { tconst: tconst + "e1", season: 1, episode: 1, title: "A", rating: 9.1 },
      worst: { tconst: tconst + "e2", season: 1, episode: 2, title: "B", rating: 8.3 },
      mostConsistentSeason: 1, goldenEra: null, fallOffSeason: null,
      trajectory: "flat",
      verdict: "A solid watch: steady quality, few surprises.",
    },
  };
}

beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn(async (url: string) => {
    const u = String(url);
    if (u.includes("/api/compare")) {
      return new Response(JSON.stringify({ a: mkShow("tt10", "Fake Show"), b: mkShow("tt30", "Tiny Gem") }));
    }
    if (u.includes("/api/status")) return new Response(JSON.stringify({ ingested: true, datasetDate: "2026-08-10", showCount: 2, episodeCount: 4 }));
    return new Response(JSON.stringify([]));
  }));
});

describe("Compare page", () => {
  it("renders both stat strips and grids from url params", async () => {
    renderApp("/compare?a=tt10&b=tt30");
    expect(await screen.findByText("Fake Show")).toBeDefined();
    expect(screen.getByText("Tiny Gem")).toBeDefined();
    expect(screen.getAllByText(/peak/i).length).toBeGreaterThanOrEqual(2);
    expect(screen.getAllByText("9.1").length).toBe(2);
  });
  it("asks for two shows when params missing", async () => {
    renderApp("/compare");
    expect(await screen.findByText(/pick two shows/i)).toBeDefined();
  });
});
