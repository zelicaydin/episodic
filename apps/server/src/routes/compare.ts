import { Hono } from "hono";
import type { CompareResponse } from "@episodic/shared";
import type { Dbs } from "../db.js";
import { buildShowDetails } from "../show-details.js";

export function compareRoutes(dbs: Dbs, getTmdb: (tconst: string) => Promise<{ poster: string | null; overview: string | null }>): Hono {
  const app = new Hono();
  app.get("/", async (c) => {
    if (dbs.imdb === null) return c.json({ error: "not_ingested" }, 503);
    const a = c.req.query("a");
    const b = c.req.query("b");
    if (!a && !b) return c.json({ error: "bad_request" }, 400);
    const da = a ? buildShowDetails(dbs, a, await getTmdb(a)) : null;
    const db = b ? buildShowDetails(dbs, b, await getTmdb(b)) : null;
    if ((a && da === null) || (b && db === null)) return c.json({ error: "not_found" }, 404);
    const body: CompareResponse = { a: da, b: db };
    return c.json(body);
  });
  return app;
}
