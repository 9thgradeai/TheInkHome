import React, { useCallback, useMemo, useState } from "react";
import { motion } from "motion/react";
import { ArrowRight, BookOpen, PenLine, Users } from "lucide-react";
import AuthorAvatar from "../components/AuthorAvatar";
import { Story } from "../types";
import { formatDate, readingTime } from "../lib/format";
import AIAssistant from "../components/AIAssistant";

interface Person {
  name: string;
  username?: string;
  role: string;
  bio?: string;
  avatar?: string;
  followers?: number;
  mediumUrl?: string;
  count?: number;
}

interface WritersPageProps {
  editors: Person[];
  writers: Person[];
  stories: Story[];
  onSelect: (name: string) => void;
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
  key?: React.Key;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.7, delay, ease: EASE }}
      className={className}
      key={children as unknown as React.Key}
    >
      {children}
    </motion.div>
  );
}

export default function WritersPage({
  editors,
  writers,
  stories,
  onSelect,
}: WritersPageProps) {
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

  const visible = showAll ? contributors : contributors.slice(0, 16);

  return (
    <section className="min-h-screen bg-[#08080a] text-white">
      <AIAssistant />

      <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-[#08080a]/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-8">
          <button
            onClick={() => {}}
            className="flex items-center gap-3 text-left"
            aria-label="The Ink Home — home"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/10 text-white">
              <PenLine className="h-4 w-4" />
            </div>
            <div className="flex flex-col items-start leading-none pl-8">
              <span className="font-display text-lg font-extrabold tracking-widest uppercase text-white">
                Writers & Editors
              </span>
              <span className="text-[9px] font-mono tracking-[0.25em] text-white/45 uppercase mt-0.5">
                Writers & Editors
              </span>
            </div>
          </button>
          <div className="hidden md:flex items-center gap-3">
            <a
              href="https://medium.com/the-ink-home"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-2 rounded-full bg-white px-4 py-2.5 text-[10px] font-bold uppercase tracking-[0.16em] text-black transition-colors hover:bg-[#c8ff4d]"
            >
              Read on Medium
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </a>
          </div>
        </div>
      </header>

      <main className="pt-24 px-4 pb-32 sm:px-8 sm:pb-40">
        <div className="mx-auto max-w-7xl">
          <div className="mb-14">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <div className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.24em] text-[#c8ff4d]">
                  <Users className="h-3 w-3" /> The writers
                </div>
                <h1 className="mt-4 max-w-2xl font-display text-4xl font-black tracking-[-0.03em] text-white sm:text-6xl">
                  Every voice in the room.
                </h1>
                <p className="mt-4 max-w-xl text-sm leading-relaxed text-white/45">
                  Essayists, researchers, engineers and storytellers who keep storytelling alive. Select a writer to see their work.
                </p>
              </div>
              <span className="shrink-0 font-mono text-[9px] uppercase tracking-[0.18em] text-white/30">
                {editors.length + contributors.length} contributors
              </span>
            </div>
          </div>

          {/* Editors */}
          <section className="mb-16 border-b border-white/10 pb-8">
            <div className="flex items-center gap-3 mb-8">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#c8ff4d]/10 text-[#c8ff4d]">
                <BookOpen className="h-4 w-4" />
              </div>
              <h2 className="font-display text-2xl font-bold tracking-tight text-white sm:text-3xl">
                The editors
              </h2>
            </div>
            <div className="grid gap-6 md:grid-cols-2">
              {editors.map((editor, index) => {
                const count =
                  editor.count ??
                  stories.filter((story) => story.author === editor.name).length;
                return (
                  <Reveal key={editor.name} delay={index * 0.08}>
                    <div className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0b0c0f] p-6 sm:p-8 transition-colors hover:border-white/25">
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
                          className="h-16 w-16 rounded-full text-[16px]"
                        />
                        <div className="min-w-0">
                          <h3 className="font-display text-2xl font-bold tracking-tight text-white">
                            {editor.name}
                          </h3>
                          <p className="mt-0.5 text-[11px] leading-snug text-[#c8ff4d]">
                            {editor.role}
                          </p>
                          {typeof editor.followers === "number" && (
                            <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.14em] text-white/30">
                              {editor.followers.toLocaleString()} followers on Medium
                            </p>
                          )}
                        </div>
                      </div>
                      {editor.bio && (
                        <p className="relative mt-5 text-[13px] leading-relaxed text-white/45">
                          {editor.bio}
                        </p>
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
                            Medium profile <ArrowRight className="h-3 w-3" />
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
          </section>

          {/* Writers */}
          <section>
            <div className="flex items-center gap-3 mb-8">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#c8ff4d]/10 text-[#c8ff4d]">
                <Users className="h-4 w-4" />
              </div>
              <h2 className="font-display text-2xl font-bold tracking-tight text-white sm:text-3xl">
                Contributing writers
              </h2>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {visible.map((person, index) => (
                <Reveal
                  key={person.name}
                  delay={Math.min((index % 4) * 0.04, 0.16)}
                  className="h-full"
                >
                  <button
                    onClick={() => {
                      if ((person.count || 0) > 0) onSelect(person.name);
                      else if (person.mediumUrl)
                        window.open(
                          person.mediumUrl,
                          "_blank",
                          "noopener,noreferrer",
                        );
                    }}
                    className="group flex h-full w-full flex-col items-start gap-3 rounded-xl border border-white/10 bg-[#0b0c0f] p-4 text-left transition-colors hover:border-white/25"
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
                        <ArrowRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-white/20 transition-all duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-white/70" />
                      </span>
                      <span className="mt-0.5 block truncate text-[10px] text-white/35">
                        {person.role}
                      </span>
                      {person.bio && (
                        <span className="mt-2 line-clamp-2 block text-[11px] leading-relaxed text-white/30">
                          {person.bio}
                        </span>
                      )}
                      <span className="mt-2 flex items-center gap-1.5 font-mono text-[8px] uppercase tracking-[0.14em] text-white/30">
                        <span
                          className={`h-1 w-1 rounded-full ${
                            (person.count || 0) ? "bg-[#c8ff4d]" : "bg-white/20"
                          }`}
                        />
                        {(person.count || 0) > 0
                          ? `${person.count} ${
                              person.count === 1 ? "story" : "stories"
                            }`
                          : person.mediumUrl
                            ? "Read on Medium"
                            : "Contributor"}
                      </span>
                    </span>
                  </button>
                </Reveal>
              ))}
            </div>

            {contributors.length > 16 && (
              <div className="mt-10 flex justify-center">
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
        </div>
      </main>
    </section>
  );
}
