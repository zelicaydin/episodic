import { describe, it, expect } from "vitest";
import { createApp } from "../src/app.js";
import { fixtureDbs } from "./fixtures.js";

describe("GET /api/status", () => {
  it("reports dataset info when ingested", async () => {
    const app = createApp(fixtureDbs());
    const res = await app.request("/api/status");
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      ingested: true, datasetDate: "2026-08-10", showCount: 3, episodeCount: 8,
    });
  });
  it("reports not ingested when imdb.db is missing", async () => {
    const dbs = fixtureDbs();
    const app = createApp({ imdb: null, user: dbs.user });
    const res = await app.request("/api/status");
    expect(await res.json()).toEqual({
      ingested: false, datasetDate: null, showCount: 0, episodeCount: 0,
    });
  });
});
