import { describe, it, expect } from "vitest";
import { createApp } from "../src/app.js";
import { fixtureDbs } from "./fixtures.js";

describe("localOnly guard", () => {
  it("allows normal local requests (no Host/Origin in test harness)", async () => {
    const res = await createApp(fixtureDbs()).request("/api/status");
    expect(res.status).toBe(200);
  });
  it("allows an explicit localhost Host header", async () => {
    const res = await createApp(fixtureDbs()).request("/api/status", { headers: { host: "localhost:3001" } });
    expect(res.status).toBe(200);
  });
  it("rejects a non-local Host header (DNS rebinding)", async () => {
    const res = await createApp(fixtureDbs()).request("/api/status", { headers: { host: "evil.com:3001" } });
    expect(res.status).toBe(403);
  });
  it("rejects a cross-origin Origin header (CSRF)", async () => {
    const res = await createApp(fixtureDbs()).request("/api/my/shows/tt10", {
      method: "POST", headers: { origin: "https://evil.com" },
    });
    expect(res.status).toBe(403);
  });
  it("allows a localhost Origin header", async () => {
    const res = await createApp(fixtureDbs()).request("/api/my/shows/tt10", {
      method: "POST", headers: { origin: "http://localhost:5173" },
    });
    expect(res.status).toBe(200);
  });
});

describe("tconst validation", () => {
  it("rejects junk ids on personal writes", async () => {
    const res = await createApp(fixtureDbs()).request("/api/my/shows/notanid", { method: "POST" });
    expect(res.status).toBe(400);
  });
});
