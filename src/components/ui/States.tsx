import { RefreshCw, SearchX } from "lucide-react";

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({
  title = "We couldn't reach the publication.",
  message = "The stories live on Medium and are synced from their feed. Check your connection and try again — the archive is always waiting.",
  onRetry,
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className="mt-12 flex flex-col items-center gap-4 rounded-2xl border border-dashed border-line-strong px-6 py-16 text-center"
    >
      <p className="font-display text-2xl font-semibold text-ink">{title}</p>
      <p className="max-w-md text-[14.5px] leading-relaxed text-ink-soft">{message}</p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        {onRetry && (
          <button type="button" onClick={onRetry} className="btn btn-solid">
            <RefreshCw className="h-4 w-4" aria-hidden="true" /> Try again
          </button>
        )}
        <a
          href="https://medium.com/the-ink-home"
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-outline"
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
  title = "Nothing matches that search",
  message = "Try a different word, or reset the filters to see the full archive.",
  actionLabel = "Reset filters",
  onAction,
}: EmptyStateProps) {
  return (
    <div className="mt-12 flex flex-col items-center gap-4 rounded-2xl border border-dashed border-line-strong py-16 text-center">
      <SearchX className="h-6 w-6 text-ink-faint" aria-hidden="true" />
      <p className="font-display text-xl font-semibold text-ink">{title}</p>
      <p className="max-w-sm text-[14.5px] leading-relaxed text-ink-soft">{message}</p>
      {onAction && (
        <button type="button" onClick={onAction} className="btn btn-outline">
          {actionLabel}
        </button>
      )}
    </div>
  );
}
