import React from "react";

/**
 * The Ink Home's own assistant mark — a stylized ink drop / nib.
 * Distinct from the generic sparkle glyph so the product reads as its own.
 */
export default function InkMark({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M12 3 C7.5 3 4 6.6 4 11.2 C4 16.4 8.4 20.5 12 21 C15.6 20.5 20 16.4 20 11.2 C20 6.6 16.5 3 12 3 Z" />
      <path d="M12 7.5 L12 15.5" />
      <path d="M9.5 11 L12 15.5 L14.5 11" />
      <circle cx="12" cy="6" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  );
}
