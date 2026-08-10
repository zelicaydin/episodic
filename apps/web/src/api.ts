import type {
  StatusResponse, SearchResult, ShowDetails, CompareResponse, MyShowEntry, OkResponse, TrendingEntry,
} from "@episodic/shared";

export class ApiError extends Error {
  constructor(public status: number, public code: string) { super(code); }
}

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, init);
  if (!res.ok) {
    const body = await res.json().catch(() => ({})) as { error?: string };
    throw new ApiError(res.status, body.error ?? "unknown");
  }
  return res.json() as Promise<T>;
}

const jsonInit = (method: string, body?: unknown): RequestInit => ({
  method, ...(body === undefined ? {} : {
    body: JSON.stringify(body), headers: { "content-type": "application/json" },
  }),
});

export const getStatus = () => req<StatusResponse>("/api/status");
export const search = (q: string) => req<SearchResult[]>(`/api/search?q=${encodeURIComponent(q)}`);
export const getTrending = () => req<TrendingEntry[]>("/api/trending");
export const getShow = (tconst: string) => req<ShowDetails>(`/api/shows/${tconst}`);
export const getCompare = (a: string, b: string) =>
  req<CompareResponse>(`/api/compare?a=${encodeURIComponent(a)}&b=${encodeURIComponent(b)}`);
export const getMyShows = () => req<MyShowEntry[]>("/api/my/shows");
export const getRecentlyViewed = () => req<SearchResult[]>("/api/my/recently-viewed");
export const saveShow = (t: string) => req<OkResponse>(`/api/my/shows/${t}`, jsonInit("POST"));
export const unsaveShow = (t: string) => req<OkResponse>(`/api/my/shows/${t}`, jsonInit("DELETE"));
export const setWatched = (ep: string, watched: boolean) =>
  req<OkResponse>(`/api/my/watched/${ep}`, jsonInit(watched ? "PUT" : "DELETE"));
export const setMyRating = (t: string, rating: number) =>
  req<OkResponse>(`/api/my/ratings/${t}`, jsonInit("PUT", { rating }));
