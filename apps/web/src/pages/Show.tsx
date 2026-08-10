import { useState } from "react";
import { useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { EpisodeCell, ShowDetails } from "@episodic/shared";
import { ApiError, getShow, saveShow, setMyRating, setWatched, unsaveShow } from "../api";
import { ShowHeader } from "../components/ShowHeader";
import { RatingGrid } from "../components/RatingGrid";
import { ColorKey } from "../components/ColorKey";
import { SetupCard } from "../components/SetupCard";

export function Show() {
  const { tconst = "" } = useParams();
  const qc = useQueryClient();
  const [seasonAvg, setSeasonAvg] = useState(true);
  const [watchMode, setWatchMode] = useState(false);
  const q = useQuery({ queryKey: ["show", tconst], queryFn: () => getShow(tconst) });
  const invalidate = () => qc.invalidateQueries({ queryKey: ["show", tconst] });

  const save = useMutation({
    mutationFn: () => (q.data?.saved ? unsaveShow(tconst) : saveShow(tconst)),
    onSettled: invalidate,
  });
  const rate = useMutation({ mutationFn: (r: number) => setMyRating(tconst, r), onSettled: invalidate });
  const watch = useMutation({
    mutationFn: (ep: EpisodeCell) => setWatched(ep.tconst, !ep.watched),
    onMutate: async (ep) => {
      await qc.cancelQueries({ queryKey: ["show", tconst] });
      qc.setQueryData<ShowDetails>(["show", tconst], (old) => old && ({
        ...old,
        seasons: old.seasons.map((s) => ({
          ...s,
          episodes: s.episodes.map((e) => e.tconst === ep.tconst ? { ...e, watched: !e.watched } : e),
        })),
      }));
    },
    onSettled: invalidate,
  });

  if (q.error instanceof ApiError && q.error.code === "not_ingested") return <SetupCard />;
  if (q.error instanceof ApiError && q.error.status === 404) return <p>Show not found.</p>;
  if (q.error) return <p style={{ color: "var(--bad)" }}>Something went wrong loading this show.</p>;
  if (q.data === undefined) return <p style={{ color: "var(--muted)" }}>Loading...</p>;
  const show = q.data;

  return (
    <div>
      <ShowHeader show={show} onSaveToggle={() => save.mutate()} onRate={(r) => rate.mutate(r)} />
      <div className="mb-3 flex gap-5 text-sm" style={{ color: "var(--muted)" }}>
        <label><input type="checkbox" checked={seasonAvg} onChange={(e) => setSeasonAvg(e.target.checked)} /> Season averages</label>
        <label><input type="checkbox" checked={watchMode} onChange={(e) => setWatchMode(e.target.checked)} /> Mark watched</label>
      </div>
      <RatingGrid seasons={show.seasons} showSeasonAvg={seasonAvg}
        watchMode={watchMode} onToggleWatched={(ep) => watch.mutate(ep)} />
      <ColorKey />
      {show.unplacedCount > 0 && (
        <p className="mt-3 text-xs" style={{ color: "var(--muted)" }}>
          {show.unplacedCount} specials or unplaced episodes not shown
        </p>
      )}
    </div>
  );
}
