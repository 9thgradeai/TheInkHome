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

const gradients = [
  "linear-gradient(135deg, #1b2a12 0%, #3d5a1e 45%, #c8ff4d 140%)",
  "linear-gradient(135deg, #151b33 0%, #3a2d63 45%, #a78bfa 140%)",
  "linear-gradient(135deg, #2a1515 0%, #5c2a2a 45%, #fca5a5 140%)",
  "linear-gradient(135deg, #0f2626 0%, #14504a 45%, #5eead4 140%)",
  "linear-gradient(135deg, #2a2210 0%, #5c4815 45%, #fbbf24 140%)",
  "linear-gradient(135deg, #241528 0%, #4c2154 45%, #f472b6 140%)",
];

export default function StoryCover({ src, alt, seed = alt, className = "", sizes, priority }: StoryCoverProps) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div
        className={`relative flex items-center justify-center overflow-hidden ${className}`}
        style={{ background: gradients[hashString(seed) % gradients.length] }}
        role="img"
        aria-label={alt}
      >
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              "radial-gradient(circle at 30% 20%, rgba(255,255,255,0.5), transparent 45%), radial-gradient(circle at 80% 80%, rgba(0,0,0,0.55), transparent 55%)",
          }}
        />
        <svg width="48" height="48" viewBox="0 0 48 48" fill="none" className="relative opacity-70">
          <path d="M8 40V10h8v30H8Zm12 0V18h8v22h-8Zm12 0V24h8v16h-8Z" fill="rgba(0,0,0,0.5)" />
          <path d="M8 40V10h8v30H8Zm12 0V18h8v22h-8Zm12 0V24h8v16h-8Z" stroke="rgba(255,255,255,0.4)" strokeWidth="1" />
        </svg>
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
