import { Hono } from "hono";
import type { Dbs } from "./db.js";
import { statusRoutes } from "./routes/status.js";
import { searchRoutes } from "./routes/search.js";
import { trendingRoutes } from "./routes/trending.js";
import { showsRoutes } from "./routes/shows.js";
import { similarRoutes } from "./routes/similar.js";
import { compareRoutes } from "./routes/compare.js";
import { myRoutes } from "./routes/my.js";
import { makePosterResolver } from "./posters.js";
import { localOnly } from "./security.js";

export interface AppOptions { fetchImpl?: typeof fetch; }

export function createApp(dbs: Dbs, opts: AppOptions = {}): Hono {
  const app = new Hono();
  app.use("*", localOnly());
  app.route("/api/status", statusRoutes(dbs));
  app.route("/api/search", searchRoutes(dbs));
  const fetchImpl = opts.fetchImpl ?? fetch;
  const getPosters = makePosterResolver(dbs.user, fetchImpl);
  app.route("/api/trending", trendingRoutes(dbs, getPosters, fetchImpl));
  app.route("/api/shows", similarRoutes(dbs, getPosters));
  app.route("/api/shows", showsRoutes(dbs, getPosters));
  app.route("/api/compare", compareRoutes(dbs, getPosters));
  app.route("/api/my", myRoutes(dbs, getPosters));
  return app;
}
