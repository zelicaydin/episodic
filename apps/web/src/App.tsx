import { Link, Outlet, Route, Routes } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getStatus } from "./api";
import { Home } from "./pages/Home";
import { Show } from "./pages/Show";

function Shell() {
  const status = useQuery({ queryKey: ["status"], queryFn: getStatus });
  return (
    <div className="min-h-screen flex flex-col">
      <nav className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: "var(--border)" }}>
        <Link to="/" className="logo text-xl font-bold">ScoreTrack</Link>
        <div className="flex gap-5 text-sm" style={{ color: "var(--muted)" }}>
          <Link to="/my" className="hover:text-white">My Shows</Link>
          <Link to="/compare" className="hover:text-white">Compare</Link>
        </div>
      </nav>
      <main className="flex-1 px-6 py-6 max-w-6xl mx-auto w-full"><Outlet /></main>
      <footer className="px-6 py-4 text-xs border-t" style={{ color: "var(--muted)", borderColor: "var(--border)" }}>
        <p>Information courtesy of IMDb (https://www.imdb.com). Used with permission.</p>
        <p>This product uses the TMDB API but is not endorsed or certified by TMDB.</p>
        {status.data?.datasetDate && <p>Ratings as of {status.data.datasetDate}</p>}
        {status.data && !status.data.tmdbConfigured && (
          <p>Posters are off. Add a TMDB API key to .env to enable them (see README).</p>
        )}
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route element={<Shell />}>
        <Route path="/" element={<Home />} />
        <Route path="/show/:tconst" element={<Show />} />
        <Route path="/compare" element={<div>Compare</div>} />
        <Route path="/my" element={<div>My Shows</div>} />
      </Route>
    </Routes>
  );
}
