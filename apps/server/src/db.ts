import Database from "better-sqlite3";
import { existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";

export interface Dbs { imdb: Database.Database | null; user: Database.Database; }

export function createUserTables(user: Database.Database): void {
  user.exec(`
    CREATE TABLE IF NOT EXISTS saved_shows(tconst TEXT PRIMARY KEY, saved_at TEXT NOT NULL,
      last_opened_at TEXT, episode_count_at_last_open INT);
    CREATE TABLE IF NOT EXISTS watched(episode_tconst TEXT PRIMARY KEY, watched_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS my_ratings(tconst TEXT PRIMARY KEY,
      rating INT NOT NULL CHECK (rating BETWEEN 1 AND 10), rated_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS recently_viewed(tconst TEXT PRIMARY KEY, viewed_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS tmdb_cache(cache_key TEXT PRIMARY KEY, json TEXT NOT NULL, fetched_at TEXT NOT NULL);
  `);
}

export function openDbs(dataDir: string): Dbs {
  mkdirSync(dataDir, { recursive: true });
  const imdbPath = join(dataDir, "imdb.db");
  const imdb = existsSync(imdbPath) ? new Database(imdbPath, { readonly: true, fileMustExist: true }) : null;
  const user = new Database(join(dataDir, "user.db"));
  user.pragma("journal_mode = WAL");
  createUserTables(user);
  return { imdb, user };
}
