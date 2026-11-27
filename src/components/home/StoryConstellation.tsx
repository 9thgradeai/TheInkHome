import { useEffect, useMemo, useRef, useState } from "react";
import type { Story } from "../../types";

/**
 * Story-ink constellation.
 *
 * The publication's own topic words drift up through the hero like ink rising
 * off a page — each one takes its own path, pace, size and opacity so the
 * field reads as organic rather than gridded. Pauses when offscreen.
 */
export default function StoryConstellation({ stories }: { stories: Story[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [reduce, setReduce] = useState(false);
  const [visible, setVisible] = useState(true);

  const words = useMemo(() => {
    const seen = new Set<string>();
    const out: string[] = [];
    for (const story of stories) {
      for (const raw of story.categories || []) {
        const label = raw.trim();
        if (!label) continue;
        const key = label.toLowerCase();
        if (key === "the-ink-home" || key === "editorial") continue;
        if (seen.has(key)) continue;
        seen.add(key);
        out.push(label);
        if (out.length >= 24) break;
      }
      if (out.length >= 24) break;
    }
    return out;
  }, [stories]);

  // Seeded pseudo-random so positions feel organic but stable across renders.
  const fields = useMemo(() => {
    let seed = 1337;
    const rand = () => {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };
    return words.map((word) => ({
      word,
      left: 4 + rand() * 90,
      delay: rand() * 12,
      duration: 13 + rand() * 9,
      size: 10 + rand() * 7,
      drift: (rand() - 0.5) * 18,
      opacity: 0.65 + rand() * 0.3,
      rotation: (rand() - 0.5) * 12,
    }));
  }, [words]);

  useEffect(() => {
    setReduce(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;
    const io = new IntersectionObserver(
      (entries) => setVisible(entries.some((e) => e.isIntersecting)),
      { threshold: 0.05 },
    );
    io.observe(node);
    return () => io.disconnect();
  }, []);

  if (reduce || fields.length === 0) return null;

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 overflow-hidden transition-opacity duration-700 ${
        visible ? "opacity-100" : "opacity-0"
      }`}
    >
      {fields.map((field, index) => {
        const palette = [
          "var(--accent)",
          "#c0543a",
          "#3a5a7a",
          "#6a7a4a",
          "var(--accent-ink)",
        ];
        const color = palette[index % palette.length];
        return (
          <span
            key={`${field.word}-${index}`}
            className="absolute bottom-[-8%] font-display font-semibold tracking-[-0.02em]"
            style={{
              left: `${field.left}%`,
              fontSize: `${field.size}px`,
              opacity: field.opacity,
              animation: `constellation-rise ${field.duration}s ${field.delay}s linear infinite`,
              willChange: "transform, opacity",
              ["--drift" as string]: `${field.drift}vw`,
              ["--rot" as string]: `${field.rotation}deg`,
              ["--opa" as string]: field.opacity,
              color,
              textShadow: "0 0 22px color-mix(in srgb, currentColor 45%, transparent), 0 2px 8px color-mix(in srgb, var(--paper) 60%, transparent)",
            }}
          >
            {field.word}
          </span>
        );
      })}
    </div>
  );
}
