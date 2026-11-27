import { useEffect, useState } from "react";
import { hashString, initials } from "../lib/format";

interface AuthorAvatarProps {
  name: string;
  src?: string;
  className?: string;
}

/** Tinted monogram backgrounds — derived from the palette, not a rainbow. */
const TINTS = [
  { background: "var(--accent)", color: "var(--on-accent)" },
  { background: "var(--ink)", color: "var(--on-ink)" },
  {
    background: "color-mix(in srgb, var(--accent) 42%, var(--raised))",
    color: "var(--ink)",
  },
  {
    background: "color-mix(in srgb, var(--ink) 16%, var(--raised))",
    color: "var(--ink)",
  },
  {
    background: "color-mix(in srgb, var(--accent) 70%, var(--ink))",
    color: "var(--on-accent)",
  },
  {
    background: "color-mix(in srgb, var(--ink) 34%, var(--raised))",
    color: "var(--on-ink)",
  },
];

export default function AuthorAvatar({ name, src, className = "" }: AuthorAvatarProps) {
  const [failed, setFailed] = useState(!src);

  useEffect(() => {
    setFailed(!src);
  }, [src]);

  if (!src || failed) {
    const tint = TINTS[hashString(name) % TINTS.length];
    return (
      <div
        className={`flex shrink-0 items-center justify-center rounded-full font-display font-semibold tracking-tight ${className}`}
        style={tint}
        role="img"
        aria-label={name}
      >
        {initials(name)}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={name}
      referrerPolicy="no-referrer"
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
      className={`shrink-0 rounded-full object-cover ${className}`}
    />
  );
}
