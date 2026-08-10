import type Database from "better-sqlite3";

export interface TmdbInfo { poster: string | null; overview: string | null; }
const WEEK_MS = 7 * 24 * 3600 * 1000;

export function makeTmdbResolver(
  user: Database.Database, key: string | null, fetchImpl: typeof fetch = fetch,
): (tconst: string) => Promise<TmdbInfo> {
  return async (tconst: string): Promise<TmdbInfo> => {
    if (key === null || key === "") return { poster: null, overview: null };
    const cacheKey = `find:${tconst}`;
    const hit = user.prepare("SELECT json, fetched_at FROM tmdb_cache WHERE cache_key = ?")
      .get(cacheKey) as { json: string; fetched_at: string } | undefined;
    if (hit && Date.now() - Date.parse(hit.fetched_at) < WEEK_MS) {
      return JSON.parse(hit.json) as TmdbInfo;
    }
    let info: TmdbInfo = { poster: null, overview: null };
    try {
      const res = await fetchImpl(
        `https://api.themoviedb.org/3/find/${tconst}?external_source=imdb_id&api_key=${key}`,
      );
      if (res.ok) {
        const body = await res.json() as { tv_results?: { poster_path?: string | null; overview?: string | null }[] };
        const tv = body.tv_results?.[0];
        if (tv !== undefined) {
          info = {
            poster: tv.poster_path ? `https://image.tmdb.org/t/p/w342${tv.poster_path}` : null,
            overview: tv.overview ?? null,
          };
        }
        user.prepare(
          "INSERT INTO tmdb_cache VALUES (?, ?, ?) " +
          "ON CONFLICT(cache_key) DO UPDATE SET json = excluded.json, fetched_at = excluded.fetched_at",
        ).run(cacheKey, JSON.stringify(info), new Date().toISOString());
      }
    } catch {
      // offline or TMDB down: serve without posters, do not cache the failure
    }
    return info;
  };
}
