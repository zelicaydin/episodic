import { TIERS } from "../lib/colors";

export function ColorKey() {
  return (
    <div className="mt-4 flex flex-wrap items-center gap-2 text-xs" style={{ color: "var(--muted)" }}>
      <span className="mr-1">color key</span>
      {[...TIERS].reverse().map((t) => (
        <span key={t.label} className="rounded px-2 py-0.5"
          style={{ background: t.bg, color: t.text, fontWeight: t.standout ? 700 : 400 }}>
          {t.label}
        </span>
      ))}
      <span className="rounded px-2 py-0.5" style={{ background: "#27272a" }}>unrated</span>
    </div>
  );
}
