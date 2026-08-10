import type { MiddlewareHandler } from "hono";

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);

// Extract the hostname from a Host header (strip :port) or an Origin URL.
function hostnameOf(hostHeader: string): string | null {
  if (hostHeader === "") return null;
  // strip a trailing :port, and surrounding brackets for ipv6
  const noBrackets = hostHeader.replace(/^\[/, "").replace(/\](:\d+)?$/, "").replace(/:\d+$/, "");
  return noBrackets;
}

/**
 * Local-only guard for a service with no auth:
 * - Reject requests whose Host header names a non-local host (defeats DNS rebinding,
 *   where a browser is tricked into treating an attacker domain as localhost).
 * - Reject requests carrying a cross-origin Origin header (defeats drive-by CSRF writes
 *   from a website the user happens to be visiting). Requests with no Origin (curl,
 *   same-origin navigations, tests) are allowed.
 * Requests with no Host header at all are allowed (test harness / non-browser clients);
 * the loopback bind already limits reachability.
 */
export function localOnly(): MiddlewareHandler {
  return async (c, next) => {
    const host = c.req.header("host");
    if (host !== undefined) {
      const h = hostnameOf(host);
      if (h === null || !LOCAL_HOSTS.has(h)) return c.text("Forbidden", 403);
    }
    const origin = c.req.header("origin");
    if (origin !== undefined && origin !== "null") {
      let originHost: string | null = null;
      try { originHost = new URL(origin).hostname; } catch { originHost = "invalid"; }
      if (originHost === null || !LOCAL_HOSTS.has(originHost)) return c.text("Forbidden", 403);
    }
    return next();
  };
}
