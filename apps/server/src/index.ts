import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import { readFileSync, existsSync } from "node:fs";
import { join, resolve } from "node:path";
import { openDbs } from "./db.js";
import { createApp } from "./app.js";

const root = resolve(import.meta.dirname, "../../..");

function loadEnv(): Record<string, string> {
  const p = join(root, ".env");
  if (!existsSync(p)) return {};
  const out: Record<string, string> = {};
  for (const line of readFileSync(p, "utf8").split("\n")) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m) out[m[1] as string] = (m[2] as string).trim();
  }
  return out;
}

const env = loadEnv();
const dbs = openDbs(join(root, "data"));
const app = createApp(dbs, { tmdbKey: env.TMDB_API_KEY ?? process.env.TMDB_API_KEY ?? null });

if (process.env.NODE_ENV === "production") {
  // npm -w runs this with cwd apps/server, and serveStatic resolves relative to cwd
  app.use("/*", serveStatic({ root: "../web/dist" }));
  app.get("*", serveStatic({ path: "../web/dist/index.html" }));
}

serve({ fetch: app.fetch, port: 3001 });
console.log("ScoreTrack server on http://localhost:3001");
