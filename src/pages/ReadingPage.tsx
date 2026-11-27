import { useEffect, useMemo, useState } from "react";
import DOMPurify from "dompurify";
import {
  ArrowLeft,
  ArrowUpRight,
  Bookmark,
  Calendar,
  Check,
  Clock,
  Copy,
  Heart,
  Share2,
} from "lucide-react";
import type { Story } from "../types";
import { formatDate, readingTime } from "../lib/format";
import StoryCover from "../components/StoryCover";
import AuthorAvatar from "../components/AuthorAvatar";
import { StoryCard } from "../components/StoryCard";
import type { Person } from "../lib/usePublication";
import { useNavigate } from "../router";

interface ReadingPageProps {
  story: Story;
  stories: Story[];
  editors: Person[];
  writers: Person[];
  liked: boolean;
  saved: boolean;
  onToggleLike: (slug: string) => void;
  onToggleSave: (slug: string) => void;
}

export default function ReadingPage({
  story,
  stories,
  editors,
  writers,
  liked,
  saved,
  onToggleLike,
  onToggleSave,
}: ReadingPageProps) {
  const navigate = useNavigate();
  const [progress, setProgress] = useState(0);
  const [copied, setCopied] = useState(false);

  const authorMeta = useMemo(
    () =>
      [...editors, ...writers].find(
        (person) => person.name?.toLowerCase() === story.author?.toLowerCase(),
      ),
    [editors, writers, story.author],
  );

  const sanitized = useMemo(() => {
    const raw =
      story.content ||
      `<p>${story.description || "This story is available in full on Medium."}</p>`;
    const clean = DOMPurify.sanitize(raw, {
      ADD_TAGS: ["iframe"],
      ADD_ATTR: ["target", "allowfullscreen", "frameborder", "allow", "scrolling"],
    });

    const wrapper = document.createElement("div");
    wrapper.innerHTML = clean;

    const firstImage = wrapper.querySelector("img");
    if (firstImage && story.cover && firstImage.getAttribute("src") === story.cover) {
      (firstImage.closest("figure") || firstImage).remove();
    }

    wrapper.querySelectorAll("img").forEach((image) => {
      image.setAttribute("loading", "lazy");
      image.setAttribute("decoding", "async");
    });

    return wrapper.innerHTML.replace(
      /<a /g,
      '<a target="_blank" rel="noopener noreferrer" ',
    );
  }, [story.content, story.description, story.cover]);

  useEffect(() => {
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(max > 0 ? Math.min(100, (window.scrollY / max) * 100) : 0);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [story.slug]);

  const related = useMemo(() => {
    return stories
      .filter((item) => item.slug !== story.slug)
      .map((item) => {
        let score = 0;
        if (item.author === story.author) score += 3;
        score += item.categories.filter((category) => story.categories.includes(category)).length;
        return { item, score };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map(({ item }) => item);
  }, [stories, story]);

  const share = async () => {
    const url = story.link || window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: story.title, text: story.description, url });
      } else {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1800);
      }
    } catch {
      /* dismissed */
    }
  };

  const actionClass = (active: boolean) =>
    `flex items-center gap-2 rounded-full border px-3.5 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] transition-colors ${
      active
        ? "border-accent bg-accent/10 text-accent-ink"
        : "border-line text-ink-soft hover:border-line-strong hover:text-ink"
    }`;

  return (
    <article className="relative">
      <div className="fixed inset-x-0 top-0 z-[60] h-[3px] bg-line/70">
        <div
          className="h-full bg-accent transition-[width] duration-150"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="mx-auto max-w-7xl px-5 pb-8 pt-24 sm:px-8 sm:pt-28">
        <button
          type="button"
          onClick={() => navigate("/stories")}
          className="group flex items-center gap-2 text-[13px] text-ink-faint transition-colors hover:text-ink"
        >
          <ArrowLeft
            className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5"
            aria-hidden="true"
          />
          Back to the archive
        </button>
      </div>

      <header className="mx-auto max-w-4xl px-5 sm:px-8">
        <div className="flex flex-wrap items-center gap-2">
          <span className="chip text-accent-ink">The Ink Home</span>
          {story.categories.slice(0, 3).map((category) => (
            <span key={category} className="chip">
              {category}
            </span>
          ))}
        </div>

        <h1 className="mt-6 font-display text-[clamp(2.1rem,5.5vw,4rem)] font-semibold leading-[1.03] tracking-[-0.035em] text-ink">
          {story.title}
        </h1>

        {story.description && (
          <p className="mt-5 max-w-2xl text-[17px] leading-relaxed text-ink-soft">
            {story.description.replace(/\s*\.\.\.$/, "")}
          </p>
        )}

        <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-3">
          <div className="flex items-center gap-3">
            <AuthorAvatar name={story.author} src={story.avatar} className="h-11 w-11 text-[12px]" />
            <div>
              <p className="font-display text-sm font-semibold text-ink">{story.author}</p>
              <p className="mt-0.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-faint">
                {authorMeta?.role || story.role || "Contributor"}
              </p>
            </div>
          </div>

          <span aria-hidden="true" className="h-8 w-px bg-line" />

          <div className="flex items-center gap-4 text-[12px] text-ink-faint">
            <span className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" aria-hidden="true" /> {formatDate(story.pubDate)}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" aria-hidden="true" /> {readingTime(story)} min read
            </span>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap items-center gap-2 border-y border-line py-3.5">
          <button
            type="button"
            aria-pressed={liked}
            onClick={() => onToggleLike(story.slug)}
            className={actionClass(liked)}
          >
            <Heart className={`h-3.5 w-3.5 ${liked ? "fill-current" : ""}`} aria-hidden="true" />
            {liked ? "Liked" : "Like"}
          </button>
          <button
            type="button"
            aria-pressed={saved}
            onClick={() => onToggleSave(story.slug)}
            className={actionClass(saved)}
          >
            <Bookmark className={`h-3.5 w-3.5 ${saved ? "fill-current" : ""}`} aria-hidden="true" />
            {saved ? "Saved" : "Save"}
          </button>
          <button type="button" onClick={share} className={actionClass(false)}>
            {copied ? (
              <Check className="h-3.5 w-3.5 text-accent-ink" aria-hidden="true" />
            ) : (
              <Share2 className="h-3.5 w-3.5" aria-hidden="true" />
            )}
            {copied ? "Copied" : "Share"}
          </button>
          <a
            href={story.link}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-solid ml-auto"
          >
            Read on Medium
            <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
          </a>
        </div>
      </header>

      <figure className="mx-auto mt-10 max-w-5xl px-5 sm:px-8">
        <div className="relative aspect-[16/9] overflow-hidden rounded-2xl border border-line">
          <StoryCover src={story.cover} alt={story.title} seed={story.title} sizes="100vw" priority />
        </div>
      </figure>

      <div className="mx-auto mt-12 max-w-3xl px-5 sm:px-8">
        <div className="prose-ink" dangerouslySetInnerHTML={{ __html: sanitized }} />
      </div>

      <div className="mx-auto mt-14 max-w-3xl px-5 sm:px-8">
        <div className="rounded-2xl border border-line bg-raised p-6 sm:p-8">
          <div className="flex items-start gap-4">
            <AuthorAvatar name={story.author} src={story.avatar} className="h-14 w-14 text-[14px]" />
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-faint">
                Written by
              </p>
              <h2 className="mt-1.5 font-display text-xl font-semibold text-ink">{story.author}</h2>
              <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-accent-ink">
                {authorMeta?.role || story.role || "Contributor"}
              </p>
              {authorMeta?.bio && (
                <p className="mt-3 text-[13.5px] leading-relaxed text-ink-soft">{authorMeta.bio}</p>
              )}
              <div className="mt-4 flex flex-wrap gap-3">
                {authorMeta?.mediumUrl && (
                  <a
                    href={authorMeta.mediumUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-outline"
                  >
                    Follow on Medium
                    <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => navigate(`/writer/${encodeURIComponent(story.author.toLowerCase())}`)}
                  className="btn btn-outline"
                >
                  More by {story.author.split(" ")[0]}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <section className="mx-auto mt-20 max-w-7xl px-5 pb-20 sm:px-8">
          <div className="flex items-end justify-between border-b border-line pb-5">
            <div>
              <p className="eyebrow">Keep reading</p>
              <h2 className="mt-2 font-display text-[clamp(1.75rem,3vw,2.5rem)] font-semibold tracking-[-0.03em] text-ink">
                More from the publication
              </h2>
            </div>
            <button
              type="button"
              onClick={() => navigate("/stories")}
              className="hidden items-center gap-1.5 text-[12px] text-ink-faint transition-colors hover:text-ink sm:flex"
            >
              All stories
              <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </div>
          <div className="mt-8 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((item) => (
              <div key={item.slug} className="h-full">
                <StoryCard story={item} />
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="mx-auto max-w-3xl px-5 pb-24 sm:px-8">
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-line bg-sunken px-6 py-10 text-center">
          <Copy className="h-5 w-5 text-accent-ink" aria-hidden="true" />
          <p className="max-w-md text-[13.5px] leading-relaxed text-ink-soft">
            This essay was first published in The Ink Home on Medium. Follow the publication to get
            every new dispatch.
          </p>
          <a
            href="https://medium.com/the-ink-home"
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-solid mt-1"
          >
            Follow The Ink Home
            <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
          </a>
        </div>
      </div>
    </article>
  );
}
