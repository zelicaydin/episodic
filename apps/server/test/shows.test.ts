import { describe, it, expect } from "vitest";
import type { ShowDetails } from "@scoretrack/shared";
import { createApp } from "../src/app.js";
import { fixtureDbs } from "./fixtures.js";

describe("GET /api/shows/:tconst", () => {
  it("assembles the grid with seasons, averages, insights, verdict", async () => {
    const app = createApp(fixtureDbs());
    const res = await app.request("/api/shows/tt10");
    expect(res.status).toBe(200);
    const b = await res.json() as ShowDetails;
    expect(b.title).toBe("Fake Show");
    expect(b.genres).toEqual(["Drama", "Crime"]);
    expect(b.episodeCount).toBe(4);
    expect(b.unplacedCount).toBe(1);
    expect(b.seasons.length).toBe(2);
    expect(b.seasons[0]?.episodes.map((e) => e.tconst)).toEqual(["tt11", "tt12"]);
    expect(b.seasons[0]?.average).toBeCloseTo(8.7);
    expect(b.insights.peak?.tconst).toBe("tt15");
    expect(b.insights.verdict.length).toBeGreaterThan(0);
    // watch time: 47 + 45 + 45 + 45 (nulls fall back to show runtime 45)
    expect(b.totalWatchMinutes).toBe(182);
    expect(b.saved).toBe(false);
    expect(b.poster).toBeNull();
  });
  it("404s for unknown shows", async () => {
    const res = await createApp(fixtureDbs()).request("/api/shows/tt404");
    expect(res.status).toBe(404);
  });
  it("records the view in recently_viewed", async () => {
    const dbs = fixtureDbs();
    await createApp(dbs).request("/api/shows/tt10");
    const row = dbs.user.prepare("SELECT tconst FROM recently_viewed").all();
    expect(row).toEqual([{ tconst: "tt10" }]);
  });
  it("merges watched flags and my rating", async () => {
    const dbs = fixtureDbs();
    dbs.user.prepare("INSERT INTO watched VALUES ('tt11', datetime('now'))").run();
    dbs.user.prepare("INSERT INTO my_ratings VALUES ('tt10', 9, datetime('now'))").run();
    const b = await (await createApp(dbs).request("/api/shows/tt10")).json() as ShowDetails;
    expect(b.seasons[0]?.episodes[0]?.watched).toBe(true);
    expect(b.myRating).toBe(9);
    expect(b.watchedCount).toBe(1);
  });
});
