import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import type { MyShowEntry } from "@episodic/shared";
import { renderApp } from "./helpers";

const entries: MyShowEntry[] = [
  { tconst: "tt10", title: "Fake Show", poster: null,
    verdict: "Elite from start to finish. No skippable seasons.",
    watchedCount: 3, episodeCount: 4, newEpisodes: 2 },
];

beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn(async (url: string) => {
    if (String(url).includes("/api/my/shows")) return new Response(JSON.stringify(entries));
    if (String(url).includes("/api/status")) return new Response(JSON.stringify({ ingested: true, datasetDate: "2026-08-10", showCount: 1, episodeCount: 4 }));
    return new Response(JSON.stringify([]));
  }));
});

describe("My Shows", () => {
  it("renders cards with progress and new-episode badge", async () => {
    renderApp("/my");
    expect(await screen.findByText("Fake Show")).toBeDefined();
    expect(screen.getByText(/watched 3\/4/)).toBeDefined();
    expect(screen.getByText(/2 new/)).toBeDefined();
  });
  it("renders the empty state", async () => {
    vi.stubGlobal("fetch", vi.fn(async (url: string) => {
      if (String(url).includes("/api/my/shows")) return new Response(JSON.stringify([]));
      return new Response(JSON.stringify({ ingested: true, datasetDate: null, showCount: 0, episodeCount: 0 }));
    }));
    renderApp("/my");
    expect(await screen.findByText(/nothing saved yet/i)).toBeDefined();
  });
  it("shows an error message when loading fails", async () => {
    vi.stubGlobal("fetch", vi.fn(async (url: string) => {
      if (String(url).includes("/api/my/shows")) return new Response("boom", { status: 500 });
      return new Response(JSON.stringify({ ingested: true, datasetDate: null, showCount: 0, episodeCount: 0, tmdbConfigured: false }));
    }));
    renderApp("/my");
    expect(await screen.findByText(/could not load your shows/i)).toBeDefined();
  });
});
