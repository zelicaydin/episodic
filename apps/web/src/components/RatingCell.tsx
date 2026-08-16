import type { EpisodeCell } from "@episodic/shared";
import { tierFor } from "../lib/colors";

interface Props {
  ep: EpisodeCell; watchMode: boolean; onToggleWatched: (ep: EpisodeCell) => void;
  onHover?: (ep: EpisodeCell, rect: DOMRect) => void; onLeave?: () => void;
  dimmed?: boolean;
}

export function RatingCell({ ep, watchMode, onToggleWatched, onHover, onLeave, dimmed }: Props) {
  const tier = tierFor(ep.rating);
  const tooltip = `S${ep.season}E${ep.episode}${ep.title ? " " + ep.title : ""}` +
    (ep.rating !== null ? `, ${ep.rating} (${ep.votes} votes)` : ", unrated") +
    (ep.watched ? ", watched" : "");
  const style = tier
    ? { background: tier.bg, color: tier.text, fontWeight: tier.standout ? 700 : 400, ...(dimmed ? { opacity: 0.2 } : {}) }
    : { background: "#27272a", color: "var(--muted)", ...(dimmed ? { opacity: 0.2 } : {}) };
  const content = (
    <span aria-label={tooltip} className="block rounded-md px-4 py-3 text-center text-base" style={style}
      onMouseEnter={(e) => onHover?.(ep, e.currentTarget.getBoundingClientRect())}
      onMouseLeave={() => onLeave?.()}>
      {ep.watched ? "✓ " : ""}{ep.rating ?? ""}
    </span>
  );
  if (watchMode) {
    return <button type="button" className="w-full" onClick={() => onToggleWatched(ep)}>{content}</button>;
  }
  if (ep.rating === null) return content;
  return <a href={`https://www.imdb.com/title/${ep.tconst}/`} target="_blank" rel="noreferrer">{content}</a>;
}
