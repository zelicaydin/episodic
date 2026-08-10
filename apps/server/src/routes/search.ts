import { Hono } from "hono";
import type { SearchResult } from "@scoretrack/shared";
import type { Dbs } from "../db.js";

interface ShowRow {
  tconst: string; title: string; start_year: number | null; end_year: number | null;
  avg_rating: number | null; num_votes: number;
}

export function toSearchResult(r: ShowRow): SearchResult {
  return { tconst: r.tconst, title: r.title, startYear: r.start_year,
    endYear: r.end_year, rating: r.avg_rating, votes: r.num_votes };
}

export function searchRoutes(dbs: Dbs): Hono {
  const app = new Hono();
  app.get("/", (c) => {
    if (dbs.imdb === null) return c.json({ error: "not_ingested" }, 503);
    const q = (c.req.query("q") ?? "").trim();
    if (q === "") return c.json([]);
    const phrase = '"' + q.replaceAll('"', "").replaceAll("*", "") + '"*';
    const rows = dbs.imdb.prepare(`
      SELECT s.tconst, s.title, s.start_year, s.end_year, s.avg_rating, s.num_votes
      FROM shows_fts f JOIN shows s ON s.tconst = f.tconst
      WHERE shows_fts MATCH ? ORDER BY s.num_votes DESC LIMIT 20
    `).all(phrase) as ShowRow[];
    return c.json(rows.map(toSearchResult));
  });
  return app;
}
