import { useState, useEffect } from "react";
import FALLBACK_STORIES from "../data/fallbackStories";

export function useDarkMode() {
  const [dark, setDark] = useState(() => {
    try { return localStorage.getItem("the-ink-home:dark") === "1"; } catch { return false; }
  });
  useEffect(() => {
    localStorage.setItem("the-ink-home:dark", dark ? "1" : "0");
    document.documentElement.setAttribute("data-theme", dark ? "dark" : "light");
  }, [dark]);
  return { dark, toggle: () => setDark((d) => !d) };
}

export function useReadingProgress() {
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    const handle = () => {
      const h = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(h > 0 ? window.scrollY / h : 0);
    };
    window.addEventListener("scroll", handle, { passive: true });
    return () => window.removeEventListener("scroll", handle);
  }, []);
  return progress;
}

export function useAdvancedSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);

  useEffect(() => {
    if (!query.trim() || !open) { setResults([]); return; }
    const filtered = FALLBACK_STORIES.filter(
      (s) =>
        s.title.toLowerCase().includes(query.toLowerCase()) ||
        s.description.toLowerCase().includes(query.toLowerCase()) ||
        s.author.toLowerCase().includes(query.toLowerCase())
    );
    setResults(filtered.slice(0, 5));
  }, [query, open]);

  return { open, setOpen, query, setQuery, results };
}

export function Wave3Features({ onNavigate }: { onNavigate?: (path: string) => void }) {
  const { dark, toggle } = useDarkMode();
  const progress = useReadingProgress();
  const { open, setOpen, query, setQuery, results } = useAdvancedSearch();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); setOpen((o) => !o); }
      if (e.key === "Escape" && open) setOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, setOpen]);

  return (
    <>
      <div className="reading-progress-bar" style={{ transform: `scaleX(${progress})` }} aria-hidden />
      <div className={`search-panel ${open ? "open" : ""}`} role="search">
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <input
            type="text"
            placeholder="Search stories — ⌘K"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setOpen(true)}
          />
          <button onClick={() => setOpen(false)} aria-label="Close search" style={{ color: "#64748b", fontSize: 12 }}>✕</button>
        </div>
        {results.length > 0 && (
          <div style={{ marginTop: 10, display: "grid", gap: 4 }}>
            {results.map((s: any) => (
              <div
                key={s.slug}
                className="search-result-item"
                onClick={() => { onNavigate?.(`/story/${s.slug}`); setOpen(false); setQuery(""); }}
              >
                <div className="result-title">{s.title}</div>
                <div style={{ fontSize: 11, opacity: 0.7 }}>{s.author} · {s.categories?.[0]}</div>
              </div>
            ))}
          </div>
        )}
        {query && results.length === 0 && <div style={{ marginTop: 10, fontSize: 12, color: "#64748b" }}>No matches</div>}
      </div>
      <button className="dark-mode-toggle" onClick={toggle} aria-label="Toggle dark mode" title={dark ? "Light mode" : "Dark mode"}>
        {dark ? "☀️" : "🌙"}
      </button>
    </>
  );
}
