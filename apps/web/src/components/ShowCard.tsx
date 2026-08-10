import { Link } from "react-router-dom";
import type { SearchResult } from "@scoretrack/shared";

export function ShowCard({ show }: { show: SearchResult }) {
  return (
    <Link to={`/show/${show.tconst}`} className="block rounded-lg p-4 transition-colors hover:brightness-125"
      style={{ background: "var(--surface)" }}>
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
