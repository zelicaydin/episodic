import { describe, it, expect } from "vitest";
import { createApp } from "../src/app.js";
import { fixtureDbs } from "./fixtures.js";
import type { Dbs } from "../src/db.js";

// Give the fixture enough "airing" shows to clear the fallback threshold (8), and one
// high-vote show that is NOT airing, to prove the airing path is actually driving the
// result rather than just falling back to plain vote order.
function withAiringNeighbors(): Dbs {
  const dbs = fixtureDbs();
  const show = dbs.imdb!.prepare("INSERT INTO shows VALUES (?,?,?,?,?,?,?,?)");
  for (let i = 0; i < 8; i++) {
    show.run(`tt2${i}`, `Airing Show ${i}`, 2020, null, "Drama", 40, 7.5, 1000 + i);
  }
  show.run("tt999", "Not Airing But Huge", 2015, null, "Drama", 40, 8.0, 999999);
  return dbs;
}

// Note: this fetchImpl is shared with the poster resolver too (same wiring as production),
// so `calls` also picks up per-show tvmaze lookups; tests that count requests filter to
// schedule-only calls.
function scheduleFetch(imdbIds: string[], calls: string[]): typeof fetch {
  return (async (url: string) => {
    calls.push(String(url));
    const u = String(url);
    if (u.includes("schedule/web")) {
      return new Response(JSON.stringify(imdbIds.map((id) => ({ _embedded: { show: { externals: { imdb: id } } } }))));
    }
    if (u.includes("schedule")) {
      return new Response(JSON.stringify(imdbIds.map((id) => ({ show: { externals: { imdb: id } } } ))));
    }
    return new Response("", { status: 404 });
  }) as unknown as typeof fetch;
}

const scheduleCalls = (calls: string[]) => calls.filter((u) => u.includes("schedule"));

describe("GET /api/trending", () => {
  it("builds the list from TVmaze's schedule, not just all-time votes", async () => {
    const dbs = withAiringNeighbors();
    const airingIds = Array.from({ length: 8 }, (_, i) => `tt2${i}`);
    const calls: string[] = [];
    const app = createApp(dbs, { fetchImpl: scheduleFetch(airingIds, calls) });
    const res = await app.request("/api/trending");
    expect(res.status).toBe(200);
    const body = await res.json() as { tconst: string; poster: string | null }[];
    const ids = body.map((s) => s.tconst);
    for (const id of airingIds) expect(ids).toContain(id);
    expect(ids).not.toContain("tt999");
    expect(scheduleCalls(calls).length).toBe(14);
  });
  it("caches the resolved airing list so a second request does not re-hit TVmaze", async () => {
    const dbs = withAiringNeighbors();
    const airingIds = Array.from({ length: 8 }, (_, i) => `tt2${i}`);
    const calls: string[] = [];
    const app = createApp(dbs, { fetchImpl: scheduleFetch(airingIds, calls) });
    await app.request("/api/trending");
    const afterFirst = scheduleCalls(calls).length;
    await app.request("/api/trending");
    expect(scheduleCalls(calls).length).toBe(afterFirst);
  });
  it("falls back to all-time vote order when TVmaze is unreachable", async () => {
    const app = createApp(fixtureDbs(), {
      fetchImpl: (async () => { throw new Error("network down"); }) as unknown as typeof fetch,
    });
    const res = await app.request("/api/trending");
    expect(res.status).toBe(200);
    const body = await res.json() as { tconst: string; poster: string | null }[];
    expect(body.length).toBeGreaterThan(0);
    expect(body[0]?.tconst).toBe("tt10");
    for (const entry of body) expect(entry.poster).toBeNull();
  });
  it("falls back to all-time vote order when TVmaze returns errors", async () => {
    const app = createApp(fixtureDbs(), {
      fetchImpl: (async () => new Response("", { status: 404 })) as unknown as typeof fetch,
    });
    const res = await app.request("/api/trending");
    const body = await res.json() as { tconst: string; poster: string | null }[];
    expect(body[0]?.tconst).toBe("tt10");
    expect(body.length).toBe(3);
  });
  it("503s when not ingested", async () => {
    const dbs = fixtureDbs();
    const res = await createApp({ imdb: null, user: dbs.user }).request("/api/trending");
    expect(res.status).toBe(503);
  });
});
