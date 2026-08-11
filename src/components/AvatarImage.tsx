import { useState, useEffect } from "react";
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
  fallbackSrc = "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde"
}: AvatarImageProps) {
  const [currentSrc, setCurrentSrc] = useState<string>(src);
  const [triedFallback, setTriedFallback] = useState<boolean>(false);

  useEffect(() => {
    setCurrentSrc(src);
    setTriedFallback(false);
  }, [src]);

  // Avatars render at 14–80px; always fetch a small variant, never the full-res
  // original (the raw Unsplash default is ~2.7MB). 128px covers 2x retina at
  // the largest displayed size.
  const displaySrc = optimizeImageUrl(currentSrc, 128);

  return (
    <img
      src={displaySrc}
      alt={alt}
      referrerPolicy="no-referrer"
      className={className}
      onError={() => {
        if (!triedFallback) {
          setTriedFallback(true);
          setCurrentSrc(fallbackSrc);
        }
      }}
    />
  );
}
