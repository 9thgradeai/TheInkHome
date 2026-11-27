import { useEffect, useMemo, useState } from "react";
import { Feather, Search, X } from "lucide-react";
import { StoryCard } from "../components/StoryCard";
import { EmptyState, ErrorState } from "../components/ui/States";
import Reveal from "../components/ui/Reveal";
import type { Story } from "../types";
import { searchStories, topicsFrom } from "../lib/search";

interface StoriesPageProps {
  stories: Story[];
  loading: boolean;
  error?: boolean;
  onRetry?: () => void;
}

function readParams(): { query: string; tag: string } {
  const params = new URLSearchParams(window.location.search);
  return {
    query: params.get("q") || "",
    tag: params.get("tag") || "All",
  };
}

export default function StoriesPage({ stories, loading, error = false, onRetry }: StoriesPageProps) {
  const [initial] = useState(readParams);
  const [query, setQuery] = useState(initial.query);
  const [category, setCategory] = useState(initial.tag);
  const [visible, setVisible] = useState(24);

  // Keep the URL shareable without triggering a navigation.
  useEffect(() => {
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    if (category && category !== "All") params.set("tag", category);
    const qs = params.toString();
    const target = qs ? `${window.location.pathname}?${qs}` : window.location.pathname;
    const current = `${window.location.pathname}${window.location.search}`;
    if (current !== target) window.history.replaceState(null, "", target);
  }, [query, category]);

  const topics = useMemo(() => topicsFrom(stories, 14), [stories]);
  const matches = useMemo(() => searchStories(stories, query, { category }), [stories, query, category]);

  useEffect(() => setVisible(24), [query, category]);

  const reset = () => {
    setQuery("");
    setCategory("All");
  };

  const showSkeleton = loading && stories.length === 0;
  const showError = error && stories.length === 0;
  const showEmpty = !showSkeleton && !showError && matches.length === 0;

  return (
    <section className="pb-24 pt-28 sm:pb-32 sm:pt-36">
      <div className="shell">
        <header className="border-b border-line pb-8">
          <p className="eyebrow">
            <Feather className="h-3.5 w-3.5" aria-hidden="true" /> The archive
          </p>
          <div className="mt-4 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="max-w-[16ch] font-display text-[clamp(2.25rem,5.5vw,3.75rem)] font-semibold leading-[1] tracking-[-0.035em] text-ink">
                Every story in one place.
              </h1>
              <p className="mt-4 max-w-[52ch] text-[15.5px] leading-relaxed text-ink-soft">
                The full archive, searchable across titles, bylines, topics and the text of every
                essay itself.
              </p>
            </div>
            <p aria-live="polite" className="shrink-0 text-[13px] text-ink-faint">
              {showSkeleton ? "Syncing…" : `${matches.length} ${matches.length === 1 ? "story" : "stories"}`}
            </p>
          </div>
        </header>

        <div className="flex flex-col gap-4 border-b border-line py-5 lg:flex-row lg:items-center lg:justify-between">
          <div role="group" aria-label="Filter by topic" className="flex flex-wrap gap-1.5">
            {["All", ...topics].map((tag) => (
              <button
                key={tag}
                type="button"
                className="chip"
                aria-pressed={category === tag}
                onClick={() => setCategory(tag)}
              >
                {tag}
              </button>
            ))}
          </div>

          <label className="relative flex w-full shrink-0 items-center lg:w-80">
            <span className="sr-only">Search the archive</span>
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute left-4 h-4 w-4 text-ink-faint"
            />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search titles, writers, topics, text"
              className="field pl-11 pr-11"
              autoComplete="off"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                aria-label="Clear search"
                className="absolute right-2.5 flex h-8 w-8 items-center justify-center rounded-full text-ink-faint transition-colors hover:text-ink"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </label>
        </div>

        {showSkeleton ? (
          <div
            aria-busy="true"
            aria-live="polite"
            className="mt-10 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3"
          >
            {Array.from({ length: 9 }).map((_, index) => (
              <div key={index} className="space-y-3">
                <div className="skeleton aspect-[16/10] w-full rounded-xl" />
                <div className="skeleton h-3 w-24" />
                <div className="skeleton h-6 w-4/5" />
                <div className="skeleton h-4 w-full" />
              </div>
            ))}
          </div>
        ) : showError ? (
          <ErrorState onRetry={onRetry} />
        ) : showEmpty ? (
          <EmptyState onAction={reset} />
        ) : (
          <>
            <div className="mt-10 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {matches.slice(0, visible).map((match, index) => (
                <Reveal key={match.story.slug} delay={Math.min((index % 3) * 0.05, 0.15)} className="h-full">
                  <StoryCard story={match.story} />
                </Reveal>
              ))}
            </div>

            <div className="mt-12 flex flex-col items-center gap-3">
              <span className="text-[12.5px] text-ink-faint">
                Showing {Math.min(visible, matches.length)} of {matches.length}
              </span>
              {visible < matches.length && (
                <button type="button" onClick={() => setVisible((count) => count + 12)} className="btn btn-outline">
                  Load more stories
                </button>
              )}
            </div>
          </>
        )}

        {error && stories.length > 0 && (
          <p role="status" className="mt-10 text-center text-[13px] text-ink-faint">
            Live sync failed — showing the last saved archive.{" "}
            <button type="button" onClick={onRetry} className="underline decoration-accent underline-offset-4 hover:text-ink">
              Retry
            </button>
          </p>
        )}
      </div>
    </section>
  );
}
