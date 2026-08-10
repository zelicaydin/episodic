import type { Dbs } from "./db.js";
import type { EpisodeCell, SeasonGrid, ShowDetails } from "@scoretrack/shared";
import { computeInsights, seasonAverage } from "./insights/insights.js";
import { pickVerdict } from "./insights/verdict.js";

interface ShowRow {
  tconst: string; title: string; start_year: number | null; end_year: number | null;
  genres: string | null; runtime_minutes: number | null; avg_rating: number | null; num_votes: number;
}
interface EpRow {
  tconst: string; season: number | null; episode: number | null;
  title: string | null; runtime_minutes: number | null; avg_rating: number | null; num_votes: number;
}

export function buildShowDetails(
  dbs: Dbs, tconst: string,
  tmdb: { poster: string | null; overview: string | null },
): ShowDetails | null {
  if (dbs.imdb === null) return null;
  const show = dbs.imdb.prepare("SELECT * FROM shows WHERE tconst = ?").get(tconst) as ShowRow | undefined;
  if (show === undefined) return null;

  const eps = dbs.imdb.prepare(
    "SELECT tconst, season, episode, title, runtime_minutes, avg_rating, num_votes " +
    "FROM episodes WHERE parent_tconst = ? ORDER BY season, episode",
  ).all(tconst) as EpRow[];

  const watchedSet = new Set(
    (dbs.user.prepare("SELECT episode_tconst t FROM watched").all() as { t: string }[]).map((r) => r.t),
  );

  const placed = eps.filter((e) => e.season !== null && e.episode !== null);
  const bySeason = new Map<number, EpisodeCell[]>();
  for (const e of placed) {
    const cell: EpisodeCell = {
      tconst: e.tconst, season: e.season as number, episode: e.episode as number,
      title: e.title, rating: e.avg_rating, votes: e.num_votes,
      watched: watchedSet.has(e.tconst),
    };
    const list = bySeason.get(cell.season) ?? [];
    list.push(cell);
    bySeason.set(cell.season, list);
  }
  const seasons: SeasonGrid[] = [...bySeason.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([season, episodes]) => ({ season, average: seasonAverage(episodes), episodes }));

  const signals = computeInsights(seasons);
  const totalWatch = placed.reduce((s, e) => s + (e.runtime_minutes ?? show.runtime_minutes ?? 0), 0);

  const saved = dbs.user.prepare("SELECT 1 FROM saved_shows WHERE tconst = ?").get(tconst) !== undefined;
  const myRating = (dbs.user.prepare("SELECT rating FROM my_ratings WHERE tconst = ?").get(tconst) as { rating: number } | undefined)?.rating ?? null;
  const watchedCount = placed.filter((e) => watchedSet.has(e.tconst)).length;

  return {
    tconst: show.tconst, title: show.title, startYear: show.start_year, endYear: show.end_year,
    genres: show.genres === null ? [] : show.genres.split(","),
    episodeCount: placed.length, unplacedCount: eps.length - placed.length,
    totalWatchMinutes: totalWatch > 0 ? totalWatch : null,
    rating: show.avg_rating, votes: show.num_votes,
    saved, myRating, watchedCount,
    poster: tmdb.poster, overview: tmdb.overview,
    seasons, insights: { ...signals, verdict: pickVerdict(signals, tconst) },
  };
}
