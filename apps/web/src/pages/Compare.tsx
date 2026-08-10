import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ApiError, getCompare } from "../api";
import { SearchBox } from "../components/SearchBox";
import { StatStrip } from "../components/StatStrip";
import { RatingGrid } from "../components/RatingGrid";
import { ColorKey } from "../components/ColorKey";
import { SetupCard } from "../components/SetupCard";

export function Compare() {
  const [params, setParams] = useSearchParams();
  const a = params.get("a");
  const b = params.get("b");
  const q = useQuery({
    queryKey: ["compare", a, b],
    queryFn: () => getCompare(a, b),
    enabled: a !== null || b !== null,
  });

  const setParam = (key: "a" | "b") => (r: { tconst: string }) => {
    const next = new URLSearchParams(params);
    next.set(key, r.tconst);
    setParams(next);
  };

  if (q.error instanceof ApiError && q.error.code === "not_ingested") return <SetupCard />;

  const placeholder = (
    <div className="flex min-h-36 items-center justify-center rounded-lg border border-dashed text-sm"
      style={{ borderColor: "var(--border)", color: "var(--muted)" }}>
      Pick a second show to compare
    </div>
  );

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row">
        <SearchBox onPick={setParam("a")} />
        <SearchBox onPick={setParam("b")} />
      </div>
      {a === null && b === null && <p style={{ color: "var(--muted)" }}>Pick two shows to compare.</p>}
      {q.data && (
        <>
          <div className="mb-6 grid gap-4 sm:grid-cols-2">
            {q.data.a ? <StatStrip show={q.data.a} /> : placeholder}
            {q.data.b ? <StatStrip show={q.data.b} /> : placeholder}
          </div>
          <div className="grid gap-6 sm:grid-cols-2">
            {q.data.a ? <RatingGrid seasons={q.data.a.seasons} showSeasonAvg watchMode={false} onToggleWatched={() => {}} /> : <div />}
            {q.data.b ? <RatingGrid seasons={q.data.b.seasons} showSeasonAvg watchMode={false} onToggleWatched={() => {}} /> : <div />}
          </div>
          {(q.data.a || q.data.b) && <ColorKey />}
        </>
      )}
    </div>
  );
}
