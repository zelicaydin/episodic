export function VerdictBox({ verdict, tone }: { verdict: string; tone: "good" | "bad" }) {
  const color = tone === "bad" ? "var(--bad)" : "var(--good)";
  return (
    <div className="rounded-r-lg py-2 pl-4 pr-4 text-sm"
      style={{ background: `color-mix(in srgb, ${color} 8%, transparent)`, borderLeft: `3px solid ${color}`, color }}>
      <strong>Verdict:</strong> {verdict}
    </div>
  );
}
