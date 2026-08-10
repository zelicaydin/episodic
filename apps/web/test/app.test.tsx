import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import { renderApp } from "./helpers";

beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn(async (url: string) => {
    if (String(url).includes("/api/status")) {
      return new Response(JSON.stringify({ ingested: true, datasetDate: "2026-08-10", showCount: 1, episodeCount: 1 }));
    }
    return new Response(JSON.stringify([]));
  }));
});

describe("App shell", () => {
  it("renders nav and attribution footer", async () => {
    renderApp("/");
    expect(screen.getByRole("link", { name: "Episodic" })).toBeDefined();
    expect(screen.getByRole("link", { name: "My Shows" })).toBeDefined();
    expect(await screen.findByText(/Information courtesy of IMDb/)).toBeDefined();
    expect(screen.getByText(/Show artwork and summaries from TVmaze\.com/)).toBeDefined();
  });
});
