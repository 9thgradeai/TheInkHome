import React, { useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import { ArrowDownRight, Feather, Search } from "lucide-react";
import { StoryCard } from "../components/StoryCard";
import { Story } from "../types";
import { stripHtml, topCategories } from "../lib/format";

interface StoriesPageProps {
  stories: Story[];
  loading: boolean;
  onOpen: (story: Story) => void;
}

const EASE = [0.16, 1, 0.3, 1] as const;

function Reveal({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.7, delay, ease: EASE }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export default function StoriesPage({
  stories,
  loading,
  onOpen,
}: StoriesPageProps) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [visible, setVisible] = useState(30);

  const categories = useMemo(() => topCategories(stories, 10), [stories]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return stories.filter((story) => {
      const matchesCategory =
        category === "All" || story.categories.includes(category);
      const matchesQuery =
        !needle ||
        story.title.toLowerCase().includes(needle) ||
        story.author.toLowerCase().includes(needle) ||
        stripHtml(story.description).toLowerCase().includes(needle);
      return matchesCategory && matchesQuery;
    });
  }, [stories, category, query]);

  useEffect(() => {
    setVisible(30);
  }, [category, query]);

  return (
    <section className="min-h-screen bg-[#08080a] text-white">

      <main className="pt-20 px-4 pb-24 sm:px-8 sm:pb-32">
        <div className="mx-auto max-w-7xl">
          <div className="pt-32 sm:pt-36">
            <div>
              <div className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.24em] text-[#c8ff4d]">
                <Feather className="h-3 w-3" /> The archive
              </div>
              <h1 className="mt-4 max-w-2xl font-display text-4xl font-black tracking-[-0.03em] text-white sm:text-6xl">
                Every story in one place.
              </h1>
              <p className="mt-4 max-w-xl text-sm leading-relaxed text-white/65">
                The full archive. Filter by topic or search for a
                writer or title. Open any story for the full reading experience.
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2 font-mono text-[9px] uppercase tracking-[0.16em] text-white/50">
              <span
                className={`h-1.5 w-1.5 rounded-full ${loading ? "animate-pulse bg-white/50" : "bg-[#c8ff4d]"}`}
              />
              {loading ? "Syncing…" : `${filtered.length} stories`}
            </div>
          </div>

          <div className="flex flex-col gap-4 border-y border-white/10 py-6 lg:flex-row lg:items-center lg:justify-between mb-10">
            <div className="flex flex-wrap gap-1.5">
              {["All", ...categories].map((tag) => {
                const active = category === tag;
                return (
                  <button
                    key={tag}
                    onClick={() => setCategory(tag)}
                    className={`rounded-full border px-3 py-1.5 font-mono text-[9px] uppercase tracking-[0.14em] transition-colors ${
                      active
                        ? "border-[#c8ff4d] bg-[#c8ff4d] text-black"
                        : "border-white/10 text-white/45 hover:border-white/30 hover:text-white"
                    }`}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>
            <label className="flex w-full items-center gap-2 rounded-full border border-white/10 bg-white/[0.02] px-4 py-2.5 focus-within:border-white/30 lg:w-72">
              <Search className="h-3.5 w-3.5 shrink-0 text-white/30" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search stories or writers"
                className="w-full bg-transparent text-[12px] text-white placeholder:text-white/40 focus:outline-none"
              />
              {query && (
                <button
                  onClick={() => setQuery("")}
                  className="font-mono text-[9px] uppercase tracking-[0.1em] text-white/40 hover:text-white"
                >
                  Clear
                </button>
              )}
            </label>
          </div>

          {filtered.length === 0 ? (
            <div className="mt-16 flex flex-col items-center gap-4 rounded-2xl border border-dashed border-white/15 py-24 text-center">
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/40">
                No stories match that search
              </p>
              <button
                onClick={() => {
                  setQuery("");
                  setCategory("All");
                }}
                className="rounded-full border border-white/15 px-6 py-3 font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-white/60 hover:text-white"
              >
                Reset filters
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filtered.slice(0, visible).map((story, index) => (
                  <Reveal
                    key={story.slug}
                    delay={Math.min((index % 4) * 0.05, 0.2)}
                    className="h-full"
                  >
                    <StoryCard story={story} onOpen={onOpen} />
                  </Reveal>
                ))}
              </div>

              <div className="mt-14 flex flex-col items-center gap-3">
                <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-white/50">
                  Showing {Math.min(visible, filtered.length)} of {filtered.length}
                </span>
                {visible < filtered.length && (
                  <button
                    onClick={() => setVisible((count) => count + 12)}
                    className="group flex items-center gap-2 rounded-full border border-white/15 px-6 py-3 text-[11px] font-bold uppercase tracking-[0.16em] text-white/70 transition-colors hover:border-white/40 hover:text-white"
                  >
                    Load more stories
                    <ArrowDownRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:translate-y-0.5" />
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </main>
    </section>
  );
}
