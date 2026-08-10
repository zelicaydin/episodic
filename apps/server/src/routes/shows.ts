import { Hono } from "hono";
import type { Dbs } from "../db.js";
import { buildShowDetails } from "../show-details.js";

export function showsRoutes(dbs: Dbs, getTmdb: (tconst: string) => Promise<{ poster: string | null; overview: string | null }>): Hono {
  const app = new Hono();
  app.get("/:tconst", async (c) => {
    if (dbs.imdb === null) return c.json({ error: "not_ingested" }, 503);
    const tconst = c.req.param("tconst");
    const details = buildShowDetails(dbs, tconst, await getTmdb(tconst));
    if (details === null) return c.json({ error: "not_found" }, 404);
    const now = new Date().toISOString();
    dbs.user.prepare(
      "INSERT INTO recently_viewed VALUES (?, ?) ON CONFLICT(tconst) DO UPDATE SET viewed_at = excluded.viewed_at",
    ).run(tconst, now);
    if (details.saved) {
      dbs.user.prepare(
        "UPDATE saved_shows SET last_opened_at = ?, episode_count_at_last_open = ? WHERE tconst = ?",
      ).run(now, details.episodeCount, tconst);
    }
    return c.json(details);
  });
  return app;
}
