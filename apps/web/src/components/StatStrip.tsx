import type { ShowDetails } from "@episodic/shared";
import { VerdictBox } from "./VerdictBox";

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex justify-between text-sm">
      <span style={{ color: "var(--muted)" }}>{label}</span><span>{children}</span>
    </div>
  );
}

export function StatStrip({ show }: { show: ShowDetails }) {
  const i = show.insights;
  return (
    <div className="flex flex-col gap-2 rounded-lg p-4" style={{ background: "var(--surface)" }}>
      <h3 className="font-semibold">{show.title}</h3>
      <Row label="avg">
        <span style={{ color: "var(--gold)" }}>{i.weightedAverage === null ? "n/a" : i.weightedAverage.toFixed(2)}</span>
      </Row>
      <Row label="peak">{i.peak ? `${i.peak.rating} S${i.peak.season}E${i.peak.episode}` : "n/a"}</Row>
      <Row label="worst">{i.worst ? `${i.worst.rating} S${i.worst.season}E${i.worst.episode}` : "n/a"}</Row>
      <Row label="consistency">
        {i.mostConsistentSeason === null ? "n/a" : `most consistent: S${i.mostConsistentSeason}`}
      </Row>
      <Row label="trend">
        {i.trajectory === null ? "n/a"
          : i.trajectory === "rising" ? "rising ↗"
          : i.trajectory === "falling" ? "falling ↘" : "flat →"}
      </Row>
      <VerdictBox verdict={i.verdict} tone={i.fallOffSeason === null ? "good" : "bad"} />
    </div>
  );
}
