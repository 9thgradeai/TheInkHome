import { ArrowUpRight, Clock } from "lucide-react";
import { Story } from "../types";
import { formatDate, readingTime, stripHtml } from "../lib/format";
import StoryCover from "./StoryCover";
import AuthorAvatar from "./AuthorAvatar";

interface StoryCardProps {
  story: Story;
  onOpen: (story: Story) => void;
  key?: string | number;
}

export function StoryCard({ story, onOpen }: StoryCardProps) {
  const category = story.categories?.[0];
  const excerpt = stripHtml(story.description || story.content).slice(0, 170);

  return (
    <button
      onClick={() => onOpen(story)}
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0b0c0f] text-left transition-colors duration-300 hover:border-white/25"
    >
      <div className="relative aspect-[16/10] overflow-hidden">
        <StoryCover
          src={story.cover}
          alt={story.title}
          seed={story.title}
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="transition-transform duration-700 group-hover:scale-[1.04]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/5 to-transparent" />
        {category && (
          <span className="absolute left-3 top-3 rounded-full border border-white/15 bg-black/60 px-2.5 py-1 font-mono text-[8px] uppercase tracking-[0.16em] text-white/80 backdrop-blur">
            {category}
          </span>
        )}
        <span className="absolute bottom-3 left-3 font-mono text-[9px] uppercase tracking-[0.16em] text-white/60">
          {formatDate(story.pubDate, "short")}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <h3 className="font-display text-lg font-semibold leading-snug tracking-tight text-white line-clamp-2 transition-colors group-hover:text-[#c8ff4d]">
          {story.title}
        </h3>
        {excerpt && (
          <p className="mt-2 line-clamp-2 text-[12.5px] leading-relaxed text-white/40">{excerpt}</p>
        )}

        <div className="mt-auto flex items-center justify-between border-t border-white/10 pt-3.5">
          <span className="flex min-w-0 items-center gap-2">
            <AuthorAvatar name={story.author} src={story.avatar} className="h-5 w-5 rounded-full text-[8px]" />
            <span className="truncate text-[11px] text-white/50">{story.author}</span>
          </span>
          <span className="flex shrink-0 items-center gap-1 font-mono text-[9px] uppercase tracking-[0.12em] text-white/30">
            <Clock className="h-2.5 w-2.5" />
            {readingTime(story)} min
            <ArrowUpRight className="ml-1 h-3 w-3 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </span>
        </div>
      </div>
    </button>
  );
}

export default StoryCard;
