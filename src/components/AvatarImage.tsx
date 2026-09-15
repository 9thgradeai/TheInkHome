import { useState } from "react";
import { optimizeImageUrl } from "../lib/images";

interface AvatarImageProps {
  src: string;
  alt: string;
  className?: string;
  fallbackSrc?: string;
}

export default function AvatarImage({
  src,
  alt,
  className = "",
  fallbackSrc,
}: AvatarImageProps) {
  const initials = alt?.trim().split(/\s+/).slice(0, 2).map((s) => s[0]?.toUpperCase()).join("") || "?";
  const uiFallback = `https://ui-avatars.com/api/?name=${encodeURIComponent(alt)}&background=111827&color=fff&size=128&font-size=0.4`;
  const fallback = fallbackSrc || uiFallback;
  // Stable derived src — no useEffect reset that causes flicker on parent re-render
  const [errorStep, setErrorStep] = useState(0); // 0 = src, 1 = fallback, 2 = initials
  const raw = errorStep === 0 ? (src || fallback) : errorStep === 1 ? fallback : "";
  const displaySrc = raw ? optimizeImageUrl(raw, 128) : "";

  if (!displaySrc) {
    return (
      <div className={`${className} flex items-center justify-center bg-zinc-800 text-zinc-300 font-mono text-xs shrink-0`} aria-label={alt}>
        {initials}
      </div>
    );
  }

  return (
    <img
      key={displaySrc}
      src={displaySrc}
      alt={alt}
      referrerPolicy="no-referrer"
      loading="lazy"
      decoding="async"
      className={`${className} shrink-0 bg-zinc-800`}
      onError={() => setErrorStep((s) => (s < 2 ? s + 1 : s))}
    />
  );
}
