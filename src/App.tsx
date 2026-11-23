import React, { Suspense, lazy, useCallback, useEffect, useMemo, useState } from "react";
import { Analytics } from "@vercel/analytics/react";
import { AnimatePresence, motion } from "motion/react";
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Asterisk,
  BookOpen,
  Feather,
  PenLine,
  Quote,
  RefreshCw,
  Search,
  Sparkles,
  Users,
} from "lucide-react";
import SiteHeader from "./components/SiteHeader";
import SiteFooter from "./components/SiteFooter";
import EnhancedHero from "./components/EnhancedHero";
import FeaturedStory from "./components/FeaturedStory";
import { StoryCard } from "./components/StoryCard";
import AuthorAvatar from "./components/AuthorAvatar";
import { FALLBACK_ABOUT } from "./data/fallbackAbout";
import { Story } from "./types";
import { stripHtml, topCategories } from "./lib/format";

const ReadingPage = lazy(() => import("./components/ReadingPage"));
const AIAssistant = lazy(() => import("./components/AIAssistant"));
const StoriesPage = lazy(() => import("./pages/StoriesPage"));
const WritersPage = lazy(() => import("./pages/WritersPage"));
const AboutPage = lazy(() => import("./pages/AboutPage"));
const LegalPage = lazy(() => import("./pages/LegalPage"));
const AuthorPage = lazy(() => import("./pages/AuthorPage"));
const SavedPage = lazy(() => import("./pages/SavedPage"));

import NewsletterSignup from "./components/NewsletterSignup";

function RouteFallback() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center" aria-busy="true">
      <div className="h-10 w-10 animate-spin rounded-full border border-white/15 border-t-[#c8ff4d]" />
    </div>
  );
}

const EASE = [0.16, 1, 0.3, 1] as const;
const STORY_CACHE_KEY = "the-ink-home:stories:v5";
const STORY_CACHE_TIME = "the-ink-home:stories:v5:time";
const CACHE_TTL = 1000 * 60 * 20;
const PUBLICATION_URL = "https://medium.com/the-ink-home";

const DEFAULT_TOPICS = [
  "Writing",
  "Technology",
  "Life",
  "Culture",
  "Creativity",
  "Productivity",
  "Relationships",
  "Mental Health",
];

interface Person {
  name: string;
  username?: string;
  role: string;
  bio?: string;
  avatar?: string;
  followers?: number;
  mediumUrl?: string;
}

interface AboutData {
  description: string;
  officialWebsite?: string;
  editors: Person[];
  writers: Person[];
}

function useCurrentPath() {
  const [path, setPath] = useState<string>(() => {
    const redirect = new URLSearchParams(window.location.search).get("redirect_to");
    if (redirect && redirect.startsWith("/") && !redirect.startsWith("//")) {
      window.history.replaceState(null, "", redirect);
      return redirect;
    }
    return window.location.pathname;
  });

  useEffect(() => {
    const onPop = () => setPath(window.location.pathname);
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  return [path, setPath] as const;
}

function readLiked(key: string): string[] {
  try {
    const raw = localStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function Reveal({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  key?: React.Key;
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

function Marquee({ topics }: { topics: string[] }) {
  const content = (
    <div className="flex shrink-0 items-center">
      {topics.map((topic) => (
        <span key={topic} className="flex items-center">
          <span className="px-5 font-display text-[12px] font-semibold uppercase tracking-[0.24em] text-white/45 sm:px-6 sm:text-sm">
            {topic}
          </span>
          <Asterisk className="h-3 w-3 text-[#c8ff4d]/70" />
        </span>
      ))}
    </div>
  );

  return (
    <div className="relative overflow-hidden border-y border-white/10 bg-[#070709] py-3.5">
      <div className="animate-marquee">
        {content}
        {content}
        {content}
        {content}
      </div>
      <div className="pointer-events-none absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-[#070709] to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-20 bg-gradient-to-l from-[#070709] to-transparent" />
    </div>
  );
}

function LatestStories({
  stories,
  loading,
  error,
  query,
  category,
  onQuery,
  onCategory,
  onOpen,
  onRetry,
}: {
  stories: Story[];
  loading: boolean;
  error: boolean;
  query: string;
  category: string;
  onQuery: (value: string) => void;
  onCategory: (value: string) => void;
  onOpen: (story: Story) => void;
  onRetry: () => void;
}) {
  const [visible, setVisible] = useState(30);

  const categories = useMemo(() => topCategories(stories, 9), [stories]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return stories.filter((story) => {
      const matchesCategory = category === "All" || story.categories.includes(category);
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
    <section id="latest" className="relative mx-auto max-w-7xl scroll-mt-24 px-4 py-20 sm:px-8 sm:py-24">
      <Reveal className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.24em] text-[#c8ff4d]">
            <Feather className="h-3 w-3" /> The latest
          </div>
          <h2 className="mt-4 max-w-2xl font-display text-4xl font-black tracking-[-0.03em] text-white sm:text-6xl">
            Fresh ink, sorted by newest.
          </h2>
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-white/45">
            Every story below was published in The Ink Home. Open one for the full reading experience, or jump
            to the original on Medium.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2 font-mono text-[9px] uppercase tracking-[0.16em] text-white/50">
          <span className={`h-1.5 w-1.5 rounded-full ${loading ? "animate-pulse bg-white/50" : error ? "bg-red-400" : "bg-[#c8ff4d]"}`} />
          {loading ? "Syncing…" : error ? "Offline" : `${filtered.length} stories`}
        </div>
      </Reveal>

      <Reveal delay={0.05} className="mt-10">
        <div className="flex flex-col gap-4 border-y border-white/10 py-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-1.5">
            {["All", ...categories].map((tag) => {
              const active = category === tag;
              return (
                <button
                  key={tag}
                  onClick={() => onCategory(tag)}
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
              onChange={(event) => onQuery(event.target.value)}
              placeholder="Search stories or writers"
              className="w-full bg-transparent text-[12px] text-white placeholder:text-white/25 focus:outline-none"
            />
            {query && (
              <button
                onClick={() => onQuery("")}
                className="font-mono text-[9px] uppercase tracking-[0.1em] text-white/40 hover:text-white"
              >
                Clear
              </button>
            )}
          </label>
        </div>
      </Reveal>

      {loading && stories.length === 0 ? (
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true" aria-live="polite">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="animate-pulse overflow-hidden rounded-2xl border border-white/10 bg-[#0b0c0f]">
              <div className="aspect-[16/10] w-full bg-white/[0.05]" />
              <div className="space-y-3 p-5">
                <div className="h-3 w-20 rounded bg-white/[0.06]" />
                <div className="h-5 w-4/5 rounded bg-white/[0.08]" />
                <div className="h-3 w-full rounded bg-white/[0.05]" />
                <div className="h-3 w-2/3 rounded bg-white/[0.05]" />
              </div>
            </div>
          ))}
        </div>
      ) : error && stories.length === 0 ? (
        <div
          role="alert"
          className="mt-12 flex flex-col items-center gap-4 rounded-2xl border border-dashed border-white/15 px-6 py-16 text-center"
        >
          <p className="font-display text-2xl font-bold text-white">We couldn't reach the publication.</p>
          <p className="max-w-md text-sm leading-relaxed text-white/60">
            The stories live on Medium and are synced from their feed. Check your connection and try again — the
            archive is always waiting.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={onRetry}
              className="flex items-center gap-2 rounded-full bg-white px-5 py-3 text-[11px] font-bold uppercase tracking-[0.16em] text-black transition-colors hover:bg-[#c8ff4d]"
            >
              <RefreshCw className="h-4 w-4" /> Try again
            </button>
            <a
              href={PUBLICATION_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-full border border-white/15 px-5 py-3 text-[11px] font-bold uppercase tracking-[0.16em] text-white/70 transition-colors hover:border-white/40 hover:text-white"
            >
              Open on Medium <ArrowUpRight className="h-4 w-4" />
            </a>
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="mt-12 flex flex-col items-center gap-4 rounded-2xl border border-dashed border-white/15 py-16 text-center">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/60">No stories match that search</p>
          <button
            onClick={() => {
              onQuery("");
              onCategory("All");
            }}
            className="rounded-full border border-white/15 px-4 py-2 font-mono text-[9px] uppercase tracking-[0.14em] text-white/70 hover:text-white"
          >
            Reset filters
          </button>
        </div>
      ) : (
        <>
          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.slice(0, visible).map((story, index) => (
              <Reveal key={story.slug} delay={Math.min((index % 3) * 0.05, 0.2)} className="h-full">
                <StoryCard story={story} onOpen={onOpen} />
              </Reveal>
            ))}
          </div>

          <div className="mt-10 flex flex-col items-center gap-3">
            <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-white/30">
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
    </section>
  );
}

function EditorsSection({ editors, stories }: { editors: Person[]; stories: Story[] }) {
  return (
    <section id="editors" className="relative scroll-mt-24 border-y border-white/10 bg-[#0a0b0d]">
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-8 sm:py-24">
        <Reveal className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.24em] text-[#c8ff4d]">
              <PenLine className="h-3 w-3" /> The editors
            </div>
            <h2 className="mt-4 font-display text-4xl font-black tracking-[-0.03em] text-white sm:text-6xl">
              The people keeping the ink wet.
            </h2>
          </div>
          <p className="max-w-sm text-sm leading-relaxed text-white/45">
            Curating every dispatch, shaping the publication's voice, and making sure the good sentences survive
            the edit.
          </p>
        </Reveal>

        <div className="mt-10 grid gap-4 md:grid-cols-2">
          {editors.map((editor, index) => {
            const count = stories.filter((story) => story.author === editor.name).length;
            return (
              <Reveal key={editor.name} delay={index * 0.08}>
                <div className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0b0c0f] p-6 transition-colors hover:border-white/25 sm:p-8">
                  <div
                    className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-50"
                    style={{ backgroundColor: index === 0 ? "rgba(200,255,77,0.35)" : "rgba(167,139,250,0.35)" }}
                  />
                  <div className="relative flex items-start justify-between">
                    <span className="font-mono text-[10px] tracking-[0.18em] text-white/25">
                      0{index + 1}
                    </span>
                    <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-white/30">
                      {count} {count === 1 ? "story" : "stories"}
                    </span>
                  </div>

                  <div className="relative mt-6 flex items-center gap-4">
                    <AuthorAvatar
                      name={editor.name}
                      src={editor.avatar}
                      className="h-16 w-16 rounded-full text-[16px] sm:h-20 sm:w-20"
                    />
                    <div className="min-w-0">
                      <h3 className="font-display text-2xl font-bold tracking-tight text-white">{editor.name}</h3>
                      <p className="mt-0.5 text-[11px] leading-snug text-[#c8ff4d]">{editor.role}</p>
                      {typeof editor.followers === "number" && (
                        <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.14em] text-white/30">
                          {editor.followers.toLocaleString()} followers on Medium
                        </p>
                      )}
                    </div>
                  </div>

                  {editor.bio && (
                    <p className="relative mt-5 text-[13px] leading-relaxed text-white/45">{editor.bio}</p>
                  )}

                  <div className="relative mt-auto flex items-center justify-between border-t border-white/10 pt-4">
                    <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-white/30">
                      Editorial desk
                    </span>
                    {editor.mediumUrl ? (
                      <a
                        href={editor.mediumUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.16em] text-white/55 transition-colors hover:text-[#c8ff4d]"
                      >
                        Medium profile <ArrowUpRight className="h-3 w-3" />
                      </a>
                    ) : (
                      <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-white/25">
                        The Ink Home
                      </span>
                    )}
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function ContributorsSection({
  editors,
  writers,
  stories,
  onSelect,
}: {
  editors: Person[];
  writers: Person[];
  stories: Story[];
  onSelect: (name: string) => void;
}) {
  const [showAll, setShowAll] = useState(false);

  const contributors = useMemo(() => {
    const map = new Map<string, Person & { count: number }>();
    writers.forEach((writer) => {
      map.set(writer.name.toLowerCase(), { ...writer, count: 0 });
    });

    stories.forEach((story) => {
      const key = story.author.toLowerCase();
      const existing = map.get(key);
      if (existing) {
        existing.count += 1;
        if (!existing.avatar && story.avatar) existing.avatar = story.avatar;
        if (!existing.role && story.role) existing.role = story.role;
      } else {
        map.set(key, {
          name: story.author,
          role: story.role || "Contributor",
          avatar: story.avatar,
          count: 1,
        });
      }
    });

    const editorNames = new Set(editors.map((editor) => editor.name.toLowerCase()));
    return Array.from(map.values())
      .filter((person) => !editorNames.has(person.name.toLowerCase()))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
  }, [editors, writers, stories]);

  const visible = showAll ? contributors : contributors.slice(0, 12);

  return (
    <section id="writers" className="mx-auto max-w-7xl scroll-mt-24 px-4 py-20 sm:px-8 sm:py-24">
      <Reveal className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.24em] text-[#c8ff4d]">
            <Users className="h-3 w-3" /> The writers
          </div>
          <h2 className="mt-4 font-display text-4xl font-black tracking-[-0.03em] text-white sm:text-6xl">
            Every voice in the room.
          </h2>
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-white/45">
            Essayists, researchers, engineers and storytellers. Select a writer to see their work in the
            publication.
          </p>
        </div>
        <span className="shrink-0 font-mono text-[9px] uppercase tracking-[0.18em] text-white/30">
          {contributors.length} contributors
        </span>
      </Reveal>

      <div className="mt-10 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {visible.map((person, index) => (
          <Reveal key={person.name} delay={Math.min((index % 4) * 0.04, 0.16)}>
            <button
              onClick={() => {
                if (person.count > 0) onSelect(person.name);
                else if (person.mediumUrl) window.open(person.mediumUrl, "_blank", "noopener,noreferrer");
              }}
              className="group flex h-full w-full items-start gap-3 rounded-xl border border-white/10 bg-[#0b0c0f] p-4 text-left transition-colors hover:border-white/25"
            >
              <AuthorAvatar
                name={person.name}
                src={person.avatar}
                className="h-11 w-11 rounded-full text-[11px]"
              />
              <span className="min-w-0 flex-1">
                <span className="flex items-start justify-between gap-2">
                  <span className="font-display text-[14px] font-semibold leading-snug text-white line-clamp-1">
                    {person.name}
                  </span>
                  <ArrowUpRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-white/20 transition-all duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-white/70" />
                </span>
                <span className="mt-0.5 block truncate text-[10px] text-white/35">{person.role}</span>
                {person.bio && (
                  <span className="mt-2 line-clamp-2 block text-[11px] leading-relaxed text-white/30">
                    {person.bio}
                  </span>
                )}
                <span className="mt-2 flex items-center gap-1.5 font-mono text-[8px] uppercase tracking-[0.14em] text-white/30">
                  <span className={`h-1 w-1 rounded-full ${person.count ? "bg-[#c8ff4d]" : "bg-white/20"}`} />
                  {person.count > 0
                    ? `${person.count} ${person.count === 1 ? "story" : "stories"}`
                    : person.mediumUrl
                      ? "Read on Medium"
                      : "Contributor"}
                </span>
              </span>
            </button>
          </Reveal>
        ))}
      </div>

      {contributors.length > 12 && (
        <div className="mt-8 flex justify-center">
          <button
            onClick={() => setShowAll((value) => !value)}
            className="flex items-center gap-2 rounded-full border border-white/15 px-5 py-2.5 font-mono text-[9px] uppercase tracking-[0.16em] text-white/55 transition-colors hover:border-white/35 hover:text-white"
          >
            {showAll ? "Show fewer writers" : `Show all ${contributors.length} writers`}
            <ArrowRight className={`h-3 w-3 transition-transform ${showAll ? "-rotate-90" : ""}`} />
          </button>
        </div>
      )}
    </section>
  );
}

function AboutSection({
  about,
  storyCount,
  contributorCount,
  onNavigate,
}: {
  about: AboutData;
  storyCount: number;
  contributorCount: number;
  onNavigate: (path: string) => void;
}) {
  return (
    <section id="about" className="relative scroll-mt-24 overflow-hidden border-y border-white/10 bg-[#0a0b0d]">
      <div
        className="pointer-events-none absolute inset-0 opacity-70"
        style={{
          background:
            "radial-gradient(ellipse 50% 70% at 90% 0%, rgba(200,255,77,0.10), transparent 60%), radial-gradient(ellipse 40% 60% at 0% 100%, rgba(167,139,250,0.10), transparent 60%)",
        }}
      />
      <div className="relative mx-auto grid max-w-7xl gap-12 px-4 py-20 sm:px-8 sm:py-24 lg:grid-cols-[1.1fr_0.9fr]">
        <Reveal>
          <div className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.24em] text-[#c8ff4d]">
            <BookOpen className="h-3 w-3" /> About the publication
          </div>
          <h2 className="mt-4 max-w-2xl font-display text-4xl font-black leading-[0.98] tracking-[-0.03em] text-white sm:text-6xl">
            A home for writing that takes its time.
          </h2>
          <p className="mt-6 max-w-xl text-[15px] leading-relaxed text-white/50">
            {about.description}
          </p>

          <blockquote className="mt-8 border-l-2 border-[#c8ff4d] pl-5">
            <Quote className="h-4 w-4 text-[#c8ff4d]" />
            <p className="mt-2 max-w-lg font-display text-xl font-medium italic leading-snug text-white/80 sm:text-2xl">
              Good writing is a form of hospitality. We keep the light on, the chair warm, and the page open.
            </p>
            <footer className="mt-3 font-mono text-[9px] uppercase tracking-[0.18em] text-white/30">
              The Ink Home editorial desk
            </footer>
          </blockquote>

          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href="https://medium.com/the-ink-home"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-2 rounded-full bg-white px-5 py-3 text-[11px] font-bold uppercase tracking-[0.16em] text-black transition-colors hover:bg-[#c8ff4d]"
            >
              Visit us on Medium
              <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </a>
            <button
              onClick={() => onNavigate("/#latest")}
              className="flex items-center gap-2 rounded-full border border-white/15 px-5 py-3 text-[11px] font-bold uppercase tracking-[0.16em] text-white/70 transition-colors hover:border-white/40 hover:text-white"
            >
              Browse the archive
            </button>
          </div>
        </Reveal>

        <Reveal delay={0.1}>
          <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10">
            {[
              [String(storyCount), "Stories on site"],
              [String(contributorCount), "Contributors"],
              ["10 min", "Refresh cadence"],
              ["2026", "Vol. 07"],
            ].map(([value, label]) => (
              <div key={label} className="bg-[#0a0b0d] px-5 py-6 sm:px-6 sm:py-7">
                <div className="font-display text-3xl font-bold text-white sm:text-4xl">{value}</div>
                <div className="mt-1 font-mono text-[9px] uppercase tracking-[0.16em] text-white/35">{label}</div>
              </div>
            ))}
          </div>

          <div className="mt-4 rounded-2xl border border-white/10 bg-[#0b0c0f] p-5">
            <div className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.18em] text-white/35">
              <Sparkles className="h-3 w-3 text-[#c8ff4d]" /> What we publish
            </div>
            <div className="mt-4 flex flex-wrap gap-1.5">
              {[
                "Essays",
                "Technology",
                "Culture",
                "Creativity",
                "Productivity",
                "Relationships",
                "Mental health",
                "Personal stories",
              ].map((topic) => (
                <span
                  key={topic}
                  className="rounded-full border border-white/10 px-2.5 py-1 font-mono text-[8px] uppercase tracking-[0.12em] text-white/45"
                >
                  {topic}
                </span>
              ))}
            </div>
            <p className="mt-4 text-[12px] leading-relaxed text-white/35">
              Have something honest to say? We read every submission. Write to us at{" "}
              <a href="mailto:hello@theinkhome.com" className="text-white/60 hover:text-[#c8ff4d]">
                hello@theinkhome.com
              </a>
              .
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function SubscribeSection({ onNavigate }: { onNavigate: (path: string) => void }) {
  return (
    <section id="subscribe" className="scroll-mt-24 px-4 py-20 sm:px-8 sm:py-24">
      <Reveal className="mx-auto max-w-7xl">
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#0b0c0f] px-6 py-14 sm:px-12 sm:py-20">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-80"
            style={{
              background:
                "radial-gradient(ellipse 60% 100% at 80% 0%, rgba(200,255,77,0.18), transparent 60%), radial-gradient(ellipse 50% 80% at 10% 100%, rgba(167,139,250,0.16), transparent 60%)",
            }}
          />
          <div className="relative grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
            <div>
              <span className="font-mono text-[9px] uppercase tracking-[0.24em] text-white/60">Stay in the loop</span>
              <h2 className="mt-4 max-w-2xl font-display text-4xl font-black leading-[0.96] tracking-[-0.035em] text-white sm:text-6xl">
                New stories land here first. Follow along.
              </h2>
              <p className="mt-5 max-w-xl text-sm leading-relaxed text-white/65">
                Every essay we publish goes out on Medium. Follow The Ink Home and each new piece arrives in your
                reading feed — no inbox required, no algorithm tax.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <button
                  onClick={() => onNavigate("/#latest")}
                  className="rounded-full border border-white/25 px-5 py-3 text-[11px] font-bold uppercase tracking-[0.16em] text-white/85 transition-colors hover:border-white/60 hover:text-white"
                >
                  Browse the archive
                </button>
                <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-white/50">
                  Free · Always open access
                </span>
              </div>
            </div>

            <div className="rounded-2xl border border-white/15 bg-black/40 p-6 backdrop-blur">
              <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-white/60">
                Medium publication
              </span>
              <p className="mt-3 text-sm leading-relaxed text-white/70">
                Follow <span className="font-semibold text-white">The Ink Home</span> to get every new story in
                your Medium feed, and to help other readers find us.
              </p>
              <a
                href={`${PUBLICATION_URL}/subscribe`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-[#c8ff4d] px-5 py-3 text-[11px] font-bold uppercase tracking-[0.16em] text-black transition-transform hover:-translate-y-0.5"
              >
                Follow on Medium <ArrowUpRight className="h-4 w-4" />
              </a>
              <a
                href={PUBLICATION_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-full border border-white/20 px-5 py-3 text-[11px] font-bold uppercase tracking-[0.16em] text-white/80 transition-colors hover:border-white/50 hover:text-white"
              >
                Visit the publication <ArrowRight className="h-4 w-4" />
              </a>
              <p className="mt-4 text-center font-mono text-[8px] uppercase tracking-[0.14em] text-white/50">
                Published by The Ink Home editors
              </p>
              <div className="mt-6">
                <NewsletterSignup />
              </div>
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}

function StoryNotFound({ loading, onNavigate }: { loading: boolean; onNavigate: (path: string) => void }) {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 pt-24 text-center">
      {loading ? (
        <>
          <div className="h-6 w-6 animate-spin rounded-full border border-white/15 border-t-[#c8ff4d]" />
          <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.2em] text-white/40">
            Pulling the story from Medium…
          </p>
        </>
      ) : (
        <>
          <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-[#c8ff4d]">404 — Page not found</span>
          <h1 className="mt-4 max-w-2xl font-display text-4xl font-black tracking-tight text-white sm:text-6xl">
            This page has wandered off.
          </h1>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-white/45">
            The story may have moved, or the link is incomplete. The full archive is always waiting back home.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => onNavigate("/")}
              className="rounded-full bg-white px-5 py-3 text-[11px] font-bold uppercase tracking-[0.16em] text-black hover:bg-[#c8ff4d]"
            >
              Back to the publication
            </button>
            <a
              href="https://medium.com/the-ink-home"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-full border border-white/15 px-5 py-3 text-[11px] font-bold uppercase tracking-[0.16em] text-white/70 hover:border-white/40 hover:text-white"
            >
              Search on Medium <ArrowUpRight className="h-4 w-4" />
            </a>
          </div>
        </>
      )}
    </div>
  );
}

export default function App() {
  const [path, setPath] = useCurrentPath();
  const [scrollTarget, setScrollTarget] = useState<string | null>(null);
  const [stories, setStories] = useState<Story[]>([]);
  const [about, setAbout] = useState<AboutData>(FALLBACK_ABOUT as AboutData);
  const [loading, setLoading] = useState(true);
  const [storyError, setStoryError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [live, setLive] = useState(false);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [liked, setLiked] = useState<string[]>(() => readLiked("the-ink-home:liked"));
  const [saved, setSaved] = useState<string[]>(() => readLiked("the-ink-home:saved"));

  const navigate = useCallback(
    (to: string) => {
      const [rawPath, hash] = to.split("#");
      const target = rawPath === "" ? "/" : rawPath;

      if (window.location.pathname !== target) {
        window.history.pushState(null, "", to);
        setPath(target);
      } else {
        window.history.replaceState(null, "", to);
      }

      if (hash) {
        setScrollTarget(hash);
      } else {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    },
    [setPath],
  );

  useEffect(() => {
    if (!scrollTarget) return;
    const timer = window.setTimeout(() => {
      document.getElementById(scrollTarget)?.scrollIntoView({ behavior: "smooth", block: "start" });
      setScrollTarget(null);
    }, 140);
    return () => window.clearTimeout(timer);
  }, [scrollTarget, path]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [path]);

  useEffect(() => {
    localStorage.setItem("the-ink-home:liked", JSON.stringify(liked));
  }, [liked]);

  useEffect(() => {
    localStorage.setItem("the-ink-home:saved", JSON.stringify(saved));
  }, [saved]);

  useEffect(() => {
    let cancelled = false;
    setStoryError(false);
    setLoading(true);

    try {
      const cachedAt = Number(localStorage.getItem(STORY_CACHE_TIME) || 0);
      const raw = localStorage.getItem(STORY_CACHE_KEY);
      if (raw && Date.now() - cachedAt < CACHE_TTL) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setStories(parsed.slice(0, 60));
          setLive(true);
          setLoading(false);
        }
      }
    } catch {
      /* ignore corrupt cache */
    }

    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), 18000);

    async function load() {
      try {
        const [storiesResponse, aboutResponse] = await Promise.all([
          fetch("/api/stories", { signal: controller.signal, cache: "no-store" }),
          fetch("/api/about", { signal: controller.signal }),
        ]);

        if (!storiesResponse.ok) throw new Error(`Stories request failed: ${storiesResponse.status}`);

        const storyPayload = await storiesResponse.json();
        const incoming: Story[] = Array.isArray(storyPayload?.stories) ? storyPayload.stories : [];
        if (incoming.length === 0) throw new Error("Stories feed returned no stories");

        if (!cancelled) {
          const trimmed = incoming.slice(0, 60);
          setStories(trimmed);
          setLive(true);
          setStoryError(false);
          try {
            localStorage.setItem(STORY_CACHE_KEY, JSON.stringify(trimmed));
            localStorage.setItem(STORY_CACHE_TIME, String(Date.now()));
          } catch {
            /* storage full */
          }
        }

        if (!cancelled && aboutResponse.ok) {
          const aboutPayload = await aboutResponse.json();
          if (aboutPayload?.editors?.length) {
            setAbout({
              description: aboutPayload.description || FALLBACK_ABOUT.description,
              officialWebsite: aboutPayload.officialWebsite || FALLBACK_ABOUT.officialWebsite,
              editors: aboutPayload.editors,
              writers: aboutPayload.writers || [],
            });
          }
        }
      } catch {
        if (!cancelled) setStoryError(true);
      } finally {
        window.clearTimeout(timer);
        if (!cancelled) setLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [reloadKey]);

  const topics = useMemo(() => {
    const derived = topCategories(stories, 11);
    const merged = [...derived];
    DEFAULT_TOPICS.forEach((topic) => {
      if (!merged.includes(topic)) merged.push(topic);
    });
    return merged.slice(0, 12);
  }, [stories]);

  const contributorCount = useMemo(() => {
    const names = new Set<string>();
    stories.forEach((story) => names.add(story.author.toLowerCase()));
    about.writers.forEach((writer) => names.add(writer.name.toLowerCase()));
    return names.size;
  }, [stories, about.writers]);

  const storySlug = path.startsWith("/story/") ? decodeURIComponent(path.replace("/story/", "")) : null;
  const activeStory = storySlug ? stories.find((story) => story.slug === storySlug) : undefined;

  const authorMatch = path.match(/^\/writer\/([^/]+)$/);
  const authorSlug = authorMatch ? decodeURIComponent(authorMatch[1]) : null;
  const authorCandidates = [...about.writers, ...about.editors];
  const authorPerson =
    authorSlug === null
      ? null
      : authorCandidates.find((person) => {
          const key = String(person.name || "")
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/(^-|-$)/g, "");
          const needle = authorSlug.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
          return key === needle;
        }) || null;
  const authorStories = authorPerson
    ? stories.filter((story) => {
        const key = String(story.author || "")
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, "");
        const authorKey = String(authorPerson.name || "")
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, "");
        return key === authorKey;
      })
    : [];

  useEffect(() => {
    const description = document.querySelector('meta[name="description"]');
    const ogTitle = document.querySelector('meta[property="og:title"]');
    const ogDesc = document.querySelector('meta[property="og:description"]');
    const ogImg = document.querySelector('meta[property="og:image"]');
    const ogType = document.querySelector('meta[property="og:type"]');
    const twitterCard = document.querySelector('meta[name="twitter:card"]');
    const twitterTitle = document.querySelector('meta[name="twitter:title"]');
    const twitterDesc = document.querySelector('meta[name="twitter:description"]');
    const twitterImg = document.querySelector('meta[name="twitter:image"]');

    const baseDescriptions: Record<string, string> = {
      "/": "The Ink Home — Where Words Feel at Home",
      "/stories": "Stories | The Ink Home",
      "/writers": "Writers | The Ink Home",
      "/about": "About | The Ink Home",
    };

    const baseOgData: Record<string, { title: string; description: string; image: string }> = {
      "/": {
        title: "The Ink Home",
        description: "An independent Medium publication of essays on technology, culture, creativity, relationships and the quiet parts of being human.",
        image: "/assets/The_Ink_Home.webp",
      },
      "/stories": {
        title: "Stories | The Ink Home",
        description: "An independent Medium publication of essays on technology, culture, creativity, relationships and the quiet parts of being human.",
        image: "/assets/The_Ink_Home.webp",
      },
      "/writers": {
        title: "Writers | The Ink Home",
        description: "Meet the writers and editors of The Ink Home publication.",
        image: "/assets/The_Ink_Home.webp",
      },
      "/about": {
        title: "About | The Ink Home",
        description: "Learn about The Ink Home publication, our editors, submission guidelines, and writing specs.",
        image: "/assets/The_Ink_Home.webp",
      },
    };

    const defaultOg = baseOgData["/"];

    if (activeStory) {
      document.title = `${activeStory.title} | The Ink Home`;
      description?.setAttribute(
        "content",
        activeStory.description || "A story from The Ink Home on Medium.",
      );
      ogTitle?.setAttribute("content", `${activeStory.title} | The Ink Home`);
      ogDesc?.setAttribute("content", activeStory.description || "A story from The Ink Home on Medium.");
       ogImg?.setAttribute("content", activeStory?.cover || "/assets/The_Ink_Home.webp");
      ogType?.setAttribute("content", "article");
      twitterCard?.setAttribute("content", "summary_large_image");
      twitterTitle?.setAttribute("content", `${activeStory.title} | The Ink Home`);
      twitterDesc?.setAttribute(
        "content",
        activeStory.description || "A story from The Ink Home on Medium.",
      );
       twitterImg?.setAttribute("content", activeStory?.cover || "/assets/The_Ink_Home.webp");
    } else if (baseDescriptions[path]) {
      document.title = baseDescriptions[path];
      description?.setAttribute("content", baseDescriptions[path]);
      ogTitle?.setAttribute("content", baseOgData[path]?.title || defaultOg.title);
      ogDesc?.setAttribute("content", baseOgData[path]?.description || defaultOg.description);
      ogImg?.setAttribute("content", baseOgData[path]?.image || defaultOg.image);
      ogType?.setAttribute("content", "website");
      twitterCard?.setAttribute("content", "summary_large_image");
      twitterTitle?.setAttribute("content", baseOgData[path]?.title || defaultOg.title);
      twitterDesc?.setAttribute("content", baseOgData[path]?.description || defaultOg.description);
      twitterImg?.setAttribute("content", baseOgData[path]?.image || defaultOg.image);
    } else {
      document.title = "The Ink Home — Where Words Feel at Home";
      description?.setAttribute("content", defaultOg.description);
      ogTitle?.setAttribute("content", defaultOg.title);
      ogDesc?.setAttribute("content", defaultOg.description);
      ogImg?.setAttribute("content", defaultOg.image);
      ogType?.setAttribute("content", "website");
      twitterCard?.setAttribute("content", "summary_large_image");
      twitterTitle?.setAttribute("content", defaultOg.title);
      twitterDesc?.setAttribute("content", defaultOg.description);
      twitterImg?.setAttribute("content", defaultOg.image);
    }
  }, [activeStory, path]);

  const openStory = (story: Story) => navigate(`/story/${encodeURIComponent(story.slug)}`);

  const selectContributor = (name: string) => {
    setQuery(name);
    setCategory("All");
    navigate("/#latest");
  };

  const toggleLiked = (slug: string) => {
    setLiked((current) => (current.includes(slug) ? current.filter((item) => item !== slug) : [...current, slug]));
  };

  const toggleSaved = (slug: string) => {
    setSaved((current) => (current.includes(slug) ? current.filter((item) => item !== slug) : [...current, slug]));
  };

  return (
    <div className="min-h-screen bg-[#08080a] text-white selection:bg-[#c8ff4d] selection:text-black">
      <Analytics />
      <SiteHeader
        onNavigate={navigate}
        onOpenStory={() => {
          navigate("/#latest");
        }}
      />

      <Suspense fallback={<RouteFallback />}>
        <AIAssistant
          storyContext={activeStory}
          pageContext={activeStory ? "reading" : path === "/writers" ? "profile" : "browse"}
        />
      </Suspense>

      <main id="main">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeStory ? activeStory.slug : path}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.28 }}
          >
            <Suspense fallback={<RouteFallback />}>
            {activeStory ? (
              <ReadingPage
                story={activeStory}
                stories={stories}
                editors={about.editors}
                writers={about.writers}
                liked={liked.includes(activeStory.slug)}
                saved={saved.includes(activeStory.slug)}
                onToggleLike={toggleLiked}
                onToggleSave={toggleSaved}
                onBack={() => navigate("/")}
                onOpenStory={openStory}
                onNavigate={navigate}
              />
            ) : path === "/stories" ? (
              <StoriesPage
                stories={stories}
                loading={loading && !live}
                error={storyError}
                onOpen={openStory}
                onRetry={() => setReloadKey((key) => key + 1)}
              />
            ) : path === "/writers" ? (
              <WritersPage
                editors={about.editors}
                writers={about.writers}
                stories={stories}
                onSelect={selectContributor}
              />
            ) : path === "/about" ? (
              <AboutPage
                about={about}
                storyCount={stories.length}
                contributorCount={contributorCount}
                onNavigate={navigate}
              />
            ) : path === "/privacy" ? (
              <LegalPage kind="privacy" onBack={() => navigate("/about")} />
            ) : path === "/terms" ? (
              <LegalPage kind="terms" onBack={() => navigate("/about")} />
            ) : path === "/editorial" ? (
              <LegalPage kind="editorial" onBack={() => navigate("/about")} />
            ) : authorSlug ? (
              <AuthorPage person={authorPerson} stories={authorStories} onBack={() => navigate("/writers")} onOpen={openStory} />
            ) : path === "/saved" ? (
              <SavedPage stories={stories.filter((story) => saved.includes(story.slug))} onBack={() => navigate("/#latest")} onOpen={openStory} />
            ) : storySlug ? (
              <StoryNotFound loading={loading} onNavigate={navigate} />
            ) : (
              <>
                <EnhancedHero
                  storyCount={stories.length}
                  contributorCount={contributorCount}
                  loading={loading && !live}
                  onNavigate={navigate}
                />

                <FeaturedStory story={stories[0]} loading={loading && !live} onOpen={openStory} />

                <Marquee topics={topics} />

                <LatestStories
                  stories={stories}
                  loading={loading && !live}
                  error={storyError}
                  query={query}
                  category={category}
                  onQuery={setQuery}
                  onCategory={setCategory}
                  onOpen={openStory}
                  onRetry={() => setReloadKey((key) => key + 1)}
                />

                <EditorsSection editors={about.editors} stories={stories} />

                <ContributorsSection
                  editors={about.editors}
                  writers={about.writers}
                  stories={stories}
                  onSelect={selectContributor}
                />

                <AboutSection
                  about={about}
                  storyCount={stories.length}
                  contributorCount={contributorCount}
                  onNavigate={navigate}
                />

                <SubscribeSection onNavigate={navigate} />
              </>
            )}
            </Suspense>
          </motion.div>
        </AnimatePresence>
      </main>

      <SiteFooter onNavigate={navigate} />
    </div>
  );
}
