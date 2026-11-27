import { useEffect, useMemo, useState } from "react";
import { ArrowRight, RefreshCw, Search, X } from "lucide-react";
import type { Story } from "../../types";
import { searchStories } from "../../lib/search";
import { useNavigate } from "../../router";
import StoryCard from "../StoryCard";
import { EmptyState, ErrorState } from "../ui/States";
import Reveal from "../ui/Reveal";

interface LatestSectionProps {
  stories: Story[];
  loading: boolean;
  error: boolean;
  query: string;
  category: string;
  onQuery: (value: string) => void;
  onCategory: (value: string) => void;
  onRetry: () => void;
}

const ROWS_PER_PAGE = 21;
const LOAD_MORE = 12;

export default function LatestSection({
  stories,
  loading,
  error,
  query,
  category,
  onQuery,
  onCategory,
  onRetry,
}: LatestSectionProps) {
  const navigate = useNavigate();
  const [visible, setVisible] = useState(ROWS_PER_PAGE);

  const categories = useMemo(() => {
    const counts = new Map<string, number>();
    for (const story of stories) {
      for (const raw of story.categories || []) {
        const label = raw.trim();
        if (!label || label.toLowerCase() === "the-ink-home") continue;
        counts.set(label, (counts.get(label) || 0) + 1);
      }
    }
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .slice(0, 10)
      .map(([label]) => label);
  }, [stories]);

  const matches = useMemo(
    () => searchStories(stories, query, { category }),
    [stories, query, category],
  );

  const isFiltering = query.trim().length > 0 || category !== "All";
  const featured: typeof matches = [];
  const rest = matches;

  useEffect(() => setVisible(ROWS_PER_PAGE), [query, category]);

  const showSkeleton = loading && stories.length === 0;
  const showError = error && stories.length === 0;
  const showEmpty = !showSkeleton && !showError && matches.length === 0;

  return (
    <section id="latest" className="scroll-mt-24 border-t border-line py-16 sm:py-20">
      <div className="shell">
        <Reveal className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="eyebrow">The latest</p>
            <h2 className="mt-4 max-w-[18ch] font-display text-[clamp(2rem,4.5vw,3.25rem)] font-semibold leading-[1.02] tracking-[-0.03em] text-ink">
              Fresh ink, newest first.
            </h2>
          </div>
          <p
            aria-live="polite"
            className="flex shrink-0 items-center gap-2 text-[13px] text-ink-faint sm:pb-2"
          >
            <span
              aria-hidden="true"
              className={`h-1.5 w-1.5 rounded-full ${
                loading ? "animate-pulse bg-ink-faint" : error ? "bg-[#b3462f]" : "bg-accent"
              }`}
            />
            {loading ? "Syncing the archive…" : error ? "Showing the last saved archive" : `${matches.length} ${matches.length === 1 ? "story" : "stories"}`}
          </p>
        </Reveal>

        <Reveal delay={0.04} className="mt-8">
          <div className="flex flex-col gap-4 border-y border-line py-4 lg:flex-row lg:items-center lg:justify-between">
            <div
              role="group"
              aria-label="Filter by topic"
              className="-mx-1 flex flex-wrap gap-1.5 px-1"
            >
              {["All", ...categories].map((tag) => (
                <button
                  key={tag}
                  type="button"
                  className="chip"
                  aria-pressed={category === tag}
                  onClick={() => onCategory(tag)}
                >
                  {tag}
                </button>
              ))}
            </div>

            <label className="relative flex w-full shrink-0 items-center lg:w-72">
              <span className="sr-only">Search stories and writers</span>
              <Search
                aria-hidden="true"
                className="pointer-events-none absolute left-4 h-4 w-4 text-ink-faint"
              />
              <input
                type="search"
                value={query}
                onChange={(event) => onQuery(event.target.value)}
                placeholder="Search stories, writers, topics"
                className="field pl-11 pr-11"
                autoComplete="off"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => onQuery("")}
                  aria-label="Clear search"
                  className="absolute right-2.5 flex h-8 w-8 items-center justify-center rounded-full text-ink-faint transition-colors hover:bg-[color-mix(in_srgb,var(--ink)_8%,transparent)] hover:text-ink"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </label>
          </div>
        </Reveal>

        {showSkeleton ? (
          <div
            aria-busy="true"
            aria-live="polite"
            className="mt-10 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3"
          >
            {Array.from({ length: 6 }).map((_, index) => (
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
          <EmptyState
            onAction={() => {
              onQuery("");
              onCategory("All");
            }}
          />
        ) : (
          <>
            {rest.length > 0 && (
              <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
                {rest.slice(0, visible).map((match, index) => (
                  <Reveal key={match.story.slug} delay={Math.min((index % 3) * 0.05, 0.15)} className="h-full">
                    <StoryCard story={match.story} />
                  </Reveal>
                ))}
              </div>
            )}

            {rest.length > 0 && (
              <div className="mt-10 flex flex-col items-center gap-3">
                <span className="text-[12.5px] text-ink-faint">
                  Showing {Math.min(visible, rest.length)} of {rest.length} stories
                </span>
                {visible < rest.length && (
                  <button
                    type="button"
                    onClick={() => setVisible((count) => count + LOAD_MORE)}
                    className="btn btn-outline group"
                  >
                    Load more stories
                    <ArrowRight
                      aria-hidden="true"
                      className="h-4 w-4 transition-transform group-hover:translate-x-1"
                    />
                  </button>
                )}
              </div>
            )}

            <div className="mt-10 flex justify-center">
              <button type="button" onClick={() => navigate("/stories")} className="btn btn-quiet group">
                Open the full archive
                <ArrowRight
                  aria-hidden="true"
                  className="h-4 w-4 transition-transform group-hover:translate-x-1"
                />
              </button>
            </div>
          </>
        )}

        {error && stories.length > 0 && (
          <p role="status" className="mt-8 flex items-center justify-center gap-2 text-[13px] text-ink-faint">
            <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
            Live sync failed — you are reading the last saved archive.
            <button type="button" onClick={onRetry} className="underline decoration-accent underline-offset-4 hover:text-ink">
              Retry
            </button>
          </p>
        )}
      </div>
    </section>
  );
}
