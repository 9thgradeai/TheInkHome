import { useState } from "react";
import { hashString } from "../lib/format";

interface StoryCoverProps {
  src?: string;
  alt: string;
  seed?: string;
  className?: string;
  sizes?: string;
  priority?: boolean;
}

/** Warm, theme-aware washes used when a story has no usable cover image. */
const WASHES = [
  "linear-gradient(145deg, color-mix(in srgb, var(--accent) 55%, var(--sunken)) 0%, var(--sunken) 70%)",
  "linear-gradient(145deg, color-mix(in srgb, var(--ink) 22%, var(--sunken)) 0%, var(--sunken) 75%)",
  "linear-gradient(160deg, color-mix(in srgb, var(--accent) 30%, var(--sunken)) 0%, color-mix(in srgb, var(--ink) 14%, var(--sunken)) 100%)",
  "linear-gradient(200deg, var(--sunken) 0%, color-mix(in srgb, var(--accent) 38%, var(--sunken)) 100%)",
];

export default function StoryCover({
  src,
  alt,
  seed = alt,
  className = "",
  sizes,
  priority,
}: StoryCoverProps) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div
        className={`relative flex items-center justify-center overflow-hidden ${className}`}
        style={{ background: WASHES[hashString(seed) % WASHES.length] }}
        role="img"
        aria-label={alt}
      >
        <span
          aria-hidden="true"
          className="font-display text-[clamp(2.5rem,8vw,4rem)] font-semibold leading-none"
          style={{ color: "color-mix(in srgb, var(--ink) 26%, transparent)" }}
        >
          {alt.trim().charAt(0).toUpperCase() || "T"}
        </span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      sizes={sizes}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      referrerPolicy="no-referrer"
      fetchPriority={priority ? "high" : "auto"}
      onError={() => setFailed(true)}
      className={`h-full w-full object-cover ${className}`}
    />
  );
}
