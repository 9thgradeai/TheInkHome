import { useEffect, useMemo, useState } from "react";
import DOMPurify from "isomorphic-dompurify";
import { motion } from "motion/react";
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
import { Story } from "../types";
import { formatDate, readingTime } from "../lib/format";
import { getLikesCount } from "../lib/interaction";
import StoryCover from "./StoryCover";
import AuthorAvatar from "./AuthorAvatar";
import { StoryCard } from "./StoryCard";

interface Person {
  name: string;
  role: string;
  bio?: string;
  avatar?: string;
  username?: string;
  mediumUrl?: string;
}

interface ReadingPageProps {
  story: Story;
  stories: Story[];
  editors: Person[];
  writers: Person[];
  liked: boolean;
  saved: boolean;
  onToggleLike: (slug: string) => void;
  onToggleSave: (slug: string) => void;
  onBack: () => void;
  onOpenStory: (story: Story) => void;
  onNavigate: (path: string) => void;
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
  onBack,
  onOpenStory,
  onNavigate,
}: ReadingPageProps) {
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

  return (
    <article className="relative">
      <div className="fixed inset-x-0 top-0 z-[60] h-[2px] bg-white/5">
        <div
          className="h-full bg-[#c8ff4d] transition-[width] duration-150"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="mx-auto max-w-7xl px-4 pb-8 pt-24 sm:px-8 sm:pt-28">
        <button
          onClick={onBack}
          className="group flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-white/40 transition-colors hover:text-white"
        >
          <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />
          Back to the publication
        </button>
      </div>

      <header className="mx-auto max-w-4xl px-4 sm:px-8">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-[#c8ff4d]/30 bg-[#c8ff4d]/10 px-2.5 py-1 font-mono text-[8px] uppercase tracking-[0.18em] text-[#c8ff4d]">
              The Ink Home
            </span>
            {story.categories.slice(0, 3).map((category) => (
              <span
                key={category}
                className="rounded-full border border-white/10 px-2.5 py-1 font-mono text-[8px] uppercase tracking-[0.16em] text-white/45"
              >
                {category}
              </span>
            ))}
          </div>

          <h1 className="mt-6 font-display text-[clamp(2.2rem,6vw,4.4rem)] font-black leading-[0.98] tracking-[-0.04em] text-white">
            {story.title}
          </h1>

          {story.description && (
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-white/50 sm:text-lg">
              {story.description.replace(/\s*\.\.\.$/, "")}
            </p>
          )}

          <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-3">
            <div className="flex items-center gap-3">
              <AuthorAvatar
                name={story.author}
                src={story.avatar}
                className="h-11 w-11 rounded-full text-[12px]"
              />
              <div>
                <div className="font-display text-sm font-semibold text-white">{story.author}</div>
                <div className="mt-0.5 font-mono text-[9px] uppercase tracking-[0.16em] text-white/35">
                  {authorMeta?.role || story.role || "Contributor"}
                </div>
              </div>
            </div>

            <span className="h-8 w-px bg-white/10" />

            <div className="flex items-center gap-4 font-mono text-[9px] uppercase tracking-[0.14em] text-white/35">
              <span className="flex items-center gap-1.5">
                <Calendar className="h-3 w-3" /> {formatDate(story.pubDate)}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="h-3 w-3" /> {readingTime(story)} min read
              </span>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-2 border-y border-white/10 py-3">
            <button
              onClick={() => onToggleLike(story.slug)}
              className={`flex items-center gap-2 rounded-full border px-3 py-2 font-mono text-[9px] uppercase tracking-[0.14em] transition-colors ${
                liked
                  ? "border-[#c8ff4d]/40 bg-[#c8ff4d]/10 text-[#c8ff4d]"
                  : "border-white/10 text-white/50 hover:border-white/30 hover:text-white"
              }`}
            >
              <Heart className={`h-3.5 w-3.5 ${liked ? "fill-current" : ""}`} />
              {getLikesCount(story.title, liked)}
            </button>
            <button
              onClick={() => onToggleSave(story.slug)}
              className={`flex items-center gap-2 rounded-full border px-3 py-2 font-mono text-[9px] uppercase tracking-[0.14em] transition-colors ${
                saved
                  ? "border-[#c8ff4d]/40 bg-[#c8ff4d]/10 text-[#c8ff4d]"
                  : "border-white/10 text-white/50 hover:border-white/30 hover:text-white"
              }`}
            >
              <Bookmark className={`h-3.5 w-3.5 ${saved ? "fill-current" : ""}`} />
              {saved ? "Saved" : "Save"}
            </button>
            <button
              onClick={share}
              className="flex items-center gap-2 rounded-full border border-white/10 px-3 py-2 font-mono text-[9px] uppercase tracking-[0.14em] text-white/50 transition-colors hover:border-white/30 hover:text-white"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-[#c8ff4d]" /> : <Share2 className="h-3.5 w-3.5" />}
              {copied ? "Copied" : "Share"}
            </button>
            <a
              href={story.link}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-auto flex items-center gap-1.5 rounded-full bg-white px-3 py-2 font-mono text-[9px] uppercase tracking-[0.14em] text-black transition-colors hover:bg-[#c8ff4d]"
            >
              Read on Medium <ArrowUpRight className="h-3 w-3" />
            </a>
          </div>
        </motion.div>
      </header>

      <figure className="mx-auto mt-10 max-w-5xl px-4 sm:px-8">
        <div className="relative aspect-[16/9] overflow-hidden rounded-2xl border border-white/10">
          <StoryCover src={story.cover} alt={story.title} seed={story.title} sizes="100vw" priority />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/25 to-transparent" />
        </div>
      </figure>

      <div className="mx-auto mt-12 max-w-3xl px-4 sm:px-8">
        <div className="prose-ink" dangerouslySetInnerHTML={{ __html: sanitized }} />
      </div>

      <div className="mx-auto mt-14 max-w-3xl px-4 sm:px-8">
        <div className="rounded-2xl border border-white/10 bg-[#0b0c0f] p-6 sm:p-8">
          <div className="flex items-start gap-4">
            <AuthorAvatar
              name={story.author}
              src={story.avatar}
              className="h-14 w-14 rounded-full text-[14px]"
            />
            <div className="min-w-0">
              <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-white/35">
                Written by
              </div>
              <h2 className="mt-1 font-display text-xl font-bold text-white">{story.author}</h2>
              <p className="mt-0.5 font-mono text-[9px] uppercase tracking-[0.14em] text-[#c8ff4d]">
                {authorMeta?.role || story.role || "Contributor"}
              </p>
              {authorMeta?.bio && (
                <p className="mt-3 text-[13px] leading-relaxed text-white/45">{authorMeta.bio}</p>
              )}
              {authorMeta?.mediumUrl && (
                <a
                  href={authorMeta.mediumUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.14em] text-white/50 hover:text-white"
                >
                  Follow on Medium <ArrowUpRight className="h-3 w-3" />
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <section className="mx-auto mt-20 max-w-7xl px-4 pb-20 sm:px-8">
          <div className="flex items-end justify-between border-b border-white/10 pb-5">
            <div>
              <div className="font-mono text-[9px] uppercase tracking-[0.22em] text-[#c8ff4d]">
                Keep reading
              </div>
              <h2 className="mt-2 font-display text-3xl font-black tracking-tight text-white sm:text-4xl">
                More from the publication
              </h2>
            </div>
            <button
              onClick={() => onNavigate("/#latest")}
              className="hidden items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.16em] text-white/40 transition-colors hover:text-white sm:flex"
            >
              All stories <ArrowUpRight className="h-3 w-3" />
            </button>
          </div>
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((item) => (
              <StoryCard key={item.slug} story={item} onOpen={onOpenStory} />
            ))}
          </div>
        </section>
      )}

      <div className="mx-auto max-w-3xl px-4 pb-24 sm:px-8">
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.03] to-transparent px-6 py-10 text-center">
          <Copy className="h-5 w-5 text-[#c8ff4d]" />
          <p className="max-w-md text-[13px] leading-relaxed text-white/45">
            This essay was first published in The Ink Home on Medium. Follow the publication to get every new
            dispatch.
          </p>
          <a
            href="https://medium.com/the-ink-home"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 flex items-center gap-2 rounded-full bg-white px-5 py-2.5 font-mono text-[9px] uppercase tracking-[0.16em] text-black transition-colors hover:bg-[#c8ff4d]"
          >
            Follow The Ink Home <ArrowUpRight className="h-3 w-3" />
          </a>
        </div>
      </div>
    </article>
  );
}
