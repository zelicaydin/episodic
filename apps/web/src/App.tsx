import { Link, Outlet, Route, Routes, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getStatus } from "./api";
import { Home } from "./pages/Home";
import { Show } from "./pages/Show";
import { Compare } from "./pages/Compare";
import { MyShows } from "./pages/MyShows";
import { SearchBox } from "./components/SearchBox";

function Shell() {
  const status = useQuery({ queryKey: ["status"], queryFn: getStatus });
  const location = useLocation();
  return (
    <div className="min-h-screen flex flex-col">
      <nav className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: "var(--border)" }}>
        <Link to="/" className="logo text-xl font-bold">Episodic</Link>
        <div className="flex items-center gap-4">
          <div className="flex gap-5 text-sm" style={{ color: "var(--muted)" }}>
            <Link to="/my" className="hover:text-white">My Shows</Link>
            <Link to="/compare" className="hover:text-white">Compare</Link>
          </div>
          {location.pathname !== "/" && <SearchBox compact />}
        </div>
      </nav>
      <main className="flex-1 px-6 py-6 max-w-6xl mx-auto w-full"><Outlet /></main>
      <footer className="px-6 py-4 text-center text-[11px] border-t" style={{ color: "var(--muted)", borderColor: "var(--border)" }}>
        <p>Information courtesy of IMDb (https://www.imdb.com). Used with permission.</p>
        <p>Show artwork and summaries from TVmaze.com.</p>
        {status.data?.datasetDate && <p>Ratings as of {status.data.datasetDate}</p>}
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
        <Route path="/compare" element={<Compare />} />
        <Route path="/my" element={<MyShows />} />
      </Route>
    </Routes>
  );
}
