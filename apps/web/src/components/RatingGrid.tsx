import type { EpisodeCell, SeasonGrid } from "@episodic/shared";
import { RatingCell } from "./RatingCell";

interface Props {
  seasons: SeasonGrid[]; showSeasonAvg: boolean; watchMode: boolean;
  onToggleWatched: (ep: EpisodeCell) => void;
}

export function RatingGrid({ seasons, showSeasonAvg, watchMode, onToggleWatched }: Props) {
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
                    {ep && <RatingCell ep={ep} watchMode={watchMode} onToggleWatched={onToggleWatched} />}
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
    </div>
  );
}
