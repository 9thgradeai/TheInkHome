import { useEffect, useState } from "react";
import { hashString, initials } from "../lib/format";

interface AuthorAvatarProps {
  name: string;
  src?: string;
  className?: string;
}

const avatars = [
  "linear-gradient(135deg, #c8ff4d, #4d7a1f)",
  "linear-gradient(135deg, #a78bfa, #4c1d95)",
  "linear-gradient(135deg, #fca5a5, #991b1b)",
  "linear-gradient(135deg, #5eead4, #115e59)",
  "linear-gradient(135deg, #fbbf24, #92400e)",
  "linear-gradient(135deg, #f472b6, #831843)",
];

export default function AuthorAvatar({ name, src, className = "" }: AuthorAvatarProps) {
  const [failed, setFailed] = useState(!src);

  useEffect(() => {
    setFailed(!src);
  }, [src]);

  if (!src || failed) {
    return (
      <div
        className={`flex shrink-0 items-center justify-center font-display text-[clamp(10px,28%,28px)] font-bold tracking-wide text-black ${className}`}
        style={{ background: avatars[hashString(name) % avatars.length] }}
        aria-label={name}
        role="img"
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
      className={`shrink-0 object-cover ${className}`}
    />
  );
}
