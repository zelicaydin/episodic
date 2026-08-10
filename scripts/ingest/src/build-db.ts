import Database from "better-sqlite3";
import { renameSync, rmSync } from "node:fs";
import { tsvRows, toInt, toFloat } from "./parse.js";

export interface IngestCounts { shows: number; episodes: number; skippedRows: number; }

const TV_TYPES = new Set(["tvSeries", "tvMiniSeries", "tvEpisode"]);
const BATCH = 10_000;

export async function buildDatabase(
  files: { basics: string; episodes: string; ratings: string },
  outPath: string,
  datasetDate: string,
): Promise<IngestCounts> {
  const tmpPath = outPath + ".tmp";
  rmSync(tmpPath, { force: true });
  const db = new Database(tmpPath);
  try {
    db.pragma("journal_mode = OFF");
    db.pragma("synchronous = OFF");
    let skippedRows = 0;

    db.exec(`
      CREATE TABLE stg_ratings(tconst TEXT PRIMARY KEY, rating REAL, votes INT);
      CREATE TABLE stg_episode_map(tconst TEXT PRIMARY KEY, parent TEXT, season INT, episode INT);
      CREATE TABLE stg_basics(tconst TEXT PRIMARY KEY, title_type TEXT, title TEXT,
        start_year INT, end_year INT, runtime INT, genres TEXT);
    `);

    const insRating = db.prepare("INSERT OR REPLACE INTO stg_ratings VALUES (?,?,?)");
    await batchInsert(db, files.ratings, (r) => {
      if (r.length < 3 || r[0] === null) { skippedRows++; return; }
      insRating.run(r[0], toFloat(r[1] ?? null), toInt(r[2] ?? null) ?? 0);
    });

    const insMap = db.prepare("INSERT OR REPLACE INTO stg_episode_map VALUES (?,?,?,?)");
    await batchInsert(db, files.episodes, (r) => {
      if (r.length < 4 || r[0] === null || r[1] === null) { skippedRows++; return; }
      insMap.run(r[0], r[1], toInt(r[2] ?? null), toInt(r[3] ?? null));
    });

    const insBasics = db.prepare("INSERT OR REPLACE INTO stg_basics VALUES (?,?,?,?,?,?,?)");
    await batchInsert(db, files.basics, (r) => {
      const [tconst, titleType, primaryTitle] = r;
      if (!tconst || !titleType || !TV_TYPES.has(titleType)) return;
      if (!primaryTitle) { skippedRows++; return; }
      insBasics.run(tconst, titleType, primaryTitle,
        toInt(r[5] ?? null), toInt(r[6] ?? null), toInt(r[7] ?? null), r[8] ?? null);
    });

    db.exec(`
      CREATE TABLE shows(tconst TEXT PRIMARY KEY, title TEXT NOT NULL, start_year INT, end_year INT,
        genres TEXT, runtime_minutes INT, avg_rating REAL, num_votes INT NOT NULL DEFAULT 0);
      INSERT INTO shows
        SELECT b.tconst, b.title, b.start_year, b.end_year, b.genres, b.runtime,
               r.rating, COALESCE(r.votes, 0)
        FROM stg_basics b LEFT JOIN stg_ratings r USING (tconst)
        WHERE b.title_type IN ('tvSeries','tvMiniSeries');

      CREATE TABLE episodes(tconst TEXT PRIMARY KEY, parent_tconst TEXT NOT NULL, season INT, episode INT,
        title TEXT, runtime_minutes INT, avg_rating REAL, num_votes INT NOT NULL DEFAULT 0);
      INSERT INTO episodes
        SELECT m.tconst, m.parent, m.season, m.episode, b.title, b.runtime,
               r.rating, COALESCE(r.votes, 0)
        FROM stg_episode_map m
        JOIN shows s ON s.tconst = m.parent
        LEFT JOIN stg_basics b ON b.tconst = m.tconst
        LEFT JOIN stg_ratings r ON r.tconst = m.tconst;

      CREATE VIRTUAL TABLE shows_fts USING fts5(title, tconst UNINDEXED);
      INSERT INTO shows_fts(title, tconst) SELECT title, tconst FROM shows;

      CREATE INDEX idx_episodes_parent ON episodes(parent_tconst);
      CREATE INDEX idx_shows_votes ON shows(num_votes DESC);

      CREATE TABLE meta(key TEXT PRIMARY KEY, value TEXT NOT NULL);
      DROP TABLE stg_ratings; DROP TABLE stg_episode_map; DROP TABLE stg_basics;
    `);
    db.prepare("INSERT INTO meta VALUES ('dataset_date', ?)").run(datasetDate);
    db.prepare("INSERT INTO meta VALUES ('built_at', datetime('now'))").run();

    const counts: IngestCounts = {
      shows: (db.prepare("SELECT COUNT(*) c FROM shows").get() as { c: number }).c,
      episodes: (db.prepare("SELECT COUNT(*) c FROM episodes").get() as { c: number }).c,
      skippedRows,
    };
    db.prepare("INSERT INTO meta VALUES ('show_count', ?)").run(String(counts.shows));
    db.prepare("INSERT INTO meta VALUES ('episode_count', ?)").run(String(counts.episodes));
    db.exec("VACUUM");
    db.close();
    renameSync(tmpPath, outPath);
    return counts;
  } catch (err) {
    if (db.open) db.close();
    rmSync(tmpPath, { force: true });
    throw err;
  }
}

async function batchInsert(
  db: Database.Database, file: string, insert: (row: (string | null)[]) => void,
): Promise<void> {
  let batch: (string | null)[][] = [];
  const flush = db.transaction((rows: (string | null)[][]) => { for (const r of rows) insert(r); });
  for await (const row of tsvRows(file)) {
    batch.push(row);
    if (batch.length >= BATCH) { flush(batch); batch = []; }
  }
  if (batch.length > 0) flush(batch);
}
