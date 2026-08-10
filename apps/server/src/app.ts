import { Hono } from "hono";
import type { Dbs } from "./db.js";
import { statusRoutes } from "./routes/status.js";
import { searchRoutes } from "./routes/search.js";
import { trendingRoutes } from "./routes/trending.js";
import { showsRoutes } from "./routes/shows.js";
import { compareRoutes } from "./routes/compare.js";
import { myRoutes } from "./routes/my.js";
import { makeTmdbResolver } from "./tmdb.js";

export interface AppOptions { tmdbKey?: string | null; fetchImpl?: typeof fetch; }

export function createApp(dbs: Dbs, opts: AppOptions = {}): Hono {
  const app = new Hono();
  const tmdbConfigured = opts.tmdbKey !== undefined && opts.tmdbKey !== null && opts.tmdbKey !== "";
  app.route("/api/status", statusRoutes(dbs, tmdbConfigured));
  app.route("/api/search", searchRoutes(dbs));
  app.route("/api/trending", trendingRoutes(dbs));
  const getTmdb = makeTmdbResolver(dbs.user, opts.tmdbKey ?? null, opts.fetchImpl ?? fetch);
  app.route("/api/shows", showsRoutes(dbs, getTmdb));
  app.route("/api/compare", compareRoutes(dbs, getTmdb));
  app.route("/api/my", myRoutes(dbs, getTmdb));
  return app;
}
