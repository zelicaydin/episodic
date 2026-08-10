import { describe, it, expect } from "vitest";
import type { MyShowEntry } from "@episodic/shared";
import { createApp } from "../src/app.js";
import { fixtureDbs } from "./fixtures.js";

describe("/api/my", () => {
  it("save, list, unsave round-trip", async () => {
    const dbs = fixtureDbs();
    const app = createApp(dbs);
    expect((await app.request("/api/my/shows/tt10", { method: "POST" })).status).toBe(200);
    let list = await (await app.request("/api/my/shows")).json() as MyShowEntry[];
    expect(list.length).toBe(1);
    expect(list[0]).toMatchObject({ tconst: "tt10", title: "Fake Show", episodeCount: 4, newEpisodes: 0 });
    expect((await app.request("/api/my/shows/tt10", { method: "DELETE" })).status).toBe(200);
    list = await (await app.request("/api/my/shows")).json() as MyShowEntry[];
    expect(list).toEqual([]);
  });
  it("counts new episodes since last open", async () => {
    const dbs = fixtureDbs();
    const app = createApp(dbs);
    await app.request("/api/my/shows/tt10", { method: "POST" });
    dbs.user.prepare("UPDATE saved_shows SET episode_count_at_last_open = 2 WHERE tconst='tt10'").run();
    const list = await (await app.request("/api/my/shows")).json() as MyShowEntry[];
    expect(list[0]?.newEpisodes).toBe(2);
  });
  it("watched toggling", async () => {
    const dbs = fixtureDbs();
    const app = createApp(dbs);
    await app.request("/api/my/watched/tt11", { method: "PUT" });
    expect(dbs.user.prepare("SELECT COUNT(*) c FROM watched").get()).toEqual({ c: 1 });
    await app.request("/api/my/watched/tt11", { method: "DELETE" });
    expect(dbs.user.prepare("SELECT COUNT(*) c FROM watched").get()).toEqual({ c: 0 });
  });
  it("rating validation", async () => {
    const app = createApp(fixtureDbs());
    const put = (body: unknown) => app.request("/api/my/ratings/tt10", {
      method: "PUT", body: JSON.stringify(body), headers: { "content-type": "application/json" },
    });
    expect((await put({ rating: 9 })).status).toBe(200);
    expect((await put({ rating: 11 })).status).toBe(400);
    expect((await put({ rating: 2.5 })).status).toBe(400);
    expect((await put({})).status).toBe(400);
  });
  it("recently viewed shows up after visiting a show", async () => {
    const dbs = fixtureDbs();
    const app = createApp(dbs);
    await app.request("/api/shows/tt30");
    const list = await (await app.request("/api/my/recently-viewed")).json() as { tconst: string }[];
    expect(list.map((r) => r.tconst)).toEqual(["tt30"]);
  });
});
