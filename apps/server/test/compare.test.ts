import { describe, it, expect } from "vitest";
import type { CompareResponse } from "@episodic/shared";
import { createApp } from "../src/app.js";
import { fixtureDbs } from "./fixtures.js";

describe("GET /api/compare", () => {
  it("returns both shows", async () => {
    const res = await createApp(fixtureDbs()).request("/api/compare?a=tt10&b=tt30");
    expect(res.status).toBe(200);
    const b = await res.json() as CompareResponse;
    expect(b.a?.title).toBe("Fake Show");
    expect(b.b?.title).toBe("Tiny Gem");
    expect(b.b?.insights.verdict.length).toBeGreaterThan(0);
  });
  it("400s without either param", async () => {
    expect((await createApp(fixtureDbs()).request("/api/compare")).status).toBe(400);
  });
  it("404s when one is unknown", async () => {
    expect((await createApp(fixtureDbs()).request("/api/compare?a=tt10&b=ttX")).status).toBe(404);
  });
  it("returns a single show when only one param is given", async () => {
    const res = await createApp(fixtureDbs()).request("/api/compare?a=tt10");
    expect(res.status).toBe(200);
    const body = await res.json() as CompareResponse;
    expect(body.a?.title).toBe("Fake Show");
    expect(body.b).toBeNull();
  });
});
