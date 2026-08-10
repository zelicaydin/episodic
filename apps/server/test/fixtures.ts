import Database from "better-sqlite3";
import { createUserTables, type Dbs } from "../src/db.js";

const IMDB_SCHEMA = `
CREATE TABLE shows(tconst TEXT PRIMARY KEY, title TEXT NOT NULL, start_year INT, end_year INT,
  genres TEXT, runtime_minutes INT, avg_rating REAL, num_votes INT NOT NULL DEFAULT 0);
CREATE TABLE episodes(tconst TEXT PRIMARY KEY, parent_tconst TEXT NOT NULL, season INT, episode INT,
  title TEXT, runtime_minutes INT, avg_rating REAL, num_votes INT NOT NULL DEFAULT 0);
CREATE VIRTUAL TABLE shows_fts USING fts5(title, tconst UNINDEXED);
CREATE TABLE meta(key TEXT PRIMARY KEY, value TEXT NOT NULL);
`;

export function fixtureDbs(): Dbs {
  const imdb = new Database(":memory:");
  imdb.exec(IMDB_SCHEMA);
  const show = imdb.prepare("INSERT INTO shows VALUES (?,?,?,?,?,?,?,?)");
  show.run("tt10", "Fake Show", 2010, 2015, "Drama,Crime", 45, 8.9, 120000);
  show.run("tt30", "Tiny Gem", 2020, 2020, "Comedy", 30, 8.6, 900);
  show.run("tt40", "Unrated Thing", 2023, null, null, null, null, 0);
  const ep = imdb.prepare("INSERT INTO episodes VALUES (?,?,?,?,?,?,?,?)");
  ep.run("tt11", "tt10", 1, 1, "Pilot", 47, 9.1, 5000);
  ep.run("tt12", "tt10", 1, 2, "Second", null, 8.3, 4000);
  ep.run("tt14", "tt10", 2, 1, "Comeback", null, 6.4, 3000);
  ep.run("tt15", "tt10", 2, 2, "Closer", null, 9.7, 8000);
  ep.run("tt13", "tt10", null, null, "Special", null, null, 0);
  ep.run("tt31", "tt30", 1, 1, "One", null, 8.5, 400);
  ep.run("tt32", "tt30", 1, 2, "Two", null, 8.8, 450);
  ep.run("tt41", "tt40", 1, 1, null, null, null, 0);
  imdb.exec("INSERT INTO shows_fts(title, tconst) SELECT title, tconst FROM shows");
  imdb.prepare("INSERT INTO meta VALUES ('dataset_date','2026-08-10')").run();
  imdb.prepare("INSERT INTO meta VALUES ('show_count','3')").run();
  imdb.prepare("INSERT INTO meta VALUES ('episode_count','8')").run();

  const user = new Database(":memory:");
  createUserTables(user);
  return { imdb, user };
}
