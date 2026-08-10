import { Hono } from "hono";
import type { Dbs } from "./db.js";
import { statusRoutes } from "./routes/status.js";
import { searchRoutes } from "./routes/search.js";
import { trendingRoutes } from "./routes/trending.js";
import { showsRoutes } from "./routes/shows.js";
import { compareRoutes } from "./routes/compare.js";
import { myRoutes } from "./routes/my.js";
import { makePosterResolver } from "./posters.js";

export interface AppOptions { fetchImpl?: typeof fetch; }

export function createApp(dbs: Dbs, opts: AppOptions = {}): Hono {
  const app = new Hono();
  app.route("/api/status", statusRoutes(dbs));
  app.route("/api/search", searchRoutes(dbs));
  const getPosters = makePosterResolver(dbs.user, opts.fetchImpl ?? fetch);
  app.route("/api/trending", trendingRoutes(dbs, getPosters));
  app.route("/api/shows", showsRoutes(dbs, getPosters));
  app.route("/api/compare", compareRoutes(dbs, getPosters));
  app.route("/api/my", myRoutes(dbs, getPosters));
  return app;
}
