import { useQuery } from "@tanstack/react-query";
import { getRecentlyViewed, getStatus, getTrending } from "../api";
import { SearchBox } from "../components/SearchBox";
import { ShowCard } from "../components/ShowCard";
import { SetupCard } from "../components/SetupCard";

export function Home() {
  const status = useQuery({ queryKey: ["status"], queryFn: getStatus });
  const trending = useQuery({ queryKey: ["trending"], queryFn: getTrending, enabled: status.data?.ingested === true });
  const recent = useQuery({ queryKey: ["recent"], queryFn: getRecentlyViewed, enabled: status.data?.ingested === true });

  if (status.data?.ingested === false) return <SetupCard />;

  return (
    <div>
      <div className="mt-10 mb-12 flex flex-col items-center gap-4 text-center">
        <h1 className="logo text-4xl font-bold">ScoreTrack</h1>
        <p style={{ color: "var(--muted)" }}>Every episode, scored.</p>
        <SearchBox autoFocus />
      </div>
      <h2 className="mb-3 text-lg font-semibold">Trending</h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {(trending.data ?? []).map((s) => <ShowCard key={s.tconst} show={s} />)}
      </div>
      {(recent.data ?? []).length > 0 && (
        <>
          <h2 className="mt-10 mb-3 text-lg font-semibold">Recently viewed</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {(recent.data ?? []).map((s) => <ShowCard key={s.tconst} show={s} />)}
          </div>
        </>
      )}
    </div>
  );
}
