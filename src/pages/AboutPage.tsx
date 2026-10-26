import React from "react";
import { motion } from "motion/react";
import { ArrowUpRight, BookOpen, Quote, Sparkles } from "lucide-react";
import { Logo } from "../components/Logo";
import { Story } from "../types";

interface AboutData {
  description: string;
  officialWebsite?: string;
  editors: Array<{
    name: string;
    role: string;
    bio?: string;
    avatar?: string;
    followers?: number;
    mediumUrl?: string;
  }>;
  writers: Array<{
    name: string;
    role: string;
    bio?: string;
    avatar?: string;
  }>;
}

interface AboutPageProps {
  about: AboutData;
  storyCount: number;
  contributorCount: number;
  onNavigate: (path: string) => void;
}

export default function AboutPage({
  about,
  storyCount,
  contributorCount,
  onNavigate,
}: AboutPageProps) {
  return (
    <section className="min-h-screen bg-[#08080a] text-white">

      <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-[#08080a]/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-8">
          <button
            onClick={() => onNavigate("/")}
            className="flex items-center gap-3 text-left"
            aria-label="The Ink Home — home"
          >
            <Logo size={34} textColor="text-white" />
          </button>
          <div className="hidden md:flex items-center gap-3">
            <a
              href="https://medium.com/the-ink-home"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-2 rounded-full bg-white px-4 py-2.5 text-[10px] font-bold uppercase tracking-[0.16em] text-black transition-colors hover:bg-[#c8ff4d]"
            >
              Read on Medium
              <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </a>
          </div>
        </div>
      </header>

      <main className="pt-32 px-4 pb-40 sm:px-8 sm:pb-48">
        <div className="mx-auto max-w-7xl">
          <div
            className="relative overflow-hidden border-y border-white/10 bg-[#0a0b0d] py-24 sm:py-32"
          >
            <div
              className="pointer-events-none absolute inset-0 opacity-70"
              style={{
                background:
                  "radial-gradient(ellipse 50% 70% at 90% 0%, rgba(200,255,77,0.10), transparent 60%), radial-gradient(ellipse 40% 60% at 0% 100%, rgba(167,139,250,0.10), transparent 60%)",
              }}
            />
            <div className="relative mx-auto grid max-w-7xl gap-12 px-4 sm:px-8 lg:grid-cols-[1.1fr_0.9fr]">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7 }}
                className="space-y-8"
              >
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
                    Good writing is a form of hospitality. We keep the light on,
                    the chair warm, and the page open.
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
                    onClick={() => onNavigate("/stories")}
                    className="flex items-center gap-2 rounded-full border border-white/15 px-5 py-3 text-[11px] font-bold uppercase tracking-[0.16em] text-white/70 transition-colors hover:border-white/40 hover:text-white"
                  >
                    Browse the archive
                  </button>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.1 }}
                className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10"
              >
                {[
                  [String(storyCount), "Stories on site"],
                  [String(contributorCount), "Contributors"],
                  ["10 min", "Refresh cadence"],
                  ["2026", "Vol. 07"],
                ].map(([value, label]) => (
                  <div key={label} className="bg-[#0a0b0d] px-5 py-6 sm:px-6 sm:py-7">
                    <div className="font-display text-3xl font-bold text-white sm:text-4xl">
                      {value}
                    </div>
                    <div className="mt-1 font-mono text-[9px] uppercase tracking-[0.16em] text-white/35">
                      {label}
                    </div>
                  </div>
                ))}
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.2 }}
                className="mt-8 rounded-2xl border border-white/10 bg-[#0b0c0f] p-5 sm:p-7"
              >
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
                  Have something honest to say? We read every submission. Write
                  to us at{" "}
                  <a
                    href="mailto:hello@theinkhome.com"
                    className="text-white/60 hover:text-[#c8ff4d]"
                  >
                    hello@theinkhome.com
                  </a>
                  .
                </p>
              </motion.div>
            </div>
          </div>

          {/* Editors */}
          <section className="mt-20">
            <div className="flex items-center gap-3 mb-10">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#c8ff4d]/10 text-[#c8ff4d]">
                <Sparkles className="h-5 w-5" />
              </div>
              <h2 className="font-display text-2xl font-bold tracking-tight text-white sm:text-3xl">
                The editorial desk
              </h2>
            </div>
            <div className="grid gap-6 md:grid-cols-2">
              {about.editors.map((editor, index) => (
                <motion.div
                  key={editor.name}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: index * 0.08 }}
                  className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0b0c0f] p-6 sm:p-8 transition-colors hover:border-white/25"
                >
                  <div className="relative mt-6 flex items-center gap-4">
                    <div
                      className="h-16 w-16 rounded-full border border-white/20 overflow-hidden bg-[#0a0b0d]"
                    >
                      {editor.avatar ? (
                        <img
                          src={editor.avatar}
                          alt={editor.name}
                          className="h-full w-full object-cover"
                          decoding="async"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center rounded-full bg-gradient-to-br from-[#c8ff4d]/20 to-[#a78bfa]/20 text-[#c8ff4d] text-[16px] font-bold">
                          {editor.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .slice(0, 2)
                            .toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-display text-2xl font-bold tracking-tight text-white">
                        {editor.name}
                      </h3>
                      <p className="mt-0.5 text-[11px] leading-snug text-[#c8ff4d]">
                        {editor.role}
                      </p>
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
                        Medium profile <ArrowUpRight className="h-3 w-3" />
                      </a>
                    ) : (
                      <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-white/25 pl-8">
                        Ink Home
                      </span>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </section>
        </div>
      </main>
    </section>
  );
}
