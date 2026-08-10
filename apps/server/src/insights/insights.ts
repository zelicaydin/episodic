import type { SeasonGrid, EpisodeCell, EpisodeRef, Insights } from "@episodic/shared";

export function seasonAverage(episodes: EpisodeCell[]): number | null {
  const rated = episodes.filter((e) => e.rating !== null);
  if (rated.length < 2) return null;
  return rated.reduce((s, e) => s + (e.rating as number), 0) / rated.length;
}

function mean(xs: number[]): number { return xs.reduce((a, b) => a + b, 0) / xs.length; }

function stddev(xs: number[]): number {
  const m = mean(xs);
  return Math.sqrt(mean(xs.map((x) => (x - m) ** 2)));
}

function toRef(e: EpisodeCell): EpisodeRef {
  return { tconst: e.tconst, season: e.season, episode: e.episode, title: e.title, rating: e.rating as number };
}

function longestRun(avgs: (number | null)[], threshold: number): { from: number; to: number } | null {
  let best: { from: number; to: number } | null = null;
  let start = -1;
  for (let i = 0; i <= avgs.length; i++) {
    const ok = i < avgs.length && avgs[i] !== null && (avgs[i] as number) >= threshold;
    if (ok && start === -1) start = i;
    if (!ok && start !== -1) {
      if (best === null || i - start > best.to - best.from + 1) best = { from: start + 1, to: i };
      start = -1;
    }
  }
  return best;
}

export function computeInsights(seasons: SeasonGrid[]): Omit<Insights, "verdict"> {
  const avgs = seasons.map((s) => seasonAverage(s.episodes));
  const seasonAverages = seasons.map((s, i) => ({ season: s.season, average: avgs[i] ?? null }));
  const allRated = seasons.flatMap((s) => s.episodes).filter((e) => e.rating !== null);

  let weightedAverage: number | null = null;
  const totalVotes = allRated.reduce((s, e) => s + e.votes, 0);
  if (allRated.length > 0 && totalVotes > 0) {
    weightedAverage = allRated.reduce((s, e) => s + (e.rating as number) * e.votes, 0) / totalVotes;
  }

  let peak: EpisodeRef | null = null;
  let worst: EpisodeRef | null = null;
  for (const e of allRated) {
    if (peak === null || (e.rating as number) > peak.rating) peak = toRef(e);
    if (worst === null || (e.rating as number) < worst.rating) worst = toRef(e);
  }

  let mostConsistentSeason: number | null = null;
  let bestSpread = Infinity;
  for (const s of seasons) {
    const rs = s.episodes.filter((e) => e.rating !== null).map((e) => e.rating as number);
    if (rs.length < 2) continue;
    const sd = stddev(rs);
    if (sd < bestSpread) { bestSpread = sd; mostConsistentSeason = s.season; }
  }

  const defined = avgs.filter((a): a is number => a !== null);
  let goldenEra = longestRun(avgs, 8.5);
  if (goldenEra === null && defined.length > 0) {
    goldenEra = longestRun(avgs, mean(defined) + 0.3);
  }
  // longestRun returns 1-based positions; map to real season numbers
  if (goldenEra !== null) {
    goldenEra = {
      from: seasons[goldenEra.from - 1]?.season ?? goldenEra.from,
      to: seasons[goldenEra.to - 1]?.season ?? goldenEra.to,
    };
  }

  let fallOffSeason: number | null = null;
  for (let i = 1; i < avgs.length; i++) {
    const prior = avgs.slice(0, i).filter((a): a is number => a !== null);
    const cur = avgs[i];
    if (prior.length < 1 || cur === null || cur === undefined) continue;
    const pm = mean(prior);
    if (cur > pm - 0.8) continue;
    const later = avgs.slice(i + 1).filter((a): a is number => a !== null);
    if (later.every((a) => a < pm - 0.4)) {
      fallOffSeason = seasons[i]?.season ?? null;
      break;
    }
  }

  let trajectory: "rising" | "falling" | "flat" | null = null;
  if (defined.length >= 2) {
    const change = (defined.at(-1) as number) - (defined[0] as number);
    trajectory = change >= 0.3 ? "rising" : change <= -0.3 ? "falling" : "flat";
  }

  return {
    seasonAverages, weightedAverage, peak, worst,
    mostConsistentSeason, goldenEra, fallOffSeason, trajectory,
  };
}
