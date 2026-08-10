import type { EpisodeCell } from "@scoretrack/shared";
import { tierFor } from "../lib/colors";

interface Props { ep: EpisodeCell; watchMode: boolean; onToggleWatched: (ep: EpisodeCell) => void; }

export function RatingCell({ ep, watchMode, onToggleWatched }: Props) {
  const tier = tierFor(ep.rating);
  const tooltip = `S${ep.season}E${ep.episode}${ep.title ? " " + ep.title : ""}` +
    (ep.rating !== null ? `, ${ep.rating} (${ep.votes} votes)` : ", unrated") +
    (ep.watched ? ", watched" : "");
  const style = tier
    ? { background: tier.bg, color: tier.text, fontWeight: tier.standout ? 700 : 400 }
    : { background: "#27272a", color: "var(--muted)" };
  const content = (
    <span title={tooltip} className="block rounded-md px-3 py-2 text-center text-sm" style={style}>
      {ep.watched ? "✓ " : ""}{ep.rating ?? ""}
    </span>
  );
  if (watchMode) {
    return <button type="button" className="w-full" onClick={() => onToggleWatched(ep)}>{content}</button>;
  }
  if (ep.rating === null) return content;
  return <a href={`https://www.imdb.com/title/${ep.tconst}/`} target="_blank" rel="noreferrer">{content}</a>;
}
