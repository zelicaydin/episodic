import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, fireEvent, waitFor } from "@testing-library/react";
import { renderApp } from "./helpers";

function stubFetch(overrides: Record<string, unknown> = {}) {
  const routes: Record<string, unknown> = {
    "/api/status": { ingested: true, datasetDate: "2026-08-10", showCount: 2, episodeCount: 8 },
    "/api/trending": [
      { tconst: "tt10", title: "Fake Show", startYear: 2010, endYear: 2015, rating: 8.9, votes: 120000 },
    ],
    "/api/my/recently-viewed": [],
    "/api/search": [
      { tconst: "tt30", title: "Tiny Gem", startYear: 2020, endYear: 2020, rating: 8.6, votes: 900 },
    ],
    ...overrides,
  };
  vi.stubGlobal("fetch", vi.fn(async (url: string) => {
    const path = Object.keys(routes).find((p) => String(url).includes(p));
    if (path === "/api/status" && (routes[path] as { ingested: boolean }).ingested === false) {
      return new Response(JSON.stringify(routes[path]));
    }
    return new Response(JSON.stringify(path ? routes[path] : []));
  }));
}

describe("Home", () => {
  beforeEach(() => stubFetch());
  it("shows trending shows", async () => {
    renderApp("/");
    expect(await screen.findByText("Fake Show")).toBeDefined();
    expect(screen.getByText("Trending")).toBeDefined();
  });
  it("search dropdown appears after typing", async () => {
    renderApp("/");
    fireEvent.change(screen.getByPlaceholderText(/search/i), { target: { value: "tiny" } });
    expect(await screen.findByText("Tiny Gem")).toBeDefined();
  });
  it("renders setup card when not ingested", async () => {
    stubFetch({ "/api/status": { ingested: false, datasetDate: null, showCount: 0, episodeCount: 0 } });
    renderApp("/");
    await waitFor(() => expect(screen.getByText(/npm run ingest/)).toBeDefined());
  });
});
