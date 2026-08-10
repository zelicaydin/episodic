import { describe, it, expect, vi } from "vitest";
import { makePosterResolver } from "../src/posters.js";
import { fixtureDbs } from "./fixtures.js";

const payload = {
  image: { medium: "https://m/med.jpg", original: "https://m/orig.jpg" },
  summary: "<p>A drama.</p>",
};

describe("makePosterResolver", () => {
  it("fetches, maps and caches", async () => {
    const dbs = fixtureDbs();
    const fetchImpl = vi.fn(async () => new Response(JSON.stringify(payload)));
    const resolve = makePosterResolver(dbs.user, fetchImpl as unknown as typeof fetch);
    const first = await resolve("tt10");
    expect(first).toEqual({ poster: "https://m/orig.jpg", overview: "A drama." });
    const second = await resolve("tt10");
    expect(second).toEqual(first);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it("caches a 404 as nulls", async () => {
    const dbs = fixtureDbs();
    const fetchImpl = vi.fn(async () => new Response("not found", { status: 404 }));
    const resolve = makePosterResolver(dbs.user, fetchImpl as unknown as typeof fetch);
    expect(await resolve("tt10")).toEqual({ poster: null, overview: null });
    expect(await resolve("tt10")).toEqual({ poster: null, overview: null });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(dbs.user.prepare("SELECT COUNT(*) c FROM tmdb_cache").get()).toEqual({ c: 1 });
  });

  it("does not cache a 500", async () => {
    const dbs = fixtureDbs();
    const fetchImpl = vi.fn(async () => new Response("err", { status: 500 }));
    const resolve = makePosterResolver(dbs.user, fetchImpl as unknown as typeof fetch);
    expect(await resolve("tt10")).toEqual({ poster: null, overview: null });
    expect(await resolve("tt10")).toEqual({ poster: null, overview: null });
    expect(fetchImpl).toHaveBeenCalledTimes(2);
    expect(dbs.user.prepare("SELECT COUNT(*) c FROM tmdb_cache").get()).toEqual({ c: 0 });
  });

  it("refetches after the cache entry expires", async () => {
    const dbs = fixtureDbs();
    const stale = new Date(Date.now() - 8 * 24 * 3600 * 1000).toISOString();
    dbs.user.prepare("INSERT INTO tmdb_cache VALUES ('tvmaze:tt10', ?, ?)")
      .run(JSON.stringify({ poster: null, overview: null }), stale);
    const fetchImpl = vi.fn(async () => new Response(JSON.stringify(payload)));
    const resolve = makePosterResolver(dbs.user, fetchImpl as unknown as typeof fetch);
    expect(await resolve("tt10")).toEqual({ poster: "https://m/orig.jpg", overview: "A drama." });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it("strips HTML markup from the summary", async () => {
    const dbs = fixtureDbs();
    const fetchImpl = vi.fn(async () => new Response(JSON.stringify({
      image: { medium: "https://m/med.jpg", original: "https://m/orig.jpg" },
      summary: "<p><b>Bold</b> text</p>",
    })));
    const resolve = makePosterResolver(dbs.user, fetchImpl as unknown as typeof fetch);
    expect(await resolve("tt10")).toEqual({ poster: "https://m/orig.jpg", overview: "Bold text" });
  });
});
