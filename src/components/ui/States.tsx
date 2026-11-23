import React from "react";
import { RefreshCw, SearchX } from "lucide-react";

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  mediumUrl?: string;
}

export function ErrorState({
  title = "We couldn't reach the publication.",
  message = "The stories live on Medium and are synced from their feed. Check your connection and try again — the archive is always waiting.",
  onRetry,
  mediumUrl = "https://medium.com/the-ink-home",
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className="mt-12 flex flex-col items-center gap-4 rounded-2xl border border-dashed border-white/15 px-6 py-16 text-center"
    >
      <p className="font-display text-2xl font-bold text-white">{title}</p>
      <p className="max-w-md text-sm leading-relaxed text-white/60">{message}</p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="flex items-center gap-2 rounded-full bg-white px-5 py-3 text-[11px] font-bold uppercase tracking-[0.16em] text-black transition-colors hover:bg-[#c8ff4d] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c8ff4d]"
          >
            <RefreshCw className="h-4 w-4" aria-hidden="true" /> Try again
          </button>
        )}
        <a
          href={mediumUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-full border border-white/15 px-5 py-3 text-[11px] font-bold uppercase tracking-[0.16em] text-white/70 transition-colors hover:border-white/40 hover:text-white"
        >
          Open on Medium
        </a>
      </div>
    </div>
  );
}

interface EmptyStateProps {
  title?: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({
  title = "No stories match that search",
  message = "Try a different keyword, or reset the filters to see the full archive.",
  actionLabel = "Reset filters",
  onAction,
}: EmptyStateProps) {
  return (
    <div className="mt-12 flex flex-col items-center gap-4 rounded-2xl border border-dashed border-white/15 py-16 text-center">
      <SearchX className="h-6 w-6 text-white/30" aria-hidden="true" />
      <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-white/60">{title}</p>
      <p className="max-w-sm text-sm text-white/40">{message}</p>
      {onAction && (
        <button
          type="button"
          onClick={onAction}
          className="rounded-full border border-white/15 px-4 py-2 font-mono text-[10px] uppercase tracking-[0.14em] text-white/70 hover:text-white"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
