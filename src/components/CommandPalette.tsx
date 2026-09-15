import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "../lib/motion";
import { Search, X, BookOpen, CornerDownLeft, ArrowUp, ArrowDown, Sparkles } from "lucide-react";
import { Story } from "../types";

interface ResultItem {
  key: string;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  onSelect: () => void;
}

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
  stories: Story[];
  onSelectStory: (story: Story) => void;
}

export default function CommandPalette({ open, onClose, stories, onSelectStory }: CommandPaletteProps) {
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  // Reset + focus on open
  useEffect(() => {
    if (open) {
      setQuery("");
      setActiveIndex(0);
      const t = setTimeout(() => inputRef.current?.focus(), 30);
      return () => clearTimeout(t);
    }
  }, [open]);

  // Local search over loaded stories — fast, works offline, opens the story modal.
  const items: ResultItem[] = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return stories
      .filter((s) =>
        [s.title, s.author, s.description, ...(s.categories || [])]
          .filter(Boolean)
          .some((field) => String(field).toLowerCase().includes(q))
      )
      .slice(0, 8)
      .map((s) => ({
        key: `story-${s.slug}`,
        title: s.title,
        subtitle: `${s.author || "The Ink Home"} · ${s.categories?.[0] || "Editorial"}`,
        icon: <BookOpen className="w-4 h-4 text-[var(--atmo-text)]" />,
        onSelect: () => {
          onSelectStory(s);
          onClose();
        },
      }));
  }, [query, stories, onSelectStory, onClose]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { e.preventDefault(); onClose(); return; }
      if (items.length === 0) return;
      if (e.key === "ArrowDown") { e.preventDefault(); setActiveIndex((i) => (i + 1) % items.length); }
      if (e.key === "ArrowUp") { e.preventDefault(); setActiveIndex((i) => (i - 1 + items.length) % items.length); }
      if (e.key === "Enter") { e.preventDefault(); items[activeIndex]?.onSelect(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, items, activeIndex, onClose]);

  // Keep the active item scrolled into view.
  useEffect(() => {
    const el = listRef.current?.children[activeIndex] as HTMLElement | undefined;
    el?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-[100] flex items-start justify-center bg-black/70 backdrop-blur-md pt-[12vh] px-4"
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          aria-label="Search stories"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: -6 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="w-full max-w-xl bg-[#0a0a0a]/95 border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Input row */}
            <div className="flex items-center gap-3 px-4 py-3.5 border-b border-white/10">
              <Search className="w-4 h-4 text-slate-500 shrink-0" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => { setQuery(e.target.value); setActiveIndex(0); }}
                placeholder="Search stories, authors, topics…  (⌘K)"
                className="flex-1 bg-transparent text-sm text-white placeholder-slate-500 focus:outline-none"
                spellCheck={false}
                autoComplete="off"
                aria-label="Search stories"
              />
              <button onClick={onClose} aria-label="Close search" className="p-1 text-slate-500 hover:text-white transition-colors cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Results */}
            <ul ref={listRef} className="max-h-[50vh] overflow-y-auto custom-scrollbar p-2" role="listbox">
              {query.trim() === "" && (
                <li className="px-3 py-6 text-center text-xs text-slate-500 font-mono uppercase tracking-widest">
                  Type to search the archive
                </li>
              )}

              {query.trim() !== "" && items.length === 0 && (
                <li className="px-3 py-6 text-center text-xs text-slate-500 font-mono uppercase tracking-widest">
                  No results for “{query}”
                </li>
              )}

              {items.map((item, idx) => (
                <li key={item.key}>
                  <button
                    onClick={item.onSelect}
                    onMouseEnter={() => setActiveIndex(idx)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors cursor-pointer ${
                      activeIndex === idx ? "bg-[var(--atmo-surface-strong)] text-white" : "text-slate-300"
                    }`}
                  >
                    {item.icon}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate">{item.title}</p>
                      <p className="text-[11px] text-slate-500 truncate">{item.subtitle}</p>
                    </div>
                    {activeIndex === idx && (
                      <CornerDownLeft className="w-3 h-3 text-slate-500 shrink-0" />
                    )}
                  </button>
                </li>
              ))}

              {items.length > 0 && (
                <li className="flex items-center justify-between px-3 pt-2 pb-1 text-[9px] font-mono uppercase tracking-widest text-slate-600">
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3" />
                    {items.length} result{items.length === 1 ? "" : "s"}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <ArrowUp className="w-2.5 h-2.5" /><ArrowDown className="w-2.5 h-2.5" />
                    navigate · Enter to open
                  </span>
                </li>
              )}
            </ul>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
