import { describe, it, expect } from "vitest";
import { createApp } from "../src/app.js";
import { fixtureDbs } from "./fixtures.js";

// Production keeps the 5000-vote floor; add a couple of extra Drama shows here with
// plenty of votes so the fixture's own tiny shows don't need special-casing.
function withDramaNeighbors() {
  const dbs = fixtureDbs();
  const show = dbs.imdb!.prepare("INSERT INTO shows VALUES (?,?,?,?,?,?,?,?)");
  // tt50 shares one genre (Drama) with more votes; tt51 shares both (Drama, Crime) with
  // fewer votes, so it should still rank first: shared-genre count beats vote count.
  show.run("tt50", "Drama Cousin", 2011, 2016, "Drama", 40, 8.7, 60000);
  show.run("tt51", "Crime Sibling", 2012, 2017, "Drama,Crime", 42, 9.0, 50000);
  return dbs;
}

describe("GET /api/shows/:tconst/similar", () => {
  it("returns genre-sharing shows, excludes the source, respects the limit", async () => {
    const app = createApp(withDramaNeighbors());
    const res = await app.request("/api/shows/tt10/similar");
    expect(res.status).toBe(200);
    const body = await res.json() as { tconst: string; poster: string | null }[];
    const ids = body.map((s) => s.tconst);
    expect(ids).toContain("tt50");
    expect(ids).toContain("tt51");
    expect(ids).not.toContain("tt10");
    expect(body.length).toBeLessThanOrEqual(8);
  });
  it("orders by shared genre count then votes", async () => {
    const app = createApp(withDramaNeighbors());
    const res = await app.request("/api/shows/tt10/similar");
    const body = await res.json() as { tconst: string }[];
    // tt51 shares both Crime and Drama with the source (tt10: Drama,Crime); tt50 shares only Drama.
    const i50 = body.findIndex((s) => s.tconst === "tt50");
    const i51 = body.findIndex((s) => s.tconst === "tt51");
    expect(i51).toBeLessThan(i50);
  });
  it("excludes low-vote and unrated shows from the fixture", async () => {
    const app = createApp(withDramaNeighbors());
    const res = await app.request("/api/shows/tt10/similar");
    const body = await res.json() as { tconst: string }[];
    const ids = body.map((s) => s.tconst);
    expect(ids).not.toContain("tt30");
    expect(ids).not.toContain("tt40");
  });
  it("404s for a junk id", async () => {
    const app = createApp(withDramaNeighbors());
    const res = await app.request("/api/shows/not-a-tconst/similar");
    expect(res.status).toBe(404);
  });
  it("404s for a well-formed but unknown id", async () => {
    const app = createApp(withDramaNeighbors());
    const res = await app.request("/api/shows/tt99999/similar");
    expect(res.status).toBe(404);
  });
  it("503s when not ingested", async () => {
    const dbs = withDramaNeighbors();
    const res = await createApp({ imdb: null, user: dbs.user }).request("/api/shows/tt10/similar");
    expect(res.status).toBe(503);
  });
  it("falls back to top-voted shows when the source has no genres", async () => {
    const app = createApp(withDramaNeighbors());
    const res = await app.request("/api/shows/tt40/similar");
    expect(res.status).toBe(200);
    const body = await res.json() as { tconst: string }[];
    expect(body.map((s) => s.tconst)).not.toContain("tt40");
    expect(body.length).toBeGreaterThan(0);
  });
});
