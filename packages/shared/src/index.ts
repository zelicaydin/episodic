export interface SearchResult {
  tconst: string; title: string;
  startYear: number | null; endYear: number | null;
  rating: number | null; votes: number;
}

export interface EpisodeCell {
  tconst: string; season: number; episode: number;
  title: string | null; rating: number | null; votes: number;
  watched: boolean;
}

export interface SeasonGrid { season: number; average: number | null; episodes: EpisodeCell[]; }

export interface EpisodeRef {
  tconst: string; season: number; episode: number;
  title: string | null; rating: number;
}

export interface Insights {
  seasonAverages: { season: number; average: number | null }[];
  weightedAverage: number | null;
  peak: EpisodeRef | null;
  worst: EpisodeRef | null;
  mostConsistentSeason: number | null;
  goldenEra: { from: number; to: number } | null;
  fallOffSeason: number | null;
  trajectory: "rising" | "falling" | "flat" | null;
  verdict: string;
}

export interface ShowDetails {
  tconst: string; title: string;
  startYear: number | null; endYear: number | null;
  genres: string[]; episodeCount: number; unplacedCount: number;
  totalWatchMinutes: number | null;
  rating: number | null; votes: number;
  saved: boolean; myRating: number | null; watchedCount: number;
  poster: string | null; overview: string | null;
  seasons: SeasonGrid[]; insights: Insights;
}

export interface CompareResponse { a: ShowDetails; b: ShowDetails; }

export interface StatusResponse {
  ingested: boolean; datasetDate: string | null;
  showCount: number; episodeCount: number;
}

export interface MyShowEntry {
  tconst: string; title: string; poster: string | null;
  verdict: string; watchedCount: number; episodeCount: number;
  newEpisodes: number;
}

export interface OkResponse { ok: true; }
