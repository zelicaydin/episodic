import { Hono } from "hono";
import type { Dbs } from "../db.js";
import { toSearchResult } from "./search.js";

export function trendingRoutes(dbs: Dbs): Hono {
  const app = new Hono();
  app.get("/", (c) => {
    if (dbs.imdb === null) return c.json({ error: "not_ingested" }, 503);
    const rows = dbs.imdb.prepare(`
      SELECT tconst, title, start_year, end_year, avg_rating, num_votes
      FROM shows ORDER BY num_votes DESC LIMIT 24
    `).all() as Parameters<typeof toSearchResult>[0][];
    return c.json(rows.map(toSearchResult));
  });
  return app;
}
