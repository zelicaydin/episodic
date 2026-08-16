import { Hono } from "hono";
import type { SimilarShow } from "@episodic/shared";
import type { Dbs } from "../db.js";
import { toSearchResult } from "./search.js";
import { isTconst } from "../tconst.js";

interface ShowRow {
  tconst: string; title: string; start_year: number | null; end_year: number | null;
  avg_rating: number | null; num_votes: number;
}

/**
 * "Similar shows": rank other shows by number of shared genres (desc), then by vote
 * count (desc), restricted to shows with enough votes to be a meaningful recommendation
 * and a rating within 1.5 of the source (quality proximity). Falls back to the
 * highest-voted shows overall when the source has no genres to match on.
 */
export function similarRoutes(
  dbs: Dbs, getPosters: (tconst: string) => Promise<{ poster: string | null; overview: string | null }>,
): Hono {
  const app = new Hono();
  app.get("/:tconst/similar", async (c) => {
    if (dbs.imdb === null) return c.json({ error: "not_ingested" }, 503);
    const tconst = c.req.param("tconst");
    if (!isTconst(tconst)) return c.json({ error: "not_found" }, 404);

    const source = dbs.imdb.prepare("SELECT genres, avg_rating FROM shows WHERE tconst = ?")
      .get(tconst) as { genres: string | null; avg_rating: number | null } | undefined;
    if (source === undefined) return c.json({ error: "not_found" }, 404);

    const genres = (source.genres ?? "").split(",").map((g) => g.trim()).filter((g) => g !== "");

    let rows: ShowRow[];
    if (genres.length === 0) {
      rows = dbs.imdb.prepare(`
        SELECT tconst, title, start_year, end_year, avg_rating, num_votes
        FROM shows WHERE tconst != ? ORDER BY num_votes DESC LIMIT 8
      `).all(tconst) as ShowRow[];
    } else {
      const scoreExpr = genres.map(() => "(CASE WHEN genres LIKE ? THEN 1 ELSE 0 END)").join(" + ");
      const genreConds = genres.map(() => "genres LIKE ?").join(" OR ");
      const genreParams = genres.map((g) => `%${g}%`);
      rows = dbs.imdb.prepare(`
        SELECT tconst, title, start_year, end_year, avg_rating, num_votes,
          (${scoreExpr}) AS score
        FROM shows
        WHERE tconst != ?
          AND num_votes >= 5000
          AND avg_rating IS NOT NULL
          AND ABS(avg_rating - ?) <= 1.5
          AND (${genreConds})
        ORDER BY score DESC, num_votes DESC
        LIMIT 8
      `).all(...genreParams, tconst, source.avg_rating, ...genreParams) as ShowRow[];
    }

    const results: SimilarShow[] = await Promise.all(
      rows.map(async (r) => ({ ...toSearchResult(r), poster: (await getPosters(r.tconst)).poster })),
    );
    return c.json(results);
  });
  return app;
}
