import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import { join, resolve } from "node:path";
import { openDbs } from "./db.js";
import { createApp } from "./app.js";

const root = resolve(import.meta.dirname, "../../..");

const dbs = openDbs(join(root, "data"));
const app = createApp(dbs);

if (process.env.NODE_ENV === "production") {
  // npm -w runs this with cwd apps/server, and serveStatic resolves relative to cwd
  app.use("/*", serveStatic({ root: "../web/dist" }));
  app.get("*", serveStatic({ path: "../web/dist/index.html" }));
}

serve({ fetch: app.fetch, port: 3001 });
console.log("Episodic server on http://localhost:3001");
