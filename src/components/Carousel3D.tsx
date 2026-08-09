import React, { useState, useEffect, useRef } from "react";
import { Story } from "../types";
import { ChevronLeft, ChevronRight, ArrowUpRight, Flame, Layers, Heart, Bookmark } from "lucide-react";
import { getLikesCount } from "../lib/interaction";
import { optimizeImageUrl } from "../lib/images";
import AvatarImage from "./AvatarImage";

interface Carousel3DProps {
  stories: Story[];
  onSelectStory: (story: Story) => void;
  likedSlugs: string[];
  savedSlugs: string[];
  onToggleLike: (slug: string) => void;
  onToggleSave: (slug: string) => void;
}

// Cache last-written values per element so we only touch the DOM when a value
// actually changes (prevents needless style writes every rAF frame).
const lastTransform = new WeakMap<HTMLElement, string>();
const lastOpacity = new WeakMap<HTMLElement, string>();

// Continuous-rotation responsiveness: higher = faster, snappier glide.
const ROTATION_SPEED = 7; // ~0.3s ease between featured cards
const AUTOPLAY_MS = 2200; // faster rotation between featured cards

export default function Carousel3D({
  stories,
  onSelectStory,
  likedSlugs,
  savedSlugs,
  onToggleLike,
  onToggleSave
}: Carousel3DProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [autoplay, setAutoplay] = useState(true);

  const containerRef = useRef<HTMLDivElement>(null);
  const dragStartX = useRef(0);

  // Live refs read by the rAF loop (stable across renders, no stale closures).
  const activeIndexRef = useRef(activeIndex);
  activeIndexRef.current = activeIndex;
  const storiesRef = useRef(stories);
  storiesRef.current = stories;
  const slugIndexRef = useRef<Map<string, number>>(new Map());
  stories.forEach((s, i) => slugIndexRef.current.set(s.slug, i));

  // Fractional rotation position (in story slots). eases toward activeIndex.
  const rotRef = useRef(0);
  // Drag offset in px applied to the active card (ref only — no per-move re-render).
  const dragOffsetRef = useRef(0);
  // Mounted card DOM nodes keyed by story slug.
  const cardEls = useRef<Map<string, HTMLDivElement>>(new Map());
  // rAF scheduler (self-gated — only ticks while animating or dragging).
  const rafIdRef = useRef<number | null>(null);
  const lastTickRef = useRef(0);
  const startLoopRef = useRef<() => void>(() => {});

  const n = stories.length;

  // Autoplay loop — steps the *target* card; the rAF loop glides toward it.
  useEffect(() => {
    if (!autoplay || stories.length <= 1) return;
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % stories.length);
    }, AUTOPLAY_MS);
    return () => clearInterval(interval);
  }, [autoplay, stories.length]);

  const handleNext = () => {
    if (stories.length === 0) return;
    setActiveIndex((prev) => (prev + 1) % stories.length);
  };

  const handlePrev = () => {
    if (stories.length === 0) return;
    setActiveIndex((prev) => (prev - 1 + stories.length) % stories.length);
  };

  // Drag and swipe mechanics — dragOffset lives in a ref so the rAF loop reads it
  // directly and the drag stays buttery without a React re-render per move.
  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    dragOffsetRef.current = 0;
    dragStartX.current = e.clientX;
    setAutoplay(false); // Pause autoplay on drag
    startLoopRef.current(); // wake loop for the drag nudge
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    const diff = e.clientX - dragStartX.current;
    dragOffsetRef.current = diff;

    // Swipe sensitivity threshold
    if (Math.abs(diff) > 75) {
      if (diff > 0) {
        handlePrev();
      } else {
        handleNext();
      }
      setIsDragging(false);
      dragOffsetRef.current = 0;
    }
  };

  const handlePointerUp = () => {
    setIsDragging(false);
    dragOffsetRef.current = 0;
  };

  // Compute the spatial layout for a (possibly fractional) slot offset.
  // `dragX` nudges the active card along X during a pointer drag.
  const layoutFor = (offset: number, dragX = 0) => {
    const w = window.innerWidth;
    const abs = Math.abs(offset);
    let rotateY = offset * -32;
    let tx = offset * 160;
    let tz = abs * -160;
    let scale = 1 - abs * 0.15;
    let opacity = 1 - abs * 0.35;

    if (w < 640) {
      rotateY = offset * -15;
      tx = offset * 65;
      tz = abs * -80;
      scale = 1 - abs * 0.12;
      opacity = 1 - abs * 0.55;
    } else if (w < 1024) {
      rotateY = offset * -24;
      tx = offset * 100;
      tz = abs * -110;
      scale = 1 - abs * 0.14;
      opacity = 1 - abs * 0.45;
    } else if (w < 1440) {
      rotateY = offset * -28;
      tx = offset * 125;
      tz = abs * -135;
      scale = 1 - abs * 0.15;
      opacity = 1 - abs * 0.35;
    }

    return {
      transform: `translate3d(${tx + dragX}px, 0, ${tz}px) rotateY(${rotateY}deg) scale(${Math.max(scale, 0.6)})`,
      opacity: String(Math.max(0, Math.min(1, opacity))),
    };
  };

  // Build the transform for one card (idx) at a given offset, adding the drag nudge.
  const cardStyleFor = (idx: number, offset: number) => {
    const drag = idx === activeIndexRef.current ? dragOffsetRef.current : 0;
    return layoutFor(offset, drag);
  };

  // Write a card's style, skipping unchanged values to minimize DOM writes.
  const applyCard = (el: HTMLDivElement, idx: number, offset: number) => {
    const { transform, opacity } = cardStyleFor(idx, offset);
    if (lastTransform.get(el) !== transform) {
      el.style.transform = transform;
      lastTransform.set(el, transform);
    }
    if (lastOpacity.get(el) !== opacity) {
      el.style.opacity = opacity;
      lastOpacity.set(el, opacity);
    }
  };

  // Register a card element and position it immediately (avoids a 1-frame flash at origin).
  const registerCard = (slug: string) => (el: HTMLDivElement | null) => {
    if (!el) {
      cardEls.current.delete(slug);
      return;
    }
    cardEls.current.set(slug, el);
    const idx = slugIndexRef.current.get(slug);
    if (idx === undefined || n === 0) return;
    let offset = ((idx - rotRef.current) % n + n) % n;
    if (offset > n / 2) offset -= n;
    applyCard(el, idx, offset);
  };

  // Main loop: ease the fractional rotation toward the target card and update all
  // mounted cards on the compositor. Self-gating: the rAF loop only ticks while a
  // rotation is in motion or a drag is active, so an idle carousel costs ~nothing.
  useEffect(() => {
    const applyAll = () => {
      const count = storiesRef.current.length;
      if (count === 0) return;
      cardEls.current.forEach((el, slug) => {
        const idx = slugIndexRef.current.get(slug);
        if (idx === undefined) return;
        let offset = ((idx - rotRef.current) % count + count) % count;
        if (offset > count / 2) offset -= count;
        applyCard(el, idx, offset);
      });
    };

    const tick = (now: number) => {
      const dt = Math.min((now - lastTickRef.current) / 1000, 0.1);
      lastTickRef.current = now;

      const count = storiesRef.current.length;
      let inMotion = false;
      if (count > 1) {
        const target = activeIndexRef.current;
        let diff = target - rotRef.current;
        diff = ((diff % count) + count) % count;
        if (diff > count / 2) diff -= count; // shortest wrap path
        if (Math.abs(diff) < 0.0005) {
          rotRef.current = target; // snap when settled
        } else {
          rotRef.current += diff * (1 - Math.exp(-ROTATION_SPEED * dt)); // frame-rate-independent ease
          inMotion = true;
        }
      }
      if (dragOffsetRef.current !== 0) inMotion = true;

      applyAll();
      if (inMotion) {
        rafIdRef.current = requestAnimationFrame(tick);
      } else {
        rafIdRef.current = null; // idle — stop the loop until something wakes it
      }
    };

    startLoopRef.current = () => {
      if (rafIdRef.current == null) {
        lastTickRef.current = performance.now();
        rafIdRef.current = requestAnimationFrame(tick);
      }
    };

    startLoopRef.current();
    return () => {
      if (rafIdRef.current != null) cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    };
  }, []);

  // Wake the loop whenever the target card changes so it glides there.
  useEffect(() => {
    startLoopRef.current();
  }, [activeIndex]);

  // Re-apply positions on resize (layoutFor reads window.innerWidth) even when idle.
  useEffect(() => {
    const onResize = () => startLoopRef.current();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  if (stories.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-gray-400">
        <p className="font-mono text-sm tracking-widest uppercase">Initializing Quantum Scribe Link...</p>
      </div>
    );
  }

  // Mount a slightly wider window (±3) so cards are always present mid-transition.
  const visible = stories
    .map((story, idx) => {
      let offset = idx - activeIndex;
      offset = ((offset % n) + n) % n;
      if (offset > n / 2) offset -= n;
      return { story, idx, offset, absOffset: Math.abs(offset) };
    })
    .filter(({ absOffset }) => absOffset <= 3);

  // Center a capped row of pagination pips on the active slide.
  const MAX_PIPS = 7;
  let pipStart = Math.max(0, activeIndex - Math.floor(MAX_PIPS / 2));
  let pipEnd = Math.min(n, pipStart + MAX_PIPS);
  if (pipEnd - pipStart < MAX_PIPS) pipStart = Math.max(0, pipEnd - MAX_PIPS);
  const pips = stories.slice(pipStart, pipEnd).map((_, i) => pipStart + i);

  return (
    <div className="w-full flex flex-col items-center justify-center select-none">
      <div
        ref={containerRef}
        className="relative flex items-center justify-center w-full h-[20rem] sm:h-[24rem] md:h-[28rem] overflow-visible cursor-grab active:cursor-grabbing touch-none px-2 sm:px-4"
        style={{ perspective: "1000px", willChange: "transform" }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      >
        {visible.map(({ story, idx, absOffset }) => {
          const isActive = idx === activeIndex;

          return (
            <div
              key={story.slug}
              ref={registerCard(story.slug)}
              className="absolute w-[13rem] xs:w-[15rem] sm:w-[17.5rem] md:w-[21rem] lg:w-[23rem] max-w-[85vw] group"
              id={`carousel-card-${story.slug}`}
              style={{
                zIndex: stories.length - absOffset,
                transformStyle: "preserve-3d",
                willChange: "transform",
              }}
              onClick={() => {
                // Click/tap: open active card, or rotate to an inactive one.
                if (isActive) {
                  onSelectStory(story);
                } else {
                  setActiveIndex(idx);
                  setAutoplay(false);
                }
              }}
            >
              {/* Story Panel Board - Glass Card */}
              <div className={`relative flex flex-col justify-between h-[18rem] xs:h-[20rem] sm:h-[24rem] md:h-[25rem] p-3 sm:p-5 rounded-none border transition-all duration-300 overflow-hidden glass-card ${
                isActive
                  ? "border-[var(--atmo-text)] shadow-[0_0_40px_var(--atmo-glow),0_20px_60px_-15px_rgba(0,0,0,0.8)] bg-[#070709]/95"
                  : "border-white/5 hover:border-white/15 bg-black/60 shadow-lg"
              }`}>

                {/* Subtle Neon Accents inside card */}
                <div className={`absolute top-0 left-0 w-full h-[2px] transition-all duration-500 ${
                  isActive ? "bg-[var(--atmo-text)] atmosphere-bg" : "bg-transparent"
                }`} />

                {/* Ambient Glow behind image */}
                <div className="absolute -inset-1 bg-gradient-to-r from-[var(--atmo-text)]/20 to-[var(--atmo-text)]/10 rounded-none opacity-0 group-hover:opacity-5 transition-opacity duration-500 blur-xl pointer-events-none" />

                {/* Top: Image Section */}
                <div className="relative w-full h-28 sm:h-36 md:h-40 rounded-none overflow-hidden mb-3 sm:mb-4 border border-white/5 z-10 select-none">
                  <img
                    src={optimizeImageUrl(story.cover || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80", 720)}
                    alt={story.title}
                    referrerPolicy="no-referrer"
                    width="400"
                    height="300"
                    sizes="(max-width: 640px) 85vw, (max-width: 1024px) 50vw, 33vw"
                    decoding="async"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 select-none"
                    loading="lazy"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80";
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/20" />

                  {/* Floating Categories */}
                  <div className="absolute bottom-2 left-2 flex flex-wrap gap-1">
                    {story.categories.slice(0, 2).map((cat, cIdx) => (
                      <span
                        key={cIdx}
                        className="px-2 py-0.5 rounded-none font-mono text-[8px] sm:text-[9px] tracking-widest uppercase bg-black/80 text-[var(--atmo-text)] border border-[var(--atmo-text)]/20"
                      >
                        {cat}
                      </span>
                    ))}
                  </div>

                  {/* Auto-Rotation Flare indicator */}
                  {isActive && (
                    <div className="absolute top-2 right-2 flex items-center gap-1 px-1.5 py-0.5 rounded-none bg-[var(--atmo-text)] text-black text-[8px] sm:text-[9px] font-mono tracking-widest uppercase font-black shadow-[0_0_8px_var(--atmo-glow)]">
                      <Flame className="w-2.5 h-2.5" />
                      Featured
                    </div>
                  )}
                </div>

                {/* Middle: Content Section */}
                <div className="flex-1 flex flex-col justify-between z-10">
                  <div>
                    {/* Author Line */}
                    <div className="flex items-center justify-between gap-2 mb-1.5 sm:mb-2">
                      <div className="flex items-center gap-1.5 sm:gap-2">
                        <AvatarImage
                          src={story.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde"}
                          alt={story.author}
                          className="w-4 h-4 sm:w-5 sm:h-5 rounded-none object-cover border border-white/10"
                        />
                        <span className="text-[9px] sm:text-[10px] sm:text-[11px] font-mono tracking-wider text-slate-400">
                          {story.author}
                        </span>
                      </div>

                      {/* Interactive heart & save controls */}
                      <div className="flex items-center gap-1 z-20">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleLike(story.slug);
                          }}
                          className={`p-1 transition-colors cursor-pointer flex items-center gap-1 text-[9px] sm:text-[10px] font-mono min-w-[28px] min-h-[28px] justify-center ${
                            likedSlugs.includes(story.slug) ? "text-[var(--atmo-text)] font-bold" : "text-slate-500 hover:text-[var(--atmo-text)]"
                          }`}
                          title={likedSlugs.includes(story.slug) ? "Unlike" : "Like"}
                        >
                          <Heart className={`w-3 h-3 sm:w-3.5 sm:h-3.5 ${likedSlugs.includes(story.slug) ? "fill-current text-[var(--atmo-text)]" : ""}`} />
                          <span>{getLikesCount(story.title, likedSlugs.includes(story.slug))}</span>
                        </button>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleSave(story.slug);
                          }}
                          className={`p-1 transition-colors cursor-pointer min-w-[28px] min-h-[28px] flex items-center justify-center ${
                            savedSlugs.includes(story.slug) ? "text-[var(--atmo-text)]" : "text-slate-500"
                          }`}
                          title={savedSlugs.includes(story.slug) ? "Remove bookmark" : "Bookmark"}
                        >
                          <Bookmark className={`w-3 h-3 sm:w-3.5 sm:h-3.5 ${savedSlugs.includes(story.slug) ? "fill-current" : ""}`} />
                        </button>
                      </div>
                    </div>

                    {/* Title */}
                    <h3 className={`font-sans tracking-tight transition-all duration-300 text-sm sm:text-base ${
                      isActive ? "text-white font-bold uppercase" : "text-gray-300"
                    }`}>
                      {story.title}
                    </h3>

                    {/* Description */}
                    <p className="text-[10px] sm:text-[11px] sm:text-xs text-gray-400 line-clamp-2 mt-1 sm:mt-2 leading-relaxed font-light hidden sm:block">
                      {story.description}
                    </p>
                  </div>

                  {/* Bottom: Date & Interactive trigger */}
                  <div className="flex items-center justify-between mt-2 sm:mt-3 md:mt-4 pt-2 sm:pt-3 border-t border-white/5">
                    <span className="text-[8px] sm:text-[9px] sm:text-[10px] font-mono text-gray-500 uppercase tracking-wider">
                      {new Date(story.pubDate).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric"
                      })}
                    </span>

                    {isActive && (
                      <span className="flex items-center gap-1 text-[9px] sm:text-[10px] font-mono text-[var(--atmo-text)] font-bold group-hover:text-white transition-colors">
                        E
                        <ArrowUpRight className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[var(--atmo-text)]" />
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Manual UI Navigation Row */}
      <div className="flex items-center gap-4 sm:gap-6 mt-6 sm:mt-8 z-20">
        <button
          onClick={handlePrev}
          className="p-2.5 sm:p-3 bg-[#111113]/80 border border-white/5 text-white/70 hover:text-black hover:bg-[var(--atmo-text)] hover:border-[var(--atmo-text)] active:scale-95 transition-all duration-300 cursor-pointer rounded-full shadow-lg"
          id="prev-carousel-btn"
          aria-label="Previous story card"
        >
          <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>

        {/* Dynamic Pagination Pips */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {pips.map((index) => (
            <button
              key={index}
              onClick={() => {
                setActiveIndex(index);
                setAutoplay(false);
              }}
              className={`h-2 w-2 sm:h-1.5 sm:w-1.5 transition-all duration-500 rounded-full cursor-pointer ${
                index === activeIndex
                  ? "w-5 sm:w-8 bg-[var(--atmo-text)] shadow-[0_0_8px_var(--atmo-glow)]"
                  : "w-2 sm:w-1.5 bg-white/20 hover:bg-white/40"
              }`}
              aria-label={`Jump to slide ${index + 1}`}
            />
          ))}
        </div>

        <button
          onClick={handleNext}
          className="p-2.5 sm:p-3 bg-[#111113]/80 border border-white/5 text-white/70 hover:text-black hover:bg-[var(--atmo-text)] hover:border-[var(--atmo-text)] active:scale-95 transition-all duration-300 cursor-pointer rounded-full shadow-lg"
          id="next-carousel-btn"
          aria-label="Next story card"
        >
          <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>
      </div>
    </div>
  );
}
