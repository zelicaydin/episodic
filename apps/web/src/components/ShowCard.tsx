import { Link } from "react-router-dom";
import type { SearchResult } from "@episodic/shared";

export function ShowCard({ show }: { show: SearchResult & { poster?: string | null } }) {
  return (
    <Link to={`/show/${show.tconst}`} className="block rounded-lg p-4 transition-colors hover:brightness-125"
      style={{ background: "var(--surface)" }}>
      {typeof show.poster === "string" && (
        <img src={show.poster} alt="" className="mb-3 aspect-[2/3] w-full rounded-md object-cover" />
      )}
      <div className="font-semibold">{show.title}</div>
      <div className="mt-1 text-xs" style={{ color: "var(--muted)" }}>
        {show.startYear ?? "?"}{show.endYear !== show.startYear ? ` to ${show.endYear ?? "now"}` : ""}
      </div>
      {show.rating !== null && (
        <div className="mt-1 text-sm" style={{ color: "var(--gold)" }}>★ {show.rating}</div>
      )}
    </Link>
  );
}
