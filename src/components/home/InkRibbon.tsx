import { useEffect, useRef, useState } from "react";

/**
 * A living ink ribbon.
 *
 * A single wide, soft ink stroke that slowly morphs across the hero — like a
 * brush pulled across wet paper. Pure SVG + SMIL, no canvas, no JS per frame,
 * compositor-friendly, and it freezes entirely under prefers-reduced-motion.
 */
export default function InkRibbon({ className = "" }: { className?: string }) {
  const [reduce, setReduce] = useState(false);

  useEffect(() => {
    setReduce(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);

  if (reduce) {
    return (
      <svg
        aria-hidden="true"
        viewBox="0 0 1440 420"
        preserveAspectRatio="none"
        className={`pointer-events-none absolute inset-0 h-full w-full ${className}`}
      >
        <defs>
          <linearGradient id="ink-ribbon-static" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="var(--accent)" stopOpacity="0" />
            <stop offset="30%" stopColor="var(--accent)" stopOpacity="0.35" />
            <stop offset="70%" stopColor="var(--accent)" stopOpacity="0.28" />
            <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path
          d="M-40,210 C240,120 480,300 720,200 C960,100 1200,300 1480,190"
          fill="none"
          stroke="url(#ink-ribbon-static)"
          strokeWidth="120"
          strokeLinecap="round"
          opacity="0.55"
        />
      </svg>
    );
  }

  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 1440 420"
      preserveAspectRatio="none"
      className={`pointer-events-none absolute inset-0 h-full w-full ${className}`}
    >
      <defs>
        <linearGradient id="ink-ribbon" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="var(--accent)" stopOpacity="0" />
          <stop offset="22%" stopColor="var(--accent)" stopOpacity="0.55" />
          <stop offset="50%" stopColor="var(--accent)" stopOpacity="0.38" />
          <stop offset="78%" stopColor="var(--accent)" stopOpacity="0.5" />
          <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
        </linearGradient>
        <filter id="ink-bleed" x="-20%" y="-20%" width="140%" height="140%">
          <feTurbulence type="fractalNoise" baseFrequency="0.012" numOctaves="2" seed="3" />
          <feDisplacementMap in="SourceGraphic" scale="18" />
          <feGaussianBlur stdDeviation="1.2" />
        </filter>
      </defs>
      <g filter="url(#ink-bleed)" opacity="0.7">
        <path
          d="M-40,210 C240,120 480,300 720,200 C960,100 1200,300 1480,190"
          fill="none"
          stroke="url(#ink-ribbon)"
          strokeWidth="150"
          strokeLinecap="round"
        >
          <animate
            attributeName="d"
            dur="16s"
            repeatCount="indefinite"
            values="
              M-40,210 C240,120 480,300 720,200 C960,100 1200,300 1480,190;
              M-40,230 C260,300 500,110 740,230 C980,330 1220,120 1480,220;
              M-40,190 C220,280 460,100 700,210 C940,320 1180,130 1480,200;
              M-40,210 C240,120 480,300 720,200 C960,100 1200,300 1480,190
            "
          />
        </path>
      </g>
      <g filter="url(#ink-bleed)" opacity="0.4">
        <path
          d="M-40,260 C260,170 500,330 740,250 C980,170 1220,330 1480,240"
          fill="none"
          stroke="url(#ink-ribbon)"
          strokeWidth="60"
          strokeLinecap="round"
        >
          <animate
            attributeName="d"
            dur="22s"
            repeatCount="indefinite"
            values="
              M-40,260 C260,170 500,330 740,250 C980,170 1220,330 1480,240;
              M-40,240 C240,330 480,160 720,260 C960,340 1200,160 1480,250;
              M-40,270 C280,160 520,340 760,240 C1000,160 1240,340 1480,230;
              M-40,260 C260,170 500,330 740,250 C980,170 1220,330 1480,240
            "
          />
        </path>
      </g>
    </svg>
  );
}
