import { useEffect, useState, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "../lib/motion";
import DOMPurify from "isomorphic-dompurify";
import { Story } from "../types";
import {
  X,
  Calendar,
  User,
  ExternalLink,
  Share2,
  Compass,
  Heart,
  Bookmark,
  Twitter,
  Linkedin,
  Facebook,
  Link,
  Check,
  BookOpen,
  Plus,
  Minus,
  Type,
  Eye,
  ChevronRight,
  BookMarked,
  Feather
} from "lucide-react";
import { getLikesCount, getShareUrl } from "../lib/interaction";
import { analytics } from "../lib/analytics";
import { optimizeImageUrl, optimizeContentHtml } from "../lib/images";
import AvatarImage from "./AvatarImage";
import Subscribe from "./Subscribe";

interface StoryModalProps {
  story: Story | null;
  stories: Story[];
  onClose: () => void;
  onSelectStory: (story: Story) => void;
  onContribute: () => void;
  isLiked: boolean;
  isSaved: boolean;
  onToggleLike: (slug: string) => void;
  onToggleSave: (slug: string) => void;
}

export default function StoryModal({
  story,
  stories,
  onClose,
  onSelectStory,
  onContribute,
  isLiked,
  isSaved,
  onToggleLike,
  onToggleSave
}: StoryModalProps) {
  const [copied, setCopied] = useState(false);
  // Reading preferences are persisted so the reader's typography follows them.
  const [fontScale, setFontScale] = useState(() => {
    try {
      const v = parseFloat(localStorage.getItem("the-ink-home:read:scale") || "1");
      return isNaN(v) ? 1 : Math.min(1.3, Math.max(0.85, v));
    } catch { return 1; }
  });
  const [useSerif, setUseSerif] = useState(() => {
    try { return localStorage.getItem("the-ink-home:read:serif") === "1"; } catch { return false; }
  });
  const [focusMode, setFocusMode] = useState(() => {
    try { return localStorage.getItem("the-ink-home:read:focus") === "1"; } catch { return false; }
  });
  const [progress, setProgress] = useState(0);
  const contentScrollRef = useRef<HTMLDivElement>(null);

  const handleCopyLink = () => {
    if (!story) return;
    navigator.clipboard.writeText(story.link || window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  // Prevent background viewport scrolling when open
  useEffect(() => {
    if (story) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [story]);

  // Handle escape button exits
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // Focus management: move focus into the dialog and trap Tab so screen-reader and
  // keyboard users stay inside until the modal closes, then restore focus on exit.
  const dialogRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!story) return;
    const container = dialogRef.current;
    if (!container) return;
    const FOCUSABLE = 'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';
    const prevActive = document.activeElement as HTMLElement | null;
    const first = container.querySelector(FOCUSABLE) as HTMLElement | null;
    (first || container).focus?.();
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      const els = Array.from(container.querySelectorAll(FOCUSABLE)) as HTMLElement[];
      if (els.length === 0) return;
      const firstEl = els[0];
      const lastEl = els[els.length - 1];
      if (e.shiftKey && document.activeElement === firstEl) { e.preventDefault(); lastEl.focus(); }
      else if (!e.shiftKey && document.activeElement === lastEl) { e.preventDefault(); firstEl.focus(); }
    };
    container.addEventListener("keydown", onKeyDown);
    return () => {
      container.removeEventListener("keydown", onKeyDown);
      prevActive?.focus?.();
    };
  }, [story]);

  if (!story) return null;

  // ---- Premium reading helpers ----

  // Estimated read time from the raw article text (roughly 200 wpm).
  const readTime = useMemo(() => {
    const text = (story.content || story.description || "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    const words = text.split(" ").filter(Boolean).length;
    return Math.max(1, Math.round(words / 200));
  }, [story]);

  const storyIndex = stories.findIndex((s) => s.slug === story.slug);
  const nextStory = storyIndex >= 0 ? stories[(storyIndex + 1) % stories.length] : null;
  const prevStory = storyIndex >= 0 ? stories[(storyIndex - 1 + stories.length) % stories.length] : null;

  // Read telemetry: record open time, report seconds on close/switch.
  const readStartRef = useRef<number | null>(null);
  const lastDepthRef = useRef(0);

  // Reset scroll + reading state when switching stories.
  useEffect(() => {
    setProgress(0);
    lastDepthRef.current = 0;
    if (story) readStartRef.current = Date.now();
    if (contentScrollRef.current) contentScrollRef.current.scrollTop = 0;
    return () => {
      if (story && readStartRef.current != null) {
        const seconds = (Date.now() - readStartRef.current) / 1000;
        if (seconds >= 2) analytics.readTime(story.slug, seconds);
        readStartRef.current = null;
      }
    };
  }, [story?.slug]);

  // Track scroll progress within the content pane for the reading bar, and fire
  // throttled depth telemetry on each ~10% crossing.
  const onContentScroll = () => {
    const el = contentScrollRef.current;
    if (!el) return;
    const max = el.scrollHeight - el.clientHeight;
    const pct = max > 0 ? Math.min(100, (el.scrollTop / max) * 100) : 0;
    setProgress(pct);
    const bucket = Math.floor(pct / 10);
    if (bucket > lastDepthRef.current) {
      lastDepthRef.current = bucket;
      analytics.readDepth(story.slug, bucket * 10);
    }
  };

  // Keyboard nav: Left/Right flips stories (continuous reading); Space resumes scroll.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const typing = target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA");
      if (typing) return;
      if (e.key === "ArrowRight" && nextStory) onSelectStory(nextStory);
      else if (e.key === "ArrowLeft" && prevStory) onSelectStory(prevStory);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [nextStory, prevStory, onSelectStory]);

  // Persist reading preferences.
  useEffect(() => { try { localStorage.setItem("the-ink-home:read:scale", String(fontScale)); } catch {} }, [fontScale]);
  useEffect(() => { try { localStorage.setItem("the-ink-home:read:serif", useSerif ? "1" : "0"); } catch {} }, [useSerif]);
  useEffect(() => { try { localStorage.setItem("the-ink-home:read:focus", focusMode ? "1" : "0"); } catch {} }, [focusMode]);

  // Custom function to share story
  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: story.title,
        text: story.description,
        url: story.link || window.location.href,
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(story.link || window.location.href);
      alert("Article link copied to clipboard!");
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto select-text modal-fullscreen-mobile" id="story-modal-container" ref={dialogRef} role="dialog" aria-modal="true" aria-label={story.title}>
        {/* Backdrop Glow Glass Panel */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="absolute inset-0 bg-black/85 backdrop-blur-md cursor-pointer"
          onClick={onClose}
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.93, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: "spring", stiffness: 220, damping: 22 }}
          className="relative w-full max-w-4xl bg-[#050505]/95 border border-white/5 rounded-none shadow-2xl flex flex-col max-h-[90vh] sm:max-h-[88vh] overflow-hidden z-10 glass-card modal-fullscreen-mobile"
        >
          {/* Reading Progress Bar */}
          <div className="absolute top-0 left-0 right-0 z-30 h-0.5 bg-white/5">
            <div
              className="h-full bg-[var(--atmo-text)] shadow-[0_0_8px_var(--atmo-glow)] transition-[width] duration-150 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Header Action Row (hidden in focus mode) */}
          {!focusMode && (
          <div className="absolute top-3 right-3 sm:top-4 sm:right-4 z-20 flex items-center gap-1.5 sm:gap-2">
            <button
              onClick={handleShare}
              className="p-2.5 sm:p-2.5 bg-black/60 backdrop-blur-md hover:bg-white/[0.05] border border-white/5 rounded-full text-slate-300 hover:text-[var(--atmo-text)] hover:shadow-[0_0_12px_var(--atmo-bg)] transition-all cursor-pointer"
              title="Share story"
            >
              <Share2 className="w-4 h-4 sm:w-4 sm:h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2.5 sm:p-2.5 bg-black/60 backdrop-blur-md hover:bg-white/[0.05] border border-white/5 rounded-full text-slate-300 hover:text-[var(--atmo-text)] hover:shadow-[0_0_12px_var(--atmo-bg)] transition-all cursor-pointer"
              aria-label="Close portal"
              id="close-modal-btn"
            >
              <X className="w-4 h-4 sm:w-4 sm:h-4" />
            </button>
          </div>
          )}

          {/* Scrolling Content Canvas */}
          <div ref={contentScrollRef} onScroll={onContentScroll} className="flex-1 overflow-y-auto custom-scrollbar">

            {/* Hero Cover Frame */}
            <div className="relative w-full h-[16rem] sm:h-[20rem] md:h-[25rem] overflow-hidden">
              <img
                src={optimizeImageUrl(story.cover || "https://cdn-images-1.medium.com/proxy/1*TGH72Nnw24QL3iV9IOm4VA.png", 800)}
                alt={story.title}
                referrerPolicy="no-referrer"
                width="800"
                height="400"
                sizes="100vw"
                decoding="async"
                loading="eager"
                fetchPriority="high" as any
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = "https://cdn-images-1.medium.com/proxy/1*TGH72Nnw24QL3iV9IOm4VA.png";
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/40 to-black/30" />
              
              {/* Bottom Hero Overlay */}
              <div className="absolute bottom-4 left-4 right-4 sm:bottom-6 sm:left-6 sm:right-6 space-y-2 sm:space-y-3 max-w-3xl">
                {/* Categories */}
                <div className="flex flex-wrap gap-2">
                  {story.categories.map((cat) => (
                    <span
                      key={cat}
                      className="px-2.5 py-1 rounded-none font-mono text-[9px] uppercase tracking-wider bg-black/80 text-[var(--atmo-text)] border border-[var(--atmo-text)]/20"
                    >
                      {cat}
                    </span>
                  ))}
                </div>

                {/* Title */}
                <h1 className="font-sans font-bold text-2xl md:text-4xl text-white leading-tight tracking-tight uppercase">
                  {story.title}
                </h1>
              </div>
            </div>

            {/* Main Editorial Copy */}
            <div className="p-6 md:p-10 space-y-8 max-w-3xl mx-auto">
              {/* Author Card Row */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-3 sm:p-4 bg-white/[0.02] border border-white/5 rounded-none font-mono text-xs">
                <div className="flex items-center gap-2 sm:gap-3">
                  <AvatarImage
                    src={story.avatar}
                    alt={story.author}
                    fallbackSrc=""
                    className="w-7 h-7 sm:w-9 sm:h-9 rounded-none object-cover border border-white/5"
                  />
                  <div>
                    <h4 className="font-sans font-bold text-white uppercase tracking-wider text-xs sm:text-sm">{story.author}</h4>
                    <p className="text-[9px] sm:text-[10px] text-[var(--atmo-text)] font-mono tracking-widest uppercase mt-0.5">{story.role}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-slate-400">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-[var(--atmo-text)]" />
                    {new Date(story.pubDate).toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                </div>
              </div>

              {/* Interactions Toolbar: Likes, Saves, and Social Sharing Suite */}
              <div className="flex flex-wrap items-center justify-between gap-3 py-3 px-3 sm:px-4 border-l-2 border-[var(--atmo-text)] bg-white/[0.02] border-t border-b border-r border-white/5 font-mono text-xs text-slate-400">
                {/* Left: Like & Save triggers */}
                <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto justify-between sm:justify-start">
                  <button
                    onClick={() => onToggleLike(story.slug)}
                    className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 sm:py-1.5 border border-white/5 hover:border-[var(--atmo-text)]/50 hover:text-[var(--atmo-text)] hover:bg-[var(--atmo-text)]/10 transition-all cursor-pointer rounded-full min-h-[36px] sm:min-h-[40px] ${
                      isLiked ? "text-[var(--atmo-text)] border-[var(--atmo-text)]/30 bg-[var(--atmo-text)]/10 font-bold" : ""
                    }`}
                    title={isLiked ? "Unlike story" : "Like story"}
                  >
                    <Heart className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isLiked ? "fill-current text-[var(--atmo-text)]" : ""}`} />
                    <span className="text-[10px] sm:text-xs">{getLikesCount(story.title, isLiked)} Likes</span>
                  </button>

                  <button
                    onClick={() => onToggleSave(story.slug)}
                    className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 sm:py-1.5 border border-white/5 hover:border-[var(--atmo-text)]/50 hover:text-[var(--atmo-text)] hover:bg-[var(--atmo-text)]/10 transition-all cursor-pointer rounded-full min-h-[36px] sm:min-h-[40px] ${
                      isSaved ? "text-[var(--atmo-text)] border-[var(--atmo-text)]/30 bg-[var(--atmo-text)]/10 font-bold" : ""
                    }`}
                    title={isSaved ? "Remove from saved archive" : "Save to library archive"}
                  >
                    <Bookmark className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isSaved ? "fill-current text-[var(--atmo-text)]" : ""}`} />
                    <span className="text-[10px] sm:text-xs">{isSaved ? "Saved" : "Save Story"}</span>
                  </button>
                </div>

                {/* Right: Social Media Transmissions */}
                <div className="flex items-center gap-1.5 sm:gap-2 w-full sm:w-auto justify-center sm:justify-end border-t border-white/5 sm:border-0 pt-2 sm:pt-0">
                  <span className="text-[9px] sm:text-[10px] uppercase tracking-widest text-slate-500 hidden sm:inline">Transmit:</span>
                  
                   <a
                     href={getShareUrl("twitter", story.title, story.link)}
                     target="_blank"
                     rel="noopener noreferrer"
                     className="p-2 sm:p-1.5 bg-black/40 hover:bg-[var(--atmo-text)]/10 border border-white/5 hover:border-[var(--atmo-text)]/30 text-slate-400 hover:text-[var(--atmo-text)] transition-all cursor-pointer rounded-full min-w-[32px] sm:min-w-[36px] min-h-[32px] sm:min-h-[36px] flex items-center justify-center"
                     title="Transmit on X"
                   >
                     <Twitter className="w-3.5 h-3.5 sm:w-3.5 sm:h-3.5" />
                   </a>

                   <a
                     href={getShareUrl("linkedin", story.title, story.link)}
                     target="_blank"
                     rel="noopener noreferrer"
                     className="p-2 sm:p-1.5 bg-black/40 hover:bg-[var(--atmo-text)]/10 border border-white/5 hover:border-[var(--atmo-text)]/30 text-slate-400 hover:text-[var(--atmo-text)] transition-all cursor-pointer rounded-full min-w-[32px] sm:min-h-[36px] min-h-[32px] sm:min-h-[36px] flex items-center justify-center"
                     title="Share on LinkedIn"
                   >
                     <Linkedin className="w-3.5 h-3.5" />
                   </a>

                   <a
                     href={getShareUrl("facebook", story.title, story.link)}
                     target="_blank"
                     rel="noopener noreferrer"
                     className="p-2 sm:p-1.5 bg-black/40 hover:bg-[var(--atmo-text)]/10 border border-white/5 hover:border-[var(--atmo-text)]/30 text-slate-400 hover:text-[var(--atmo-text)] transition-all cursor-pointer rounded-full min-w-[32px] sm:min-w-[36px] min-h-[32px] sm:min-h-[36px] flex items-center justify-center"
                     title="Share on Facebook"
                   >
                     <Facebook className="w-3.5 h-3.5" />
                   </a>

                   <button
                     onClick={handleCopyLink}
                     className="p-2 sm:p-1.5 bg-black/40 hover:bg-[var(--atmo-text)]/10 border border-white/5 hover:border-[var(--atmo-text)]/30 text-slate-400 hover:text-[var(--atmo-text)] transition-all cursor-pointer flex items-center justify-center gap-1.5 rounded-full min-w-[32px] sm:min-w-[36px] min-h-[32px] sm:min-h-[36px]"
                     title="Copy direct portal link"
                   >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-[var(--atmo-text)]" />
                        <span className="text-[9px] text-[var(--atmo-text)] uppercase font-bold pr-1">Copied!</span>
                      </>
                    ) : (
                      <Link className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Reading Toolbar: typography & focus controls */}
              <div className="flex flex-wrap items-center justify-between gap-2 py-2.5 px-3 sm:px-4 border border-white/5 bg-white/[0.02] font-mono text-[10px] uppercase tracking-widest text-slate-400">
                <span className="flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-[var(--atmo-text)]" />
                  {readTime} min read
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setFontScale((s) => Math.max(0.85, Math.round((s - 0.1) * 100) / 100))}
                    className="px-2 py-1 rounded hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
                    aria-label="Decrease font size"
                  >A−</button>
                  <button
                    onClick={() => setFontScale((s) => Math.min(1.3, Math.round((s + 0.1) * 100) / 100))}
                    className="px-2 py-1 rounded hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
                    aria-label="Increase font size"
                  >A+</button>
                  <button
                    onClick={() => setUseSerif((v) => !v)}
                    className={`flex items-center gap-1 px-2 py-1 rounded transition-colors cursor-pointer ${useSerif ? "text-[var(--atmo-text)]" : "hover:text-white"}`}
                    aria-pressed={useSerif}
                    title="Toggle serif type"
                  >
                    <Type className="w-3 h-3" /> Serif
                  </button>
                  <button
                    onClick={() => setFocusMode((v) => !v)}
                    className={`flex items-center gap-1 px-2 py-1 rounded transition-colors cursor-pointer ${focusMode ? "text-[var(--atmo-text)]" : "hover:text-white"}`}
                    aria-pressed={focusMode}
                    title="Toggle focus mode"
                  >
                    <Eye className="w-3 h-3" /> Focus
                  </button>
                </div>
              </div>

              {/* Renders Content safely with absolute professional typography styling.
                  fontScale scales via the wrapper font-size; serif + focus modes apply
                  through data attributes (see .story-copy in index.css). */}
              <div
                className={`story-copy prose prose-invert prose-cyan max-w-none text-slate-300 leading-relaxed space-y-5
                  prose-headings:font-sans prose-headings:font-semibold prose-headings:text-white prose-headings:tracking-tight
                  prose-p:mb-4
                  prose-figure:my-6 prose-figure:rounded-none prose-figure:overflow-hidden prose-figure:border prose-figure:border-white/5
                  prose-img:rounded-none prose-img:w-full prose-img:object-cover
                  prose-a:text-[var(--atmo-text)] prose-a:underline hover:prose-a:text-white transition-colors
                  ${focusMode ? "mx-auto" : ""}`}
                data-serif={useSerif}
                data-focus={focusMode}
                style={{ fontSize: `${0.95 * fontScale}rem` }}
              >
                {story.content ? (
                  <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(optimizeContentHtml(story.content)) }} />
                ) : (
                  <div className="space-y-4">
                    <p className="text-slate-300 leading-relaxed font-sans">{story.description}</p>
                    <p className="text-xs text-slate-500 italic">No further content stream in feed preview.</p>
                  </div>
                )}
              </div>

              {/* Divider */}
              <div className="w-full h-px bg-white/5 my-6 sm:my-8" />

              {/* Call to Action: Read on Medium */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 p-4 sm:p-6 bg-white/[0.02] border border-white/5 rounded-none text-center sm:text-left">
                <div className="space-y-1">
                  <h4 className="font-sans text-sm font-semibold text-white flex items-center justify-center sm:justify-start gap-1 uppercase">
                    <Compass className="w-4 h-4 text-[var(--atmo-text)]" />
                    Enjoying this piece from The Ink Home?
                  </h4>
                  <p className="text-xs text-slate-400">
                    Interact directly with the authors and view comments on the official publication site on Medium.
                  </p>
                </div>
                
                <a
                  href={story.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-5 py-2.5 bg-white text-black font-extrabold uppercase tracking-widest text-[11px] hover:bg-[var(--atmo-text)] hover:shadow-[0_0_15px_var(--atmo-glow)] transition-all cursor-pointer rounded-full"
                >
                  Medium Article
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>

              {/* Continuous Reading: Read next story — keeps readers in the app */}
              {nextStory && (
                <button
                  onClick={() => onSelectStory(nextStory)}
                  className="w-full flex items-center justify-between gap-3 p-4 sm:p-5 border border-white/5 bg-gradient-to-r from-white/[0.03] to-transparent hover:border-[var(--atmo-text)] hover:from-[var(--atmo-text)]/5 transition-all duration-300 group cursor-pointer text-left rounded-none"
                  aria-label={`Read next story: ${nextStory.title}`}
                >
                  <div className="space-y-1 min-w-0">
                    <span className="flex items-center gap-1.5 text-[9px] sm:text-[10px] font-mono uppercase tracking-widest text-[var(--atmo-text)]">
                      <BookMarked className="w-3.5 h-3.5" />
                      Read Next
                    </span>
                    <h4 className="font-sans font-semibold text-white uppercase tracking-tight text-sm sm:text-base line-clamp-2 group-hover:text-[var(--atmo-text)] transition-colors">
                      {nextStory.title}
                    </h4>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-[var(--atmo-text)] shrink-0 transition-colors" />
                </button>
              )}

              {/* Growth funnel: contribute + subscribe after reading */}
              <div className="border border-white/5 bg-gradient-to-br from-white/[0.03] to-transparent p-4 sm:p-5 space-y-3">
                <div className="flex items-start gap-3">
                  <Compass className="w-4 h-4 text-[var(--atmo-text)] shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <h4 className="font-sans font-semibold text-white uppercase tracking-wider text-sm">Join the words at home</h4>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Enjoyed this piece? Contribute your own editorial, or get new stories delivered as they're published.
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => {
                      analytics.contribute(story.slug);
                      onContribute();
                    }}
                    className="flex items-center gap-1.5 px-4 py-2 bg-[var(--atmo-text)] text-black font-bold uppercase tracking-widest text-[10px] hover:shadow-[0_0_15px_var(--atmo-glow)] transition-all cursor-pointer rounded-full"
                  >
                    <Feather className="w-3.5 h-3.5" /> Submit a story
                  </button>
                  <Subscribe />
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
