import { Hono } from "hono";
import type { TrendingEntry } from "@episodic/shared";
import type { Dbs } from "../db.js";
import { toSearchResult } from "./search.js";

export function trendingRoutes(
  dbs: Dbs, getPosters: (tconst: string) => Promise<{ poster: string | null; overview: string | null }>,
): Hono {
  const app = new Hono();
  app.get("/", async (c) => {
    if (dbs.imdb === null) return c.json({ error: "not_ingested" }, 503);
    const rows = dbs.imdb.prepare(`
      SELECT tconst, title, start_year, end_year, avg_rating, num_votes
      FROM shows ORDER BY num_votes DESC LIMIT 16
    `).all() as Parameters<typeof toSearchResult>[0][];
    const entries: TrendingEntry[] = await Promise.all(
      rows.map(async (r) => ({ ...toSearchResult(r), poster: (await getPosters(r.tconst)).poster })),
    );
    return c.json(entries);
  });
  return app;
}
