import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getMyShows } from "../api";

export function MyShows() {
  const q = useQuery({ queryKey: ["myShows"], queryFn: getMyShows });
  if (q.error) return <p className="mt-10 text-center" style={{ color: "var(--bad)" }}>Could not load your shows.</p>;
  if (q.data === undefined) return <p style={{ color: "var(--muted)" }}>Loading...</p>;
  if (q.data.length === 0) {
    return <p className="mt-10 text-center" style={{ color: "var(--muted)" }}>
      Nothing saved yet. Find a show and hit Save.</p>;
  }
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {q.data.map((s) => (
        <Link key={s.tconst} to={`/show/${s.tconst}`} className="flex gap-4 rounded-lg p-4 hover:brightness-125"
          style={{ background: "var(--surface)" }}>
          {s.poster !== null
            ? <img src={s.poster} alt="" className="w-16 rounded" />
            : <div className="h-24 w-16 shrink-0 rounded" style={{ background: "#27272a" }} />}
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="font-semibold">{s.title}</span>
              {s.newEpisodes > 0 && (
                <span className="rounded px-1.5 py-0.5 text-xs font-semibold"
                  style={{ background: "color-mix(in srgb, var(--gold) 18%, transparent)", color: "var(--gold)" }}>
                  {s.newEpisodes} new
                </span>
              )}
            </div>
            <span className="text-xs" style={{ color: "var(--muted)" }}>watched {s.watchedCount}/{s.episodeCount}</span>
            <span className="text-xs" style={{ color: "var(--good)" }}>{s.verdict}</span>
          </div>
        </Link>
      ))}
    </div>
  );
}
