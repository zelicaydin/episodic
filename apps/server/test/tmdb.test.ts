import { describe, it, expect, vi } from "vitest";
import { makeTmdbResolver } from "../src/tmdb.js";
import { fixtureDbs } from "./fixtures.js";

const payload = { tv_results: [{ poster_path: "/abc.jpg", overview: "A drama." }] };

describe("makeTmdbResolver", () => {
  it("returns nulls without a key and never fetches", async () => {
    const fetchImpl = vi.fn();
    const resolve = makeTmdbResolver(fixtureDbs().user, null, fetchImpl as unknown as typeof fetch);
    expect(await resolve("tt10")).toEqual({ poster: null, overview: null });
    expect(fetchImpl).not.toHaveBeenCalled();
  });
  it("fetches, maps and caches", async () => {
    const dbs = fixtureDbs();
    const fetchImpl = vi.fn(async () => new Response(JSON.stringify(payload)));
    const resolve = makeTmdbResolver(dbs.user, "k", fetchImpl as unknown as typeof fetch);
    const first = await resolve("tt10");
    expect(first).toEqual({ poster: "https://image.tmdb.org/t/p/w342/abc.jpg", overview: "A drama." });
    const second = await resolve("tt10");
    expect(second).toEqual(first);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });
  it("degrades to nulls on network failure", async () => {
    const fetchImpl = vi.fn(async () => { throw new Error("offline"); });
    const resolve = makeTmdbResolver(fixtureDbs().user, "k", fetchImpl as unknown as typeof fetch);
    expect(await resolve("tt10")).toEqual({ poster: null, overview: null });
  });
  it("does not cache non-ok responses", async () => {
    const dbs = fixtureDbs();
    const fetchImpl = vi.fn(async () => new Response("err", { status: 500 }));
    const resolve = makeTmdbResolver(dbs.user, "k", fetchImpl as unknown as typeof fetch);
    expect(await resolve("tt10")).toEqual({ poster: null, overview: null });
    expect(await resolve("tt10")).toEqual({ poster: null, overview: null });
    expect(fetchImpl).toHaveBeenCalledTimes(2);
    expect(dbs.user.prepare("SELECT COUNT(*) c FROM tmdb_cache").get()).toEqual({ c: 0 });
  });
  it("refetches after the cache entry expires", async () => {
    const dbs = fixtureDbs();
    const stale = new Date(Date.now() - 8 * 24 * 3600 * 1000).toISOString();
    dbs.user.prepare("INSERT INTO tmdb_cache VALUES ('find:tt10', ?, ?)")
      .run(JSON.stringify({ poster: null, overview: null }), stale);
    const fetchImpl = vi.fn(async () => new Response(JSON.stringify(payload)));
    const resolve = makeTmdbResolver(dbs.user, "k", fetchImpl as unknown as typeof fetch);
    expect(await resolve("tt10")).toEqual({ poster: "https://image.tmdb.org/t/p/w342/abc.jpg", overview: "A drama." });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });
});
