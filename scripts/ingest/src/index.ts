import { existsSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { downloadFile } from "./download.js";
import { buildDatabase } from "./build-db.js";

const BASE = "https://datasets.imdbws.com";
const FILES = {
  basics: "title.basics.tsv.gz",
  episodes: "title.episode.tsv.gz",
  ratings: "title.ratings.tsv.gz",
} as const;

const dataDir = resolve(import.meta.dirname, "../../../data");
const dlDir = join(dataDir, "downloads");
const cached = process.argv.includes("--cached");

let step = "startup";
try {
  let datasetDate = new Date().toISOString().slice(0, 10);
  const paths = {} as Record<keyof typeof FILES, string>;

  for (const [key, name] of Object.entries(FILES) as [keyof typeof FILES, string][]) {
    const dest = join(dlDir, name);
    paths[key] = dest;
    if (cached && existsSync(dest)) {
      console.log(`using cached ${name}`);
      if (key === "ratings") {
        datasetDate = statSync(dest).mtime.toISOString().slice(0, 10);
      }
      continue;
    }
    step = `download ${name}`;
    console.log(`downloading ${name} ...`);
    const { lastModified } = await downloadFile(`${BASE}/${name}`, dest);
    if (key === "ratings" && lastModified) {
      datasetDate = new Date(lastModified).toISOString().slice(0, 10);
    }
  }

  step = "build database";
  console.log("building data/imdb.db ...");
  const t0 = Date.now();
  const counts = await buildDatabase(paths, join(dataDir, "imdb.db"), datasetDate);
  const secs = Math.round((Date.now() - t0) / 1000);
  console.log(`done in ${secs}s: ${counts.shows} shows, ${counts.episodes} episodes, ${counts.skippedRows} rows skipped`);
} catch (err) {
  console.error(`ingest failed at step: ${step}`);
  console.error(err instanceof Error ? err.message : err);
  console.error("your previous data/imdb.db (if any) is untouched");
  process.exit(1);
}
