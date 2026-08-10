import { describe, it, expect } from "vitest";
import { gzipSync } from "node:zlib";
import { writeFileSync, mkdtempSync, existsSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import Database from "better-sqlite3";
import { buildDatabase } from "../src/build-db.js";

function gz(dir: string, name: string, content: string): string {
  const p = join(dir, name);
  writeFileSync(p, gzipSync(content));
  return p;
}

function fixtures(dir: string) {
  // tt10 series with 2 placed episodes (tt11 rated, tt12 unrated), 1 unplaced (tt13)
  // tt20 movie: must be excluded. tt99 episode of unknown parent: dropped.
  const basics = gz(dir, "b.tsv.gz",
    "tconst\ttitleType\tprimaryTitle\toriginalTitle\tisAdult\tstartYear\tendYear\truntimeMinutes\tgenres\n" +
    "tt10\ttvSeries\tFake Show\tFake Show\t0\t2010\t2015\t45\tDrama,Crime\n" +
    "tt11\ttvEpisode\tPilot\tPilot\t0\t2010\t\\N\t47\tDrama\n" +
    "tt12\ttvEpisode\tSecond\tSecond\t0\t2010\t\\N\t\\N\tDrama\n" +
    "tt13\ttvEpisode\tSpecial\tSpecial\t0\t2011\t\\N\t\\N\tDrama\n" +
    "tt20\tmovie\tSome Film\tSome Film\t0\t2019\t\\N\t120\tAction\n");
  const episodes = gz(dir, "e.tsv.gz",
    "tconst\tparentTconst\tseasonNumber\tepisodeNumber\n" +
    "tt11\ttt10\t1\t1\n" +
    "tt12\ttt10\t1\t2\n" +
    "tt13\ttt10\t\\N\t\\N\n" +
    "tt99\tttNOPE\t1\t1\n");
  const ratings = gz(dir, "r.tsv.gz",
    "tconst\taverageRating\tnumVotes\n" +
    "tt10\t8.9\t120000\n" +
    "tt11\t9.1\t5000\n" +
    "tt20\t7.0\t900\n");
  return { basics, episodes, ratings };
}

describe("buildDatabase", () => {
  it("builds shows, episodes, fts, meta and renames atomically", async () => {
    const dir = mkdtempSync(join(tmpdir(), "st-"));
    const out = join(dir, "imdb.db");
    const counts = await buildDatabase(fixtures(dir), out, "2026-08-10");
    expect(existsSync(out)).toBe(true);
    expect(existsSync(out + ".tmp")).toBe(false);
    expect(counts.shows).toBe(1);
    expect(counts.episodes).toBe(3);

    const db = new Database(out, { readonly: true });
    const show = db.prepare("SELECT * FROM shows WHERE tconst='tt10'").get() as Record<string, unknown>;
    expect(show.title).toBe("Fake Show");
    expect(show.avg_rating).toBe(8.9);
    expect(show.runtime_minutes).toBe(45);
    expect(db.prepare("SELECT COUNT(*) c FROM shows").get()).toEqual({ c: 1 });

    const ep = db.prepare("SELECT * FROM episodes WHERE tconst='tt11'").get() as Record<string, unknown>;
    expect(ep.season).toBe(1);
    expect(ep.title).toBe("Pilot");
    expect(ep.avg_rating).toBe(9.1);
    const ep2 = db.prepare("SELECT avg_rating FROM episodes WHERE tconst='tt12'").get() as Record<string, unknown>;
    expect(ep2.avg_rating).toBeNull();
    // unplaced kept with null season, orphan tt99 dropped
    expect(db.prepare("SELECT COUNT(*) c FROM episodes").get()).toEqual({ c: 3 });
    expect(db.prepare("SELECT COUNT(*) c FROM episodes WHERE season IS NULL").get()).toEqual({ c: 1 });

    const fts = db.prepare(
      "SELECT s.tconst FROM shows_fts f JOIN shows s ON s.tconst=f.tconst WHERE shows_fts MATCH '\"fake\"*'"
    ).all();
    expect(fts).toEqual([{ tconst: "tt10" }]);
    expect(db.prepare("SELECT value FROM meta WHERE key='dataset_date'").get()).toEqual({ value: "2026-08-10" });
    expect(db.prepare("SELECT value FROM meta WHERE key='show_count'").get()).toEqual({ value: "1" });
    expect(db.prepare("SELECT value FROM meta WHERE key='episode_count'").get()).toEqual({ value: "3" });
  });

  it("skips malformed rows and counts them", async () => {
    const dir = mkdtempSync(join(tmpdir(), "st-"));
    const f = fixtures(dir);
    // ratings file with a truncated row (missing columns)
    f.ratings = gz(dir, "r2.tsv.gz",
      "tconst\taverageRating\tnumVotes\n" + "ttbad\n" + "tt10\t8.9\t120000\n");
    const counts = await buildDatabase(f, join(dir, "imdb.db"), "2026-08-10");
    expect(counts.skippedRows).toBeGreaterThanOrEqual(1);
    expect(counts.shows).toBe(1);
  });

  it("rebuild over an existing database succeeds (idempotent)", async () => {
    const dir = mkdtempSync(join(tmpdir(), "st-"));
    const out = join(dir, "imdb.db");
    const f = fixtures(dir);
    const first = await buildDatabase(f, out, "2026-08-09");
    const second = await buildDatabase(f, out, "2026-08-10");
    expect(second).toEqual(first);
    const db = new Database(out, { readonly: true });
    expect(db.prepare("SELECT value FROM meta WHERE key='dataset_date'").get()).toEqual({ value: "2026-08-10" });
  });
});
