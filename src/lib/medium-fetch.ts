/**
 * Production-grade Medium fetch — deep dive findings encoded.
 *
 * Medium docs: https://github.com/Medium/medium-api-docs
 * Findings:
 * - Official REST API (api.medium.com/v1) is WRITE-ONLY (create posts, upload images, list publications).
 *   GET /v1/me and GET /v1/users/{id}/publications work with OAuth, but there is NO endpoint to list stories/posts.
 *   StackOverflow & Medium staff confirm: "API is write-only, not intended to retrieve posts".
 * - ?format=json (e.g. /the-ink-home?format=json or /p/{id}?format=json) is Cloudflare-blocked (403 Attention Required)
 *   for server-side fetch without browser cookies — not viable in production.
 * - RSS ( /feed/{publication} ) is the ONLY officially supported read path. Help Center:
 *   https://help.medium.com/hc/en-us/articles/214874118 confirms Publication feed: medium.com/feed/the-ink-home
 *   and Profile feed: medium.com/feed/@username . Limit: 10 most recent items, no pagination token.
 * - To exceed 10, we must (a) accumulate over time via persistent cache (stale-while-revalidate) and
 *   (b) optionally scrape via CORS proxies (AllOrigins) as tier-3 fallback — direct fetch is Cloudflare-blocked.
 * - Images: story covers are <img src="https://cdn-images-1.medium.com/max/.../1*..."> inside <content:encoded>.
 *   Avatars are NOT in RSS; must be resolved per-author via tiered fetch: 1) https://medium.com/@username HTML
 *   (Cloudflare-blocked, so 2) rss2json feed.image for @username, 3) AllOrigins proxy of profile HTML parsing
 *   og:image/twitter:image, 4) unavatar.io/medium/{username}, 5) ui-avatars initials. This is what
 *   server.ts:getMediumAvatarWithCache already does — kept as canonical.
 * - Publication avatar/cover: <image><url> in RSS channel, or og:image on publication homepage via proxy.
 *
 * This module centralizes all extraction so every story/article/profile image is REAL Medium CDN data,
 * never Unsplash/picsum/placeholders, with graceful fallback to publication logo
 * https://cdn-images-1.medium.com/proxy/1*TGH72Nnw24QL3iV9IOm4VA.png or initials.
 */

export const MEDIUM_PUBLICATION = "the-ink-home";
export const MEDIUM_FEED_URL = "https://medium.com/feed/the-ink-home";
export const MEDIUM_PUBLICATION_ID = "b9765270ddb0";
export const FALLBACK_COVER = "https://cdn-images-1.medium.com/proxy/1*TGH72Nnw24QL3iV9IOm4VA.png";
export const PUB_AVATAR_FALLBACK = "https://cdn-images-1.medium.com/proxy/1*TGH72Nnw24QL3iV9IOm4VA.png";

export interface MediumFetchStats {
  source: "rss2json" | "rss-xml" | "cache" | "allorigins";
  latencyMs: number;
  count: number;
}

/**
 * Extract first <img src> from HTML fragment. Handles cdn-images-1 and miro.
 */
export function extractCover(html: string): string {
  const m = html.match(/<img[^>]+src=["']([^"']+)["']/i);
  if (m && m[1].startsWith("http")) return m[1];
  return FALLBACK_COVER;
}

/**
 * Clean snippet: strip tags, collapse whitespace, truncate to 180 chars + ellipsis.
 * Preserves real Medium description, never dummy.
 */
export function cleanSnippet(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 180) + "...";
}

/**
 * Derive postId from Medium link: https://medium.com/the-ink-home/slug-postId?source=rss
 */
export function postIdFromLink(link: string): string | null {
  try {
    const last = link.split("/").pop() || "";
    const id = last.split("?")[0].split("-").pop() || "";
    return /^[a-f0-9]{12}$/.test(id) ? id : null;
  } catch { return null; }
}

/**
 * Validate that a URL is a real Medium CDN image (prevents Unsplash fallback leakage).
 */
export function isMediumImage(url: string): boolean {
  return /cdn-images.*medium\.com|miro\.medium\.com/.test(url);
}
