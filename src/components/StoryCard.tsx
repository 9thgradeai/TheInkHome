import { ArrowUpRight } from "lucide-react";
import type { Story } from "../types";
import { formatDate, readingTime, stripHtml } from "../lib/format";
import StoryCover from "./StoryCover";
import AuthorAvatar from "./AuthorAvatar";
import { useNavigate } from "../router";

interface StoryCardProps {
  story: Story;
  /** Larger type scale, used for the lead position in a grid. */
  emphasis?: boolean;
  className?: string;
}

function Kicker({ story }: { story: Story }) {
  const topic = story.categories?.[0];
  return (
    <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-faint">
      {topic && <span className="text-accent-ink">{topic}</span>}
      {topic && <span aria-hidden="true">·</span>}
      <time dateTime={new Date(story.pubDate).toISOString()}>{formatDate(story.pubDate, "short")}</time>
    </div>
  );
}

/** A story presented as an editorial card: image, kicker, headline, standfirst. */
export function StoryCard({ story, emphasis = false, className = "" }: StoryCardProps) {
  const navigate = useNavigate();
  const excerpt = stripHtml(story.description || story.content).slice(0, emphasis ? 220 : 160);

  return (
    <article className={`group flex h-full flex-col ${className}`}>
      <button
        type="button"
        onClick={() => navigate(`/story/${encodeURIComponent(story.slug)}`)}
        className="text-left focus-visible:outline-none"
        aria-label={`Read ${story.title}`}
      >
        <div className="relative aspect-[16/10] overflow-hidden rounded-xl bg-sunken">
          <StoryCover
            src={story.cover}
            alt={story.title}
            seed={story.title}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.03]"
          />
        </div>
      </button>

      <div className="mt-4 flex flex-1 flex-col">
        <Kicker story={story} />
        <h3
          className={`mt-2 font-display font-semibold leading-[1.12] tracking-[-0.02em] text-ink ${
            emphasis ? "text-[clamp(1.4rem,2.4vw,1.9rem)]" : "text-[1.2rem]"
          }`}
        >
          <button
            type="button"
            onClick={() => navigate(`/story/${encodeURIComponent(story.slug)}`)}
            className="text-left decoration-accent decoration-2 underline-offset-4 hover:underline focus-visible:outline-none"
          >
            {story.title}
          </button>
        </h3>

        {excerpt && (
          <p className="mt-2.5 text-[14.5px] leading-relaxed text-ink-soft line-clamp-3">{excerpt}</p>
        )}

        <div className="mt-auto flex items-center gap-2.5 pt-4 text-[12.5px] text-ink-faint">
          <AuthorAvatar name={story.author} src={story.avatar} className="h-6 w-6 text-[9px]" />
          <span className="truncate text-ink-soft">{story.author}</span>
          <span aria-hidden="true">·</span>
          <span className="shrink-0">{readingTime(story)} min</span>
          <ArrowUpRight
            aria-hidden="true"
            className="ml-auto h-3.5 w-3.5 shrink-0 text-ink-faint transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-ink"
          />
        </div>
      </div>
    </article>
  );
}

/** A story presented as an index row — the archive's table of contents. */
export function StoryRow({ story, index }: { story: Story; index?: number }) {
  const navigate = useNavigate();
  const topic = story.categories?.[0];

  return (
    <li className="group border-b border-line last:border-b-0">
      <button
        type="button"
        onClick={() => navigate(`/story/${encodeURIComponent(story.slug)}`)}
        className="flex w-full items-baseline gap-4 py-4 text-left transition-colors sm:gap-6 sm:py-5"
      >
        {typeof index === "number" && (
          <span
            aria-hidden="true"
            className="hidden w-7 shrink-0 font-mono text-[11px] tabular-nums text-ink-faint sm:block"
          >
            {String(index).padStart(2, "0")}
          </span>
        )}
        <span className="min-w-0 flex-1">
          <span className="block font-display text-[1.05rem] font-semibold leading-snug tracking-[-0.015em] text-ink decoration-accent decoration-2 underline-offset-4 group-hover:underline sm:text-[1.2rem]">
            {story.title}
          </span>
          <span className="mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[12.5px] text-ink-faint">
            <span className="text-ink-soft">{story.author}</span>
            {topic && (
              <>
                <span aria-hidden="true">·</span>
                <span className="text-accent-ink">{topic}</span>
              </>
            )}
            <span aria-hidden="true">·</span>
            <time dateTime={new Date(story.pubDate).toISOString()}>
              {formatDate(story.pubDate, "short")}
            </time>
            <span aria-hidden="true">·</span>
            <span>{readingTime(story)} min</span>
          </span>
        </span>
        <ArrowUpRight
          aria-hidden="true"
          className="hidden h-4 w-4 shrink-0 translate-y-1 text-ink-faint opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100 sm:block"
        />
      </button>
    </li>
  );
}

export default StoryCard;
