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
    queryFn: () => getCompare(a as string, b as string),
    enabled: a !== null && b !== null,
  });

  const setParam = (key: "a" | "b") => (r: { tconst: string }) => {
    const next = new URLSearchParams(params);
    next.set(key, r.tconst);
    setParams(next);
  };

  if (q.error instanceof ApiError && q.error.code === "not_ingested") return <SetupCard />;

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row">
        <SearchBox onPick={setParam("a")} />
        <SearchBox onPick={setParam("b")} />
      </div>
      {(a === null || b === null) && <p style={{ color: "var(--muted)" }}>Pick two shows to compare.</p>}
      {q.data && (
        <>
          <div className="mb-6 grid gap-4 sm:grid-cols-2">
            <StatStrip show={q.data.a} /><StatStrip show={q.data.b} />
          </div>
          <div className="grid gap-6 sm:grid-cols-2">
            <RatingGrid seasons={q.data.a.seasons} showSeasonAvg watchMode={false} onToggleWatched={() => {}} />
            <RatingGrid seasons={q.data.b.seasons} showSeasonAvg watchMode={false} onToggleWatched={() => {}} />
          </div>
          <ColorKey />
        </>
      )}
    </div>
  );
}
