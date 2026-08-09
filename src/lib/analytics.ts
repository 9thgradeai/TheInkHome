/**
 * Lightweight, fire-and-forget event telemetry for The Ink Home.
 *
 * Every call is best-effort: it uses `sendBeacon` (or `fetch keepalive`) and
 * swallows all errors so tracking never blocks or breaks the UI. Events land on
 * the existing `/api/track?event=...` endpoint (Vercel runtime logs; can be
 * bridged to an analytics/observability provider later).
 */

function post(event: string, data?: Record<string, unknown>) {
  try {
    const payload = JSON.stringify(data || {});
    const url = `/api/track?event=${encodeURIComponent(event)}`;
    if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
      navigator.sendBeacon(url, new Blob([payload], { type: "application/json" }));
      return;
    }
    fetch(url, {
      method: "POST",
      body: payload,
      keepalive: true,
      headers: { "Content-Type": "application/json" },
    }).catch(() => {});
  } catch {
    // never throw from analytics
  }
}

export const analytics = {
  /** A story was opened for reading. */
  storyRead(slug: string, title?: string) {
    post("story_read", { slug, title });
  },
  /** Throttled scroll depth within an article (0-100). */
  readDepth(slug: string, depthPct: number) {
    post("read_depth", { slug, depth: Math.round(Math.max(0, Math.min(100, depthPct))) });
  },
  /** Total seconds spent reading an article (sent once on close). */
  readTime(slug: string, seconds: number) {
    post("read_time", { slug, seconds: Math.round(Math.max(0, seconds)) });
  },
  /** The reader engaged with the contribution funnel. */
  contribute(slug: string) {
    post("contribute_cta", { slug });
  },
};
