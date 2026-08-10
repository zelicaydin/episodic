import { Hono } from "hono";
import type { Dbs } from "./db.js";
import { statusRoutes } from "./routes/status.js";
import { searchRoutes } from "./routes/search.js";
import { trendingRoutes } from "./routes/trending.js";
import { showsRoutes } from "./routes/shows.js";
import { compareRoutes } from "./routes/compare.js";

export interface AppOptions { tmdbKey?: string | null; fetchImpl?: typeof fetch; }

export function createApp(dbs: Dbs, opts: AppOptions = {}): Hono {
  const app = new Hono();
  const tmdbConfigured = opts.tmdbKey !== undefined && opts.tmdbKey !== null && opts.tmdbKey !== "";
  app.route("/api/status", statusRoutes(dbs, tmdbConfigured));
  app.route("/api/search", searchRoutes(dbs));
  app.route("/api/trending", trendingRoutes(dbs));
  const noTmdb = async () => ({ poster: null, overview: null });
  app.route("/api/shows", showsRoutes(dbs, noTmdb));
  app.route("/api/compare", compareRoutes(dbs, noTmdb));
  // Task 12 adds: app.route("/api/my", ...)
  // Guard used by data routes when imdb.db is missing:
  return app;
}
