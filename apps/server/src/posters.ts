import type Database from "better-sqlite3";

export interface PosterInfo { poster: string | null; overview: string | null; }
const WEEK_MS = 7 * 24 * 3600 * 1000;

export function makePosterResolver(
  user: Database.Database, fetchImpl: typeof fetch = fetch,
): (tconst: string) => Promise<PosterInfo> {
  return async (tconst: string): Promise<PosterInfo> => {
    const cacheKey = `tvmaze:${tconst}`;
    // table name is a holdover from the original TMDB integration; schema is source-agnostic
    const hit = user.prepare("SELECT json, fetched_at FROM tmdb_cache WHERE cache_key = ?")
      .get(cacheKey) as { json: string; fetched_at: string } | undefined;
    if (hit && Date.now() - Date.parse(hit.fetched_at) < WEEK_MS) {
      return JSON.parse(hit.json) as PosterInfo;
    }
    let info: PosterInfo = { poster: null, overview: null };
    try {
      const res = await fetchImpl(`https://api.tvmaze.com/lookup/shows?imdb=${tconst}`);
      if (res.ok || res.status === 404) {
        if (res.ok) {
          const body = await res.json() as {
            image?: { medium?: string | null; original?: string | null } | null;
            summary?: string | null;
          };
          info = {
            poster: body.image?.original ?? body.image?.medium ?? null,
            overview: body.summary ? body.summary.replace(/<[^>]*>/g, "").trim() || null : null,
          };
        }
        user.prepare(
          "INSERT INTO tmdb_cache VALUES (?, ?, ?) " +
          "ON CONFLICT(cache_key) DO UPDATE SET json = excluded.json, fetched_at = excluded.fetched_at",
        ).run(cacheKey, JSON.stringify(info), new Date().toISOString());
      } else {
        console.warn(`tvmaze lookup failed for ${tconst}: HTTP ${res.status}`);
      }
    } catch (err) {
      console.warn(`tvmaze lookup failed for ${tconst}:`, err instanceof Error ? err.message : err);
    }
    return info;
  };
}
