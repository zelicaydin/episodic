import { describe, it, expect } from "vitest";
import { createApp } from "../src/app.js";
import { fixtureDbs } from "./fixtures.js";

describe("GET /api/search", () => {
  const app = createApp(fixtureDbs());
  it("matches by prefix, ordered by votes", async () => {
    const res = await app.request("/api/search?q=fak");
    const body = await res.json();
    expect(body).toEqual([{
      tconst: "tt10", title: "Fake Show", startYear: 2010, endYear: 2015,
      rating: 8.9, votes: 120000,
    }]);
  });
  it("returns empty list for no match and for blank q", async () => {
    expect(await (await app.request("/api/search?q=zzzz")).json()).toEqual([]);
    expect(await (await app.request("/api/search?q=")).json()).toEqual([]);
  });
  it("survives FTS metacharacters in the query", async () => {
    const res = await app.request(`/api/search?q=${encodeURIComponent('fake "show* OR')}`);
    expect(res.status).toBe(200);
  });
  it("503s when not ingested", async () => {
    const dbs = fixtureDbs();
    const res = await createApp({ imdb: null, user: dbs.user }).request("/api/search?q=x");
    expect(res.status).toBe(503);
  });
});

describe("GET /api/trending", () => {
  it("returns shows by vote count", async () => {
    const app = createApp(fixtureDbs(), {
      fetchImpl: (async () => new Response("", { status: 404 })) as unknown as typeof fetch,
    });
    const res = await app.request("/api/trending");
    const body = await res.json() as { tconst: string; poster: string | null }[];
    expect(body[0]?.tconst).toBe("tt10");
    expect(body.length).toBe(3);
    for (const entry of body) expect(entry.poster).toBeNull();
  });
});
