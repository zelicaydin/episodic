import { Hono } from "hono";
import type { Dbs } from "./db.js";
import { statusRoutes } from "./routes/status.js";

export interface AppOptions { tmdbKey?: string | null; fetchImpl?: typeof fetch; }

export function createApp(dbs: Dbs, opts: AppOptions = {}): Hono {
  const app = new Hono();
  const tmdbConfigured = opts.tmdbKey !== undefined && opts.tmdbKey !== null && opts.tmdbKey !== "";
  app.route("/api/status", statusRoutes(dbs, tmdbConfigured));
  // Task 7 adds: app.route("/api/search", ...); app.route("/api/trending", ...)
  // Task 10 adds: app.route("/api/shows", ...)
  // Task 11 adds: app.route("/api/compare", ...)
  // Task 12 adds: app.route("/api/my", ...)
  // Guard used by data routes when imdb.db is missing:
  return app;
}
