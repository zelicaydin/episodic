import type { ShowDetails } from "@episodic/shared";
import { formatWatchTime } from "../lib/format";
import { VerdictBox } from "./VerdictBox";

function fmtVotes(v: number): string {
  // 999_500 threshold: anything that would round to 1000k renders as M instead
  if (v >= 999_500) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `${Math.round(v / 1_000)}k`;
  return String(v);
}

interface Props { show: ShowDetails; onSaveToggle: () => void; onRate: (r: number) => void; }

export function ShowHeader({ show, onSaveToggle, onRate }: Props) {
  const meta = [
    show.startYear === null ? null :
      `${show.startYear}${show.endYear !== show.startYear ? ` to ${show.endYear ?? "now"}` : ""}`,
    show.genres.length > 0 ? show.genres.join(", ") : null,
    `${show.episodeCount} episodes`,
    formatWatchTime(show.totalWatchMinutes),
  ].filter((x): x is string => x !== null);

  return (
    <div className="mb-7 flex items-start gap-5">
      {show.poster !== null
        ? <img src={show.poster} alt="" className="w-40 rounded-lg" />
        : <div className="h-60 w-40 shrink-0 rounded-lg" style={{ background: "var(--surface)" }} />}
      <div className="flex flex-col gap-2.5">
        <h1 className="text-3xl font-bold">{show.title}</h1>
        <div className="text-sm" style={{ color: "var(--muted)" }}>{meta.join("  ·  ")}</div>
        {show.rating !== null && (
          <div style={{ color: "var(--gold)" }}>★ {show.rating}{" "}
            <span className="text-xs" style={{ color: "var(--muted)" }}>{fmtVotes(show.votes)} votes</span>
          </div>
        )}
        <VerdictBox verdict={show.insights.verdict} tone={show.insights.fallOffSeason === null ? "good" : "bad"} />
        <div className="flex items-center gap-3">
          <button type="button" onClick={onSaveToggle}
            className="rounded-lg border px-4 py-1.5 text-sm"
            style={{ borderColor: "var(--gold)", color: "var(--gold)", background: "color-mix(in srgb, var(--gold) 13%, transparent)" }}>
            {show.saved ? "✓ Saved" : "+ Save to My Shows"}
          </button>
          {show.saved && (
            <label className="text-sm" style={{ color: "var(--muted)" }}>
              My rating{" "}
              <select value={show.myRating ?? ""} onChange={(e) => onRate(Number(e.target.value))}
                className="rounded border bg-transparent px-1 py-0.5"
                style={{ borderColor: "var(--border)" }}>
                <option value="" disabled>-</option>
                {Array.from({ length: 10 }, (_, i) => 10 - i).map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            </label>
          )}
        </div>
      </div>
    </div>
  );
}
