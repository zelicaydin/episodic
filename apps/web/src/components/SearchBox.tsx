import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { SearchResult } from "@scoretrack/shared";
import { search } from "../api";

export function SearchBox({ autoFocus = false }: { autoFocus?: boolean }) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const [sel, setSel] = useState(0);
  const nav = useNavigate();
  const timer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    clearTimeout(timer.current);
    if (q.trim() === "") { setResults([]); setOpen(false); return; }
    timer.current = setTimeout(async () => {
      try {
        const r = await search(q);
        setResults(r); setOpen(true); setSel(0);
      } catch { setResults([]); }
    }, 200);
    return () => clearTimeout(timer.current);
  }, [q]);

  function pick(r: SearchResult) { setOpen(false); setQ(""); nav(`/show/${r.tconst}`); }

  return (
    <div className="relative w-full max-w-xl">
      <input
        autoFocus={autoFocus} value={q} placeholder="Search for a show..."
        onChange={(e) => setQ(e.target.value)}
        onKeyDown={(e) => {
          if (!open) return;
          if (e.key === "ArrowDown") { e.preventDefault(); setSel((s) => Math.min(s + 1, results.length - 1)); }
          if (e.key === "ArrowUp") { e.preventDefault(); setSel((s) => Math.max(s - 1, 0)); }
          if (e.key === "Enter" && results[sel]) pick(results[sel]);
          if (e.key === "Escape") setOpen(false);
        }}
        className="w-full rounded-lg border bg-transparent px-4 py-2.5 outline-none"
        style={{ borderColor: "var(--border)" }}
      />
      {open && results.length > 0 && (
        <ul className="absolute z-10 mt-1 w-full rounded-lg border"
          style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
          {results.map((r, i) => (
            <li key={r.tconst}>
              <button type="button" onClick={() => pick(r)}
                className="flex w-full items-baseline justify-between px-4 py-2 text-left text-sm"
                style={i === sel ? { background: "#27272a" } : undefined}>
                <span>{r.title} <span style={{ color: "var(--muted)" }}>
                  {r.startYear ?? "?"}{r.endYear !== r.startYear ? ` to ${r.endYear ?? "now"}` : ""}
                </span></span>
                {r.rating !== null && <span style={{ color: "var(--gold)" }}>★ {r.rating}</span>}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
