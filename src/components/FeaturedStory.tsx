import React from "react";
import { ArrowDownRight, ArrowUpRight, Clock } from "lucide-react";
import { Story } from "../types";
import { formatDate, readingTime, stripHtml } from "../lib/format";
import StoryCover from "./StoryCover";
import AuthorAvatar from "./AuthorAvatar";

interface FeaturedStoryProps {
  story?: Story;
  loading?: boolean;
  onOpen: (story: Story) => void;
}

export default function FeaturedStory({ story, loading = false, onOpen }: FeaturedStoryProps) {
  if (loading || !story) {
    return (
      <section className="relative mx-auto max-w-7xl scroll-mt-24 px-4 pb-16 pt-10 sm:px-8 sm:pt-14">
        <div className="animate-pulse overflow-hidden rounded-3xl border border-white/10 bg-[#0b0c0f]">
          <div className="aspect-[21/9] w-full bg-white/[0.05]" />
          <div className="space-y-4 p-6 sm:p-8">
            <div className="h-8 w-24 rounded bg-white/[0.06]" />
            <div className="h-10 w-3/4 rounded bg-white/[0.08]" />
            <div className="h-4 w-full rounded bg-white/[0.05]" />
            <div className="h-4 w-2/3 rounded bg-white/[0.05]" />
          </div>
        </div>
      </section>
    );
  }

  const excerpt = stripHtml(story.description || story.content).slice(0, 220);

  return (
    <section className="relative mx-auto max-w-7xl scroll-mt-24 px-4 pb-16 pt-10 sm:px-8 sm:pt-14">
      <article className="group relative overflow-hidden rounded-3xl border border-white/10 bg-[#0b0c0f]">
        <div className="pointer-events-none absolute inset-0 opacity-60" style={{ background: "radial-gradient(ellipse 60% 80% at 20% 0%, rgba(200,255,77,0.12), transparent 60%)" }} />
        <div className="relative grid lg:grid-cols-2">
          <div className="relative aspect-[16/9] overflow-hidden lg:aspect-[21/9]">
            <StoryCover src={story.cover} alt={story.title} seed={story.title} sizes="(max-width: 1024px) 100vw, 50vw" priority className="transition-transform duration-700 group-hover:scale-[1.03]" />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-black/5 to-transparent" />
            {story.categories?.[0] && (
              <span className="absolute left-4 top-4 rounded-full border border-white/15 bg-black/60 px-2.5 py-1 font-mono text-[8px] uppercase tracking-[0.16em] text-white/80 backdrop-blur">
                {story.categories[0]}
              </span>
            )}
          </div>
          <div className="relative flex flex-col justify-center p-6 sm:p-10">
            <div className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.24em] text-[#c8ff4d]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#c8ff4d]" aria-hidden="true" />
              Featured story
            </div>
            <h2 className="mt-4 font-display text-3xl font-black leading-[0.98] tracking-[-0.03em] text-white sm:text-5xl">
              <button
                type="button"
                onClick={() => onOpen(story)}
                className="text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c8ff4d] focus-visible:ring-offset-2 focus-visible:ring-offset-[#08080a] rounded-sm"
              >
                {story.title}
              </button>
            </h2>
            {excerpt && <p className="mt-5 max-w-xl text-sm leading-relaxed text-white/55">{excerpt}</p>}
            <div className="mt-7 flex flex-wrap items-center gap-x-4 gap-y-3">
              <div className="flex items-center gap-3">
                <AuthorAvatar name={story.author} src={story.avatar} className="h-9 w-9 rounded-full text-[10px]" />
                <div>
                  <div className="font-display text-sm font-semibold text-white">{story.author}</div>
                  <div className="mt-0.5 font-mono text-[9px] uppercase tracking-[0.16em] text-white/35">
                    {formatDate(story.pubDate, "short")} · {readingTime(story)} min read
                  </div>
                </div>
              </div>
              <span className="h-8 w-px bg-white/10" />
              <span className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.14em] text-white/35">
                <Clock className="h-3 w-3" aria-hidden="true" /> {readingTime(story)} min read
              </span>
            </div>
            <div className="mt-8 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => onOpen(story)}
                className="group inline-flex items-center gap-2 rounded-full bg-white px-6 py-3.5 text-[11px] font-bold uppercase tracking-[0.16em] text-black transition-colors hover:bg-[#c8ff4d] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c8ff4d] focus-visible:ring-offset-2 focus-visible:ring-offset-[#08080a]"
              >
                Read the story <ArrowDownRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </button>
              <a
                href={story.link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-white/20 px-6 py-3.5 text-[11px] font-bold uppercase tracking-[0.16em] text-white/85 transition-colors hover:border-white/50 hover:text-white"
              >
                On Medium <ArrowUpRight className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>
      </article>
    </section>
  );
}
