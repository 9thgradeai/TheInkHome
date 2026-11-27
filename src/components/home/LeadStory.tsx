import { ArrowRight, Clock } from "lucide-react";
import type { Story } from "../../types";
import { formatDate, readingTime, stripHtml } from "../../lib/format";
import { useNavigate } from "../../router";
import StoryCover from "../StoryCover";
import AuthorAvatar from "../AuthorAvatar";

interface LeadStoryProps {
  story?: Story;
  loading: boolean;
}

/** The front-page lead: one story given the space it deserves. */
export default function LeadStory({ story, loading }: LeadStoryProps) {
  const navigate = useNavigate();

  if (loading || !story) {
    return (
      <section aria-busy="true" className="shell py-12">
        <div className="grid gap-8 lg:grid-cols-[1.1fr_1fr] lg:items-center">
          <div className="skeleton aspect-[16/11] w-full rounded-xl" />
          <div className="space-y-4">
            <div className="skeleton h-3 w-28" />
            <div className="skeleton h-10 w-4/5" />
            <div className="skeleton h-10 w-3/5" />
            <div className="skeleton h-4 w-full" />
            <div className="skeleton h-4 w-2/3" />
          </div>
        </div>
      </section>
    );
  }

  const excerpt = stripHtml(story.description || story.content).slice(0, 260);

  return (
    <section className="shell py-12 sm:py-16">
      <article className="grid gap-8 lg:grid-cols-[1.1fr_1fr] lg:items-center lg:gap-14">
        <button
          type="button"
          onClick={() => navigate(`/story/${encodeURIComponent(story.slug)}`)}
          className="group relative block aspect-[16/11] overflow-hidden rounded-2xl bg-sunken focus-visible:outline-none"
          aria-label={`Read ${story.title}`}
        >
          <StoryCover
            src={story.cover}
            alt={story.title}
            seed={story.title}
            sizes="(max-width: 1024px) 100vw, 55vw"
            priority
            className="transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.02]"
          />
        </button>

        <div>
          <p className="eyebrow">Lead story</p>
          <h2 className="mt-4 font-display text-[clamp(1.75rem,3.6vw,2.9rem)] font-semibold leading-[1.04] tracking-[-0.03em] text-ink">
            <button
              type="button"
              onClick={() => navigate(`/story/${encodeURIComponent(story.slug)}`)}
              className="text-left decoration-accent decoration-[3px] underline-offset-[10px] hover:underline focus-visible:outline-none"
            >
              {story.title}
            </button>
          </h2>

          {excerpt && (
            <p className="mt-5 max-w-[54ch] text-[15.5px] leading-relaxed text-ink-soft">{excerpt}</p>
          )}

          <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-3 border-t border-line pt-5 text-[13px] text-ink-faint">
            <span className="flex items-center gap-2.5">
              <AuthorAvatar name={story.author} src={story.avatar} className="h-8 w-8 text-[10px]" />
              <span className="font-medium text-ink">{story.author}</span>
            </span>
            <time dateTime={new Date(story.pubDate).toISOString()} className="text-ink-soft">
              {formatDate(story.pubDate)}
            </time>
            <span className="flex items-center gap-1.5 text-ink-soft">
              <Clock className="h-3.5 w-3.5" aria-hidden="true" /> {readingTime(story)} min
            </span>
          </div>

          <button
            type="button"
            onClick={() => navigate(`/story/${encodeURIComponent(story.slug)}`)}
            className="btn btn-solid mt-6 group"
          >
            Read the story
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
          </button>
        </div>
      </article>
    </section>
  );
}
