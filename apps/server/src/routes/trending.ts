import { Hono } from "hono";
import type { TrendingEntry } from "@episodic/shared";
import type { Dbs } from "../db.js";
import { toSearchResult } from "./search.js";
import { isTconst } from "../tconst.js";

const CACHE_MS = 12 * 3600 * 1000;
const LOOKBACK_DAYS = 7;
const FALLBACK_THRESHOLD = 8;
const TARGET_COUNT = 16;

interface ShowRow {
  tconst: string; title: string; start_year: number | null; end_year: number | null;
  avg_rating: number | null; num_votes: number;
}

interface ScheduleShow { externals?: { imdb?: string | null } | null; }
interface ScheduleEntry { show?: ScheduleShow; _embedded?: { show?: ScheduleShow }; }

function utcDateString(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function lastNDates(n: number): string[] {
  const now = new Date();
  const dates: string[] = [];
  for (let i = 0; i < n; i++) {
    dates.push(utcDateString(new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - i))));
  }
  return dates;
}

async function fetchScheduleImdbIds(fetchImpl: typeof fetch, url: string): Promise<string[]> {
  try {
    const res = await fetchImpl(url);
    if (!res.ok) return [];
    const entries = await res.json() as ScheduleEntry[];
    const ids: string[] = [];
    for (const entry of entries) {
      const show = entry.show ?? entry._embedded?.show;
      const imdb = show?.externals?.imdb;
      if (typeof imdb === "string" && isTconst(imdb)) ids.push(imdb);
    }
    return ids;
  } catch {
    return [];
  }
}

// Which shows are actually airing right now, per TVmaze's schedule for the last 7 days.
// Cached (as the resolved imdb id list) in tmdb_cache for 12h so we don't hit TVmaze on
// every home page load.
async function airingImdbIds(dbs: Dbs, fetchImpl: typeof fetch): Promise<string[]> {
  const cacheKey = `airing:${utcDateString(new Date())}`;
  const hit = dbs.user.prepare("SELECT json, fetched_at FROM tmdb_cache WHERE cache_key = ?")
    .get(cacheKey) as { json: string; fetched_at: string } | undefined;
  if (hit && Date.now() - Date.parse(hit.fetched_at) < CACHE_MS) {
    return JSON.parse(hit.json) as string[];
  }

  const urls = lastNDates(LOOKBACK_DAYS).flatMap((d) => [
    `https://api.tvmaze.com/schedule/web?date=${d}`,
    `https://api.tvmaze.com/schedule?country=US&date=${d}`,
  ]);
  const results = await Promise.all(urls.map((u) => fetchScheduleImdbIds(fetchImpl, u)));
  const ids = [...new Set(results.flat())];

  dbs.user.prepare(
    "INSERT INTO tmdb_cache VALUES (?, ?, ?) " +
    "ON CONFLICT(cache_key) DO UPDATE SET json = excluded.json, fetched_at = excluded.fetched_at",
  ).run(cacheKey, JSON.stringify(ids), new Date().toISOString());

  return ids;
}

export function trendingRoutes(
  dbs: Dbs, getPosters: (tconst: string) => Promise<{ poster: string | null; overview: string | null }>,
  fetchImpl: typeof fetch = fetch,
): Hono {
  const app = new Hono();
  app.get("/", async (c) => {
    if (dbs.imdb === null) return c.json({ error: "not_ingested" }, 503);

    const airingIds = await airingImdbIds(dbs, fetchImpl);
    let rows: ShowRow[] = [];
    if (airingIds.length > 0) {
      const placeholders = airingIds.map(() => "?").join(",");
      rows = dbs.imdb.prepare(`
        SELECT tconst, title, start_year, end_year, avg_rating, num_votes
        FROM shows WHERE tconst IN (${placeholders}) ORDER BY num_votes DESC LIMIT ${TARGET_COUNT}
      `).all(...airingIds) as ShowRow[];
    }

    // Network down, TVmaze schedule sparse, or too few of the airing shows are in our
    // dataset: fall back to the all-time top by votes so the home page is never empty.
    if (rows.length < FALLBACK_THRESHOLD) {
      rows = dbs.imdb.prepare(`
        SELECT tconst, title, start_year, end_year, avg_rating, num_votes
        FROM shows ORDER BY num_votes DESC LIMIT ${TARGET_COUNT}
      `).all() as ShowRow[];
    }

    const entries: TrendingEntry[] = await Promise.all(
      rows.map(async (r) => ({ ...toSearchResult(r), poster: (await getPosters(r.tconst)).poster })),
    );
    return c.json(entries);
  });
  return app;
}
