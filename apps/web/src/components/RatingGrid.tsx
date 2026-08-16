import { useState } from "react";
import type { EpisodeCell, SeasonGrid } from "@episodic/shared";
import { RatingCell } from "./RatingCell";

interface Props {
  seasons: SeasonGrid[]; showSeasonAvg: boolean; watchMode: boolean;
  onToggleWatched: (ep: EpisodeCell) => void;
  filter?: string;
}

export function RatingGrid({ seasons, showSeasonAvg, watchMode, onToggleWatched, filter = "" }: Props) {
  const [hovered, setHovered] = useState<{ ep: EpisodeCell; rect: DOMRect } | null>(null);
  const maxEp = Math.max(0, ...seasons.map((s) => Math.max(0, ...s.episodes.map((e) => e.episode))));
  const rows = Array.from({ length: maxEp }, (_, i) => i + 1);
  return (
    <div className="overflow-x-auto">
      <table className="border-separate" style={{ borderSpacing: 7 }}>
        <thead>
          <tr style={{ color: "var(--muted)" }}>
            <th></th>
            {seasons.map((s) => <th key={s.season} className="px-2 text-base">S{s.season}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((epNum) => (
            <tr key={epNum}>
              <td className="pr-2 text-base" style={{ color: "var(--muted)" }}>E{epNum}</td>
              {seasons.map((s) => {
                const ep = s.episodes.find((e) => e.episode === epNum);
                return (
                  <td key={s.season}>
                    {ep && (
                      <RatingCell ep={ep} watchMode={watchMode} onToggleWatched={onToggleWatched}
                        onHover={(ep, rect) => setHovered({ ep, rect })} onLeave={() => setHovered(null)}
                        dimmed={filter.trim() !== "" && !(ep.title ?? "").toLowerCase().includes(filter.trim().toLowerCase())} />
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
          {showSeasonAvg && (
            <tr>
              <td className="pr-2 text-sm" style={{ color: "var(--muted)" }}>avg</td>
              {seasons.map((s) => (
                <td key={s.season} className="text-center text-sm" style={{ color: "var(--muted)" }}>
                  {s.average === null ? "" : s.average.toFixed(1)}
                </td>
              ))}
            </tr>
          )}
        </tbody>
      </table>
      {hovered && (
        <div
          role="tooltip"
          className="pointer-events-none fixed z-50 rounded-lg border px-3 py-2 shadow-lg"
          style={{
            background: "var(--surface)",
            borderColor: "var(--border)",
            left: Math.min(hovered.rect.left, window.innerWidth - 280),
            top: hovered.rect.bottom + 8,
            maxWidth: 260,
          }}
        >
          <div className="text-sm font-semibold" style={{ color: "var(--text)" }}>
            {hovered.ep.title ?? "Untitled episode"}
          </div>
          <div className="mt-0.5 text-xs" style={{ color: "var(--muted)" }}>
            S{hovered.ep.season}E{hovered.ep.episode}
            {hovered.ep.rating !== null
              ? ` · ${hovered.ep.rating} · ${hovered.ep.votes.toLocaleString()} votes`
              : " · unrated"}
            {hovered.ep.watched ? " · watched" : ""}
          </div>
        </div>
      )}
    </div>
  );
}
