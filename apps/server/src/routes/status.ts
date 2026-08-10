import { Hono } from "hono";
import type { StatusResponse } from "@episodic/shared";
import type { Dbs } from "../db.js";

export function statusRoutes(dbs: Dbs, tmdbConfigured: boolean): Hono {
  const app = new Hono();
  app.get("/", (c) => {
    if (dbs.imdb === null) {
      const body: StatusResponse = {
        ingested: false, datasetDate: null, showCount: 0, episodeCount: 0, tmdbConfigured,
      };
      return c.json(body);
    }
    const meta = new Map(
      (dbs.imdb.prepare("SELECT key, value FROM meta").all() as { key: string; value: string }[])
        .map((r) => [r.key, r.value]),
    );
    const body: StatusResponse = {
      ingested: true,
      datasetDate: meta.get("dataset_date") ?? null,
      showCount: Number(meta.get("show_count") ?? 0),
      episodeCount: Number(meta.get("episode_count") ?? 0),
      tmdbConfigured,
    };
    return c.json(body);
  });
  return app;
}
