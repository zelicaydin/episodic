import { Hono } from "hono";
import type { MyShowEntry, OkResponse, SearchResult } from "@episodic/shared";
import type { Dbs } from "../db.js";
import { buildShowDetails } from "../show-details.js";
import { toSearchResult } from "./search.js";

const OK: OkResponse = { ok: true };

export function myRoutes(dbs: Dbs, getTmdb: (tconst: string) => Promise<{ poster: string | null; overview: string | null }>): Hono {
  const app = new Hono();

  app.get("/shows", async (c) => {
    const saved = dbs.user.prepare(
      "SELECT tconst, episode_count_at_last_open FROM saved_shows ORDER BY saved_at DESC",
    ).all() as { tconst: string; episode_count_at_last_open: number | null }[];
    const entries: MyShowEntry[] = [];
    for (const s of saved) {
      const d = buildShowDetails(dbs, s.tconst, await getTmdb(s.tconst));
      if (d === null) continue;
      entries.push({
        tconst: d.tconst, title: d.title, poster: d.poster,
        verdict: d.insights.verdict, watchedCount: d.watchedCount,
        episodeCount: d.episodeCount,
        newEpisodes: Math.max(0, d.episodeCount - (s.episode_count_at_last_open ?? d.episodeCount)),
      });
    }
    return c.json(entries);
  });

  app.post("/shows/:tconst", (c) => {
    const tconst = c.req.param("tconst");
    const count = dbs.imdb === null ? 0 : (dbs.imdb.prepare(
      "SELECT COUNT(*) c FROM episodes WHERE parent_tconst = ? AND season IS NOT NULL AND episode IS NOT NULL",
    ).get(tconst) as { c: number }).c;
    dbs.user.prepare(
      "INSERT INTO saved_shows VALUES (?, datetime('now'), datetime('now'), ?) " +
      "ON CONFLICT(tconst) DO NOTHING",
    ).run(tconst, count);
    return c.json(OK);
  });

  app.delete("/shows/:tconst", (c) => {
    dbs.user.prepare("DELETE FROM saved_shows WHERE tconst = ?").run(c.req.param("tconst"));
    return c.json(OK);
  });

  app.put("/watched/:ep", (c) => {
    dbs.user.prepare(
      "INSERT INTO watched VALUES (?, datetime('now')) ON CONFLICT(episode_tconst) DO NOTHING",
    ).run(c.req.param("ep"));
    return c.json(OK);
  });

  app.delete("/watched/:ep", (c) => {
    dbs.user.prepare("DELETE FROM watched WHERE episode_tconst = ?").run(c.req.param("ep"));
    return c.json(OK);
  });

  app.put("/ratings/:tconst", async (c) => {
    const body = await c.req.json().catch(() => null) as { rating?: unknown } | null;
    const r = body?.rating;
    if (typeof r !== "number" || !Number.isInteger(r) || r < 1 || r > 10) {
      return c.json({ error: "bad_request" }, 400);
    }
    dbs.user.prepare(
      "INSERT INTO my_ratings VALUES (?, ?, datetime('now')) " +
      "ON CONFLICT(tconst) DO UPDATE SET rating = excluded.rating, rated_at = excluded.rated_at",
    ).run(c.req.param("tconst"), r);
    return c.json(OK);
  });

  app.get("/recently-viewed", (c) => {
    if (dbs.imdb === null) return c.json([]);
    const recent = dbs.user.prepare(
      "SELECT tconst FROM recently_viewed ORDER BY viewed_at DESC LIMIT 12",
    ).all() as { tconst: string }[];
    const get = dbs.imdb.prepare(
      "SELECT tconst, title, start_year, end_year, avg_rating, num_votes FROM shows WHERE tconst = ?",
    );
    const out: SearchResult[] = [];
    for (const r of recent) {
      const row = get.get(r.tconst);
      if (row !== undefined) out.push(toSearchResult(row as Parameters<typeof toSearchResult>[0]));
    }
    return c.json(out);
  });

  return app;
}
