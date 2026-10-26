import React, { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Asterisk,
  BookOpen,
  Check,
  Clock,
  Feather,
  Mail,
  PenLine,
  Quote,
  Search,
  Sparkles,
  Users,
} from "lucide-react";
import SiteHeader from "./components/SiteHeader";
import SiteFooter from "./components/SiteFooter";
import ReadingPage from "./components/ReadingPage";
import { StoryCard } from "./components/StoryCard";
import StoryCover from "./components/StoryCover";
import AuthorAvatar from "./components/AuthorAvatar";
import { FALLBACK_STORIES } from "./data/fallbackStories";
import { FALLBACK_ABOUT } from "./data/fallbackAbout";
import { Story } from "./types";
import { formatDate, readingTime, stripHtml, topCategories } from "./lib/format";
import StoriesPage from "./pages/StoriesPage";
import WritersPage from "./pages/WritersPage";
import AboutPage from "./pages/AboutPage";
import AIAssistant from "./components/AIAssistant";

const EASE = [0.16, 1, 0.3, 1] as const;
const STORY_CACHE_KEY = "the-ink-home:stories:v4";
const STORY_CACHE_TIME = "the-ink-home:stories:v4:time";
const CACHE_TTL = 1000 * 60 * 20;

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
  const [path, setPath] = useState(() => window.location.pathname);

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

function Hero({
  featured,
  storyCount,
  contributorCount,
  loading,
  onOpen,
  onNavigate,
}: {
  featured?: Story;
  storyCount: number;
  contributorCount: number;
  loading: boolean;
  onOpen: (story: Story) => void;
  onNavigate: (path: string) => void;
}) {
  return (
    <section className="relative overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 15% 0%, rgba(200,255,77,0.10), transparent 62%), radial-gradient(ellipse 45% 55% at 95% 10%, rgba(167,139,250,0.10), transparent 65%)",
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)",
          backgroundSize: "72px 72px",
          maskImage: "radial-gradient(ellipse at 50% 30%, black, transparent 78%)",
        }}
      />

      <div className="relative mx-auto max-w-7xl px-4 pb-16 pt-28 sm:px-8 sm:pb-20 sm:pt-36">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: EASE }}
          className="flex flex-wrap items-center gap-3"
        >
          <span className="flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.03] px-3 py-1.5 font-mono text-[9px] uppercase tracking-[0.22em] text-white/55">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#c8ff4d] opacity-60" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#c8ff4d]" />
            </span>
            A Medium publication · Words feel at home
          </span>
          <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-white/25">
            {loading ? "Syncing with Medium…" : `${storyCount} latest stories`}
          </span>
        </motion.div>

        <div className="mt-7 grid items-center gap-10 lg:grid-cols-[1.02fr_0.98fr] lg:gap-14">
          <div>
            <motion.h1
              initial={{ opacity: 0, y: 22 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.85, delay: 0.08, ease: EASE }}
              className="font-display text-[clamp(2.7rem,7.2vw,5.4rem)] font-black leading-[0.92] tracking-[-0.05em] text-white"
            >
              Where words feel{" "}
              <span className="relative inline-block italic text-[#c8ff4d]">
                at home
                <svg
                  className="absolute -bottom-1 left-0 w-full"
                  viewBox="0 0 200 12"
                  fill="none"
                  preserveAspectRatio="none"
                >
                  <path
                    d="M2 9C40 3 80 3 110 6C140 9 170 8 198 4"
                    stroke="#c8ff4d"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                </svg>
              </span>.
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.18, ease: EASE }}
              className="mt-6 max-w-xl text-[15px] leading-relaxed text-white/55 sm:text-base"
            >
              An independent publication of essays on technology, culture, creativity and the quiet parts of
              being human. Thirty to fifty new stories, gathered straight from our Medium home.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.28, ease: EASE }}
              className="mt-8 flex flex-wrap items-center gap-3"
            >
              <button
                onClick={() => onNavigate("/#latest")}
                className="group flex items-center gap-2 rounded-full bg-white px-5 py-3 text-[11px] font-bold uppercase tracking-[0.16em] text-black transition-colors hover:bg-[#c8ff4d]"
              >
                Read the latest
                <ArrowDownRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:translate-y-0.5" />
              </button>
              <button
                onClick={() => onNavigate("/#writers")}
                className="flex items-center gap-2 rounded-full border border-white/15 px-5 py-3 text-[11px] font-bold uppercase tracking-[0.16em] text-white/70 transition-colors hover:border-white/40 hover:text-white"
              >
                Meet the writers
                <ArrowUpRight className="h-4 w-4" />
              </button>
            </motion.div>

            <motion.dl
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.9, delay: 0.45 }}
              className="mt-10 grid max-w-lg grid-cols-3 gap-6 border-t border-white/10 pt-6"
            >
              {[
                [String(storyCount).padStart(2, "0"), "Latest stories"],
                [String(contributorCount).padStart(2, "0"), "Contributors"],
                ["Weekly", "New dispatches"],
              ].map(([value, label]) => (
                <div key={label}>
                  <dt className="font-display text-2xl font-bold text-white sm:text-3xl">{value}</dt>
                  <dd className="mt-0.5 font-mono text-[9px] uppercase tracking-[0.18em] text-white/35">{label}</dd>
                </div>
              ))}
            </motion.dl>
          </div>

          {featured && (
            <motion.button
              initial={{ opacity: 0, y: 30, rotate: 1.5 }}
              animate={{ opacity: 1, y: 0, rotate: 0 }}
              transition={{ duration: 0.9, delay: 0.2, ease: EASE }}
              whileHover={{ y: -6, rotate: -0.4 }}
              onClick={() => onOpen(featured)}
              className="group relative block w-full text-left"
            >
              <div
                className="pointer-events-none absolute -inset-8 rounded-full opacity-40 blur-3xl"
                style={{ background: "radial-gradient(circle, rgba(200,255,77,0.22), transparent 65%)" }}
              />
              <div className="relative aspect-[4/5] w-full overflow-hidden rounded-3xl border border-white/15 bg-[#101114] shadow-[0_40px_100px_-40px_rgba(0,0,0,0.95)] sm:aspect-[5/4] lg:aspect-[4/4.6]">
                <StoryCover
                  src={featured.cover}
                  alt={featured.title}
                  seed={featured.title}
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  priority
                  className="transition-transform duration-[900ms] group-hover:scale-[1.045]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/35 to-black/10" />
                <div className="absolute inset-x-0 top-0 flex items-center justify-between p-5">
                  <span className="flex items-center gap-2 rounded-full border border-[#c8ff4d]/30 bg-black/50 px-3 py-1.5 font-mono text-[8px] uppercase tracking-[0.2em] text-[#c8ff4d] backdrop-blur">
                    <Sparkles className="h-3 w-3" /> Featured
                  </span>
                  <span className="font-mono text-[8px] uppercase tracking-[0.2em] text-white/60">
                    {formatDate(featured.pubDate, "short")}
                  </span>
                </div>
                <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6">
                  <div className="flex flex-wrap gap-1.5">
                    {featured.categories.slice(0, 2).map((category) => (
                      <span
                        key={category}
                        className="rounded-full border border-white/20 bg-white/10 px-2 py-0.5 font-mono text-[8px] uppercase tracking-[0.14em] text-white/80 backdrop-blur"
                      >
                        {category}
                      </span>
                    ))}
                  </div>
                  <h2 className="mt-3 font-display text-2xl font-bold leading-[1.05] tracking-tight text-white sm:text-3xl">
                    {featured.title}
                  </h2>
                  <p className="mt-2 line-clamp-2 max-w-lg text-[12.5px] leading-relaxed text-white/55">
                    {stripHtml(featured.description)}
                  </p>
                  <div className="mt-4 flex items-center justify-between border-t border-white/15 pt-3">
                    <span className="flex items-center gap-2">
                      <AuthorAvatar
                        name={featured.author}
                        src={featured.avatar}
                        className="h-6 w-6 rounded-full text-[8px]"
                      />
                      <span className="text-[11px] text-white/70">{featured.author}</span>
                    </span>
                    <span className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.14em] text-white/45">
                      <Clock className="h-3 w-3" /> {readingTime(featured)} min
                      <ArrowUpRight className="ml-1 h-3.5 w-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                    </span>
                  </div>
                </div>
              </div>
            </motion.button>
          )}
        </div>
      </div>
    </section>
  );
}

function LatestStories({
  stories,
  loading,
  query,
  category,
  onQuery,
  onCategory,
  onOpen,
}: {
  stories: Story[];
  loading: boolean;
  query: string;
  category: string;
  onQuery: (value: string) => void;
  onCategory: (value: string) => void;
  onOpen: (story: Story) => void;
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
        <div className="flex shrink-0 items-center gap-2 font-mono text-[9px] uppercase tracking-[0.16em] text-white/30">
          <span className={`h-1.5 w-1.5 rounded-full ${loading ? "animate-pulse bg-white/50" : "bg-[#c8ff4d]"}`} />
          {loading ? "Syncing…" : `${filtered.length} stories`}
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

      {filtered.length === 0 ? (
        <div className="mt-12 flex flex-col items-center gap-4 rounded-2xl border border-dashed border-white/15 py-16 text-center">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/40">No stories match that search</p>
          <button
            onClick={() => {
              onQuery("");
              onCategory("All");
            }}
            className="rounded-full border border-white/15 px-4 py-2 font-mono text-[9px] uppercase tracking-[0.14em] text-white/60 hover:text-white"
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
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  return (
    <section id="subscribe" className="scroll-mt-24 px-4 py-20 sm:px-8 sm:py-24">
      <Reveal className="mx-auto max-w-7xl">
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#0b0c0f] px-6 py-14 sm:px-12 sm:py-20">
          <div
            className="pointer-events-none absolute inset-0 opacity-80"
            style={{
              background:
                "radial-gradient(ellipse 60% 100% at 80% 0%, rgba(200,255,77,0.18), transparent 60%), radial-gradient(ellipse 50% 80% at 10% 100%, rgba(167,139,250,0.16), transparent 60%)",
            }}
          />
          <div className="relative grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
            <div>
              <span className="font-mono text-[9px] uppercase tracking-[0.24em] text-white/40">The Sunday dispatch</span>
              <h2 className="mt-4 max-w-2xl font-display text-4xl font-black leading-[0.96] tracking-[-0.035em] text-white sm:text-6xl">
                One letter. Every Sunday. No noise.
              </h2>
              <p className="mt-5 max-w-xl text-sm leading-relaxed text-white/50">
                The week's best Ink Home stories, a note from the editors, and one idea worth carrying into
                Monday.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <button
                  onClick={() => onNavigate("/#latest")}
                  className="rounded-full border border-white/15 px-5 py-3 text-[11px] font-bold uppercase tracking-[0.16em] text-white/70 transition-colors hover:border-white/40 hover:text-white"
                >
                  Read this week's stories
                </button>
                <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-white/25">
                  Free · Unsubscribe anytime
                </span>
              </div>
            </div>

            <form
              onSubmit={(event) => {
                event.preventDefault();
                if (!email.trim()) return;
                setSubscribed(true);
                setEmail("");
                window.setTimeout(() => setSubscribed(false), 2800);
              }}
              className="rounded-2xl border border-white/10 bg-black/30 p-5 backdrop-blur"
            >
              <label
                htmlFor="dispatch-email"
                className="font-mono text-[9px] uppercase tracking-[0.2em] text-white/40"
              >
                Your email
              </label>
              <div className="mt-2 flex items-center gap-2 border-b border-white/15 pb-2 focus-within:border-white/40">
                <Mail className="h-4 w-4 shrink-0 text-white/30" />
                <input
                  id="dispatch-email"
                  type="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@studio.com"
                  className="w-full bg-transparent text-sm text-white placeholder:text-white/25 focus:outline-none"
                />
              </div>
              <button
                type="submit"
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-[#c8ff4d] px-5 py-3 text-[11px] font-bold uppercase tracking-[0.16em] text-black transition-transform hover:-translate-y-0.5"
              >
                {subscribed ? (
                  <>
                    You're on the list <Check className="h-4 w-4" />
                  </>
                ) : (
                  <>
                    Join the dispatch <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
              <p className="mt-3 text-center font-mono text-[8px] uppercase tracking-[0.14em] text-white/25">
                Sent from the editors, not a marketing bot
              </p>
            </form>
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
  const [stories, setStories] = useState<Story[]>(FALLBACK_STORIES);
  const [about, setAbout] = useState<AboutData>(FALLBACK_ABOUT as AboutData);
  const [loading, setLoading] = useState(true);
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

    try {
      const cachedAt = Number(localStorage.getItem(STORY_CACHE_TIME) || 0);
      const raw = localStorage.getItem(STORY_CACHE_KEY);
      if (raw && Date.now() - cachedAt < CACHE_TTL) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length >= 10) {
          setStories(parsed.slice(0, 50));
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

        if (!cancelled && incoming.length >= 10) {
          const trimmed = incoming.slice(0, 50);
          setStories(trimmed);
          setLive(true);
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
        /* keep fallback */
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
  }, []);

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

  useEffect(() => {
    const description = document.querySelector('meta[name="description"]');
    const pageTitles: Record<string, string> = {
      "/": "The Ink Home — Where Words Feel at Home",
      "/stories": "Stories | The Ink Home",
      "/writers": "Writers | The Ink Home",
      "/about": "About | The Ink Home",
    };
    const defaultDescription =
      "An independent Medium publication of essays on technology, culture, creativity, relationships and the quiet parts of being human.";

    if (activeStory) {
      document.title = `${activeStory.title} | The Ink Home`;
      description?.setAttribute(
        "content",
        activeStory.description || "A story from The Ink Home on Medium.",
      );
    } else if (pageTitles[path]) {
      document.title = pageTitles[path];
      description?.setAttribute("content", defaultDescription);
    } else {
      document.title = "The Ink Home — Where Words Feel at Home";
      description?.setAttribute("content", defaultDescription);
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
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <SiteHeader
        onNavigate={navigate}
        onOpenStory={() => {
          navigate("/#latest");
        }}
      />

      <main id="main">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeStory ? activeStory.slug : path}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.28 }}
          >
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
                onOpen={openStory}
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
            ) : storySlug ? (
              <StoryNotFound loading={loading} onNavigate={navigate} />
            ) : (
              <>
                <AIAssistant />
                <Hero
                  featured={stories[0]}
                  storyCount={stories.length}
                  contributorCount={contributorCount}
                  loading={loading && !live}
                  onOpen={openStory}
                  onNavigate={navigate}
                />

                <Marquee topics={topics} />

                <LatestStories
                  stories={stories}
                  loading={loading && !live}
                  query={query}
                  category={category}
                  onQuery={setQuery}
                  onCategory={setCategory}
                  onOpen={openStory}
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
          </motion.div>
        </AnimatePresence>
      </main>

      <SiteFooter onNavigate={navigate} />
    </div>
  );
}
