import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, fireEvent, waitFor } from "@testing-library/react";
import { renderApp } from "./helpers";

function stubFetch(overrides: Record<string, unknown> = {}) {
  const routes: Record<string, unknown> = {
    "/api/status": { ingested: true, datasetDate: "2026-08-10", showCount: 2, episodeCount: 8 },
    "/api/trending": [
      { tconst: "tt10", title: "Fake Show", startYear: 2010, endYear: 2015, rating: 8.9, votes: 120000, poster: "https://m/poster.jpg" },
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
    expect(screen.getByText("On the air now")).toBeDefined();
  });
  it("renders trending poster art", async () => {
    renderApp("/");
    await screen.findByText("Fake Show");
    expect(document.querySelector('img[src="https://m/poster.jpg"]')).not.toBeNull();
  });
  it("renders the hero poster backdrop", async () => {
    renderApp("/");
    expect(await screen.findByTestId("poster-backdrop")).toBeDefined();
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
  it("ignores stale search responses", async () => {
    let resolveOld: (r: Response) => void = () => {};
    const oldPromise = new Promise<Response>((res) => { resolveOld = res; });
    vi.stubGlobal("fetch", vi.fn(async (url: string) => {
      const u = String(url);
      if (u.includes("/api/status")) return new Response(JSON.stringify({ ingested: true, datasetDate: null, showCount: 1, episodeCount: 1 }));
      if (u.includes("/api/search")) {
        if (u.includes("old")) return oldPromise;
        return new Response(JSON.stringify([{ tconst: "tt2", title: "New Show", startYear: 2020, endYear: 2020, rating: 8, votes: 10 }]));
      }
      return new Response(JSON.stringify([]));
    }));
    renderApp("/");
    const input = screen.getByPlaceholderText(/search/i);
    fireEvent.change(input, { target: { value: "old" } });
    await new Promise((r) => setTimeout(r, 250));
    fireEvent.change(input, { target: { value: "new" } });
    expect(await screen.findByText("New Show")).toBeDefined();
    resolveOld(new Response(JSON.stringify([{ tconst: "tt1", title: "Old Show", startYear: 2020, endYear: 2020, rating: 8, votes: 10 }])));
    await new Promise((r) => setTimeout(r, 50));
    expect(screen.queryByText("Old Show")).toBeNull();
  });
  it("shows setup card when search reports not ingested", async () => {
    vi.stubGlobal("fetch", vi.fn(async (url: string) => {
      const u = String(url);
      if (u.includes("/api/status")) return new Response(JSON.stringify({ ingested: true, datasetDate: null, showCount: 0, episodeCount: 0 }));
      if (u.includes("/api/search")) return new Response(JSON.stringify({ error: "not_ingested" }), { status: 503 });
      return new Response(JSON.stringify([]));
    }));
    renderApp("/");
    fireEvent.change(screen.getByPlaceholderText(/search/i), { target: { value: "x" } });
    expect(await screen.findByText(/npm run ingest/)).toBeDefined();
  });
});
