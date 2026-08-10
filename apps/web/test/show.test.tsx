import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, fireEvent, waitFor } from "@testing-library/react";
import type { ShowDetails } from "@scoretrack/shared";
import { renderApp } from "./helpers";

const details: ShowDetails = {
  tconst: "tt10", title: "Fake Show", startYear: 2010, endYear: 2015,
  genres: ["Drama", "Crime"], episodeCount: 4, unplacedCount: 1, totalWatchMinutes: 182,
  rating: 8.9, votes: 120000, saved: false, myRating: null, watchedCount: 0,
  poster: null, overview: null,
  seasons: [
    { season: 1, average: 8.7, episodes: [
      { tconst: "tt11", season: 1, episode: 1, title: "Pilot", rating: 9.1, votes: 5000, watched: false },
      { tconst: "tt12", season: 1, episode: 2, title: "Second", rating: 8.3, votes: 4000, watched: false },
    ] },
  ],
  insights: {
    seasonAverages: [{ season: 1, average: 8.7 }], weightedAverage: 8.7,
    peak: { tconst: "tt11", season: 1, episode: 1, title: "Pilot", rating: 9.1 },
    worst: { tconst: "tt12", season: 1, episode: 2, title: "Second", rating: 8.3 },
    mostConsistentSeason: 1, goldenEra: { from: 1, to: 1 }, fallOffSeason: null,
    trajectory: null,
    verdict: "Short and sweet: it says what it came to say and leaves.",
  },
};

beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn(async (url: string, init?: RequestInit) => {
    const u = String(url);
    if (u.includes("/api/shows/tt10")) return new Response(JSON.stringify(details));
    if (u.includes("/api/status")) return new Response(JSON.stringify({ ingested: true, datasetDate: "2026-08-10", showCount: 1, episodeCount: 4 }));
    if (u.includes("/api/my/")) return new Response(JSON.stringify({ ok: true }));
    return new Response(JSON.stringify([]));
  }));
});

describe("Show page", () => {
  it("renders header, verdict, grid, color key, unplaced note", async () => {
    renderApp("/show/tt10");
    expect(await screen.findByText("Fake Show")).toBeDefined();
    expect(screen.getByText(/2010 to 2015/)).toBeDefined();
    expect(screen.getByText(/3h 2m/)).toBeDefined();
    expect(screen.getByText(/Short and sweet/)).toBeDefined();
    expect(screen.getByText("9.1")).toBeDefined();
    expect(screen.getByText("color key")).toBeDefined();
    expect(screen.getByText(/1 specials or unplaced/)).toBeDefined();
  });
  it("save button posts to the api", async () => {
    renderApp("/show/tt10");
    fireEvent.click(await screen.findByRole("button", { name: /save to my shows/i }));
    await waitFor(() => {
      const calls = (fetch as ReturnType<typeof vi.fn>).mock.calls.map((c) => [String(c[0]), c[1]?.method]);
      expect(calls).toContainEqual(["/api/my/shows/tt10", "POST"]);
    });
  });
});
