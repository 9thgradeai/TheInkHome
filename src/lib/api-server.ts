import type { Story } from "../types.ts";

/**
 * Server-side content pipeline for The Ink Home.
 *
 * Single source of truth for fetching, parsing and caching the publication's
 * Medium RSS feed. Shared by the Express dev/prod server (`server.ts`) and the
 * Vercel serverless functions (`api/*`).
 *
 * NOTE: every relative import in this module graph MUST carry an explicit
 * `.ts` extension. The Vercel Node runtime loads `api/*.ts` as native ESM
 * (Node 24 type-stripping), which does not perform extension resolution.
 */

export const PUBLICATION_FEED = "https://medium.com/feed/the-ink-home";
export const MAX_STORIES = 50;

const CACHE_TTL_MS = 10 * 60 * 1000;
const FETCH_TIMEOUT_MS = 12000;
const RSS2JSON_TIMEOUT_MS = 12000;
const TAG_FEED_TIMEOUT_MS = 15000;
const MAX_TAG_FEEDS = 10;
const TAG_CONCURRENCY = 4;
const TAG_DELAY_MS = 150;

type CacheEntry = { stories: Story[]; fetchedAt: number; source: string };

let cache: CacheEntry | null = null;
let inFlight: Promise<CacheEntry> | null = null;

const PRESET_COVERS = [
  "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1614741118887-7a4ee193a5fa?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1541701494587-cb58502866ab?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=1200&q=80",
];

export function djb2Hash(str: string): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i += 1) {
    hash = (hash << 5) + hash + str.charCodeAt(i);
    hash = hash & hash;
  }
  return Math.abs(hash);
}

function pickCover(seed: string, content: string): string {
  const imgMatch = content.match(/<img[^>]+src=["']([^"']+)["']/i);
  if (imgMatch && imgMatch[1]) return imgMatch[1];
  return PRESET_COVERS[djb2Hash(seed) % PRESET_COVERS.length];
}

function slugFromLink(link: string, title: string): string {
  let slug = "";
  if (link) {
    const parts = link.split("/");
    const lastPart = parts[parts.length - 1];
    slug = lastPart ? lastPart.split("?")[0] : "";
  }
  if (!slug) {
    slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  }
  return slug;
}

function snippetFrom(content: string): string {
  const text = content
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (text.length <= 180) return text;
  return `${text.slice(0, 180).trimEnd()}...`;
}

async function fetchWithTimeout(url: string, timeout = FETCH_TIMEOUT_MS): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    return await fetch(url, { signal: controller.signal, headers: { Accept: "application/rss+xml, application/xml, text/xml, */*" } });
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Parses a Medium RSS document into normalized stories.
 * Regex-based on purpose: it is dependency-free, deterministic and safe to run
 * inside a short-lived serverless function.
 */
export function parseMediumRSS(xmlText: string): Story[] {
  const items: Story[] = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match: RegExpExecArray | null;

  while ((match = itemRegex.exec(xmlText)) !== null) {
    const itemContent = match[1];

    const titleMatch = itemContent.match(
      /<title>(?:<!\[CDATA\[([\s\S]*?)\]\]>|([^<]*))<\/title>/,
    );
    const title = ((titleMatch?.[1] || titleMatch?.[2] || "") as string).trim() || "Untitled Story";

    const linkMatch = itemContent.match(
      /<link>(?:<!\[CDATA\[([\s\S]*?)\]\]>|([^<]*))<\/link>/,
    );
    const link = ((linkMatch?.[1] || linkMatch?.[2] || "") as string).trim();

    const creatorMatch =
      itemContent.match(/<dc:creator>(?:<!\[CDATA\[([\s\S]*?)\]\]>|([^<]*))<\/dc:creator>/) ||
      itemContent.match(/<creator>(?:<!\[CDATA\[([\s\S]*?)\]\]>|([^<]*))<\/creator>/);
    const author = ((creatorMatch?.[1] || creatorMatch?.[2] || "") as string).trim() || "The Ink Home";

    const pubDateMatch = itemContent.match(
      /<pubDate>(?:<!\[CDATA\[([\s\S]*?)\]\]>|([^<]*))<\/pubDate>/,
    );
    const pubDate =
      ((pubDateMatch?.[1] || pubDateMatch?.[2] || "") as string).trim() || new Date().toUTCString();

    const categories: string[] = [];
    const categoryRegex = /<category>(?:<!\[CDATA\[([\s\S]*?)\]\]>|([^<]*))<\/category>/g;
    let catMatch: RegExpExecArray | null;
    while ((catMatch = categoryRegex.exec(itemContent)) !== null) {
      const value = ((catMatch[1] || catMatch[2] || "") as string).trim();
      if (value && !categories.includes(value)) categories.push(value);
    }
    if (categories.length === 0) categories.push("Editorial");

    const contentMatch =
      itemContent.match(
        /<content:encoded>(?:<!\[CDATA\[([\s\S]*?)\]\]>|([\s\S]*?))<\/content:encoded>/,
      ) || itemContent.match(/<description>(?:<!\[CDATA\[([\s\S]*?)\]\]>|([\s\S]*?))<\/description>/);
    const content = ((contentMatch?.[1] || contentMatch?.[2] || "") as string).trim();

    items.push({
      title,
      link,
      author,
      role: "",
      pubDate,
      categories,
      description: snippetFrom(content),
      content,
      cover: pickCover(title, content),
      slug: slugFromLink(link, title),
      avatar: "",
    });
  }

  return items;
}

/** Normalizes an rss2json.com item payload into the same Story shape. */
export function transformRSSItems(items: any[]): Story[] {
  return (Array.isArray(items) ? items : []).map((item: any): Story => {
    const content = item?.content || item?.description || "";
    const title = item?.title || "Untitled Story";
    const link = item?.link || "";
    const author = item?.author || item?.creator || "The Ink Home";

    return {
      title,
      link,
      author,
      role: "",
      pubDate: item?.pubDate || new Date().toUTCString(),
      categories: Array.isArray(item?.categories) && item.categories.length > 0 ? item.categories : ["Editorial"],
      description: snippetFrom(content),
      content,
      cover: pickCover(title, content),
      slug: slugFromLink(link, title),
      avatar: "",
    };
  });
}

async function fetchDirect(url: string): Promise<Story[]> {
  const response = await fetchWithTimeout(url);
  if (!response.ok) return [];
  const parsed = parseMediumRSS(await response.text());
  return parsed.length > 0 ? parsed : [];
}

async function fetchViaRss2Json(url: string): Promise<Story[]> {
  const endpoint = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(url)}`;
  const response = await fetchWithTimeout(endpoint, RSS2JSON_TIMEOUT_MS);
  if (!response.ok) return [];
  const payload = await response.json();
  if (payload?.status !== "ok" || !Array.isArray(payload.items) || payload.items.length === 0) {
    return [];
  }
  return transformRSSItems(payload.items);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>,
  delayMs = 0,
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let cursor = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (true) {
      const index = cursor;
      cursor += 1;
      if (index >= items.length) return;
      results[index] = await fn(items[index]);
      if (delayMs > 0) await sleep(delayMs);
    }
  });
  await Promise.all(workers);
  return results;
}

/**
 * Medium's publication feed is capped at 10 items. To surface a fuller archive
 * we also pull the publication's per-tag feeds (each capped at ~10) and merge
 * them. Failures are tolerated per-tag.
 */
async function fetchTagFeeds(mainStories: Story[]): Promise<Story[]> {
  const tags = Array.from(
    new Set(
      mainStories
        .flatMap((story) => story.categories)
        .map((tag) => tag.trim().toLowerCase())
        .filter((tag) => tag.length > 1 && tag.length < 40 && tag !== "the-ink-home" && tag !== "editorial"),
    ),
  ).slice(0, MAX_TAG_FEEDS);

  if (tags.length === 0) return [];

  try {
    const batches = await Promise.race([
      mapWithConcurrency(
        tags,
        TAG_CONCURRENCY,
        async (tag) => {
          try {
            return await fetchDirect(`${PUBLICATION_FEED}/tagged/${encodeURIComponent(tag)}`);
          } catch {
            return [] as Story[];
          }
        },
        TAG_DELAY_MS,
      ),
      sleep(TAG_FEED_TIMEOUT_MS).then(() => [] as Story[]),
    ]);
    return batches.flat();
  } catch {
    return [];
  }
}

function normalize(stories: Story[]): Story[] {
  const seen = new Set<string>();
  const merged: Story[] = [];

  for (const story of stories) {
    const key = story.slug || story.link || story.title;
    if (!key || seen.has(key)) continue;
    seen.add(key);
    merged.push({
      ...story,
      link: (story.link || "").split("?")[0],
      categories: (Array.isArray(story.categories) ? story.categories : [])
        .filter((c) => typeof c === "string" && c.trim().length > 0 && c.toLowerCase() !== "the-ink-home")
        .slice(0, 5),
    });
  }

  merged.sort((a, b) => Date.parse(b.pubDate) - Date.parse(a.pubDate));
  return merged.slice(0, MAX_STORIES);
}

async function loadFeed(): Promise<CacheEntry> {
  let direct: Story[] = [];
  try {
    direct = await fetchDirect(PUBLICATION_FEED);
  } catch {
    direct = [];
  }

  if (direct.length > 0) {
    // Return the direct feed immediately so the response is fast. Tag feeds are
    // fetched asynchronously to enrich the cache for the next request; they must
    // never block the response (they are slow/external and can time out on
    // serverless runtimes).
    void fetchTagFeeds(direct).then((tagged) => {
      const merged = normalize([...direct, ...tagged]);
      cache = { stories: merged, fetchedAt: Date.now(), source: "medium-rss" };
    });
    return { stories: normalize(direct), fetchedAt: Date.now(), source: "medium-rss" };
  }

  try {
    const viaProxy = await fetchViaRss2Json(PUBLICATION_FEED);
    if (viaProxy.length > 0) {
      return { stories: normalize(viaProxy), fetchedAt: Date.now(), source: "rss2json" };
    }
  } catch {
    /* fall through to stale cache */
  }

  if (cache) return { ...cache, source: `${cache.source}-stale` };
  return { stories: [], fetchedAt: Date.now(), source: "unavailable" };
}

/**
 * Returns the publication stories, using a per-process TTL cache and
 * request de-duplication so concurrent callers only trigger one fetch.
 */
export async function getPublicationStories(options: { force?: boolean } = {}): Promise<{
  stories: Story[];
  source: string;
}> {
  if (!options.force && cache && Date.now() - cache.fetchedAt < CACHE_TTL_MS) {
    return { stories: cache.stories, source: cache.source };
  }

  if (!inFlight) {
    inFlight = loadFeed()
      .then((entry) => {
        if (entry.stories.length > 0) cache = entry;
        return entry;
      })
      .finally(() => {
        inFlight = null;
      });
  }

  const entry = await inFlight;
  return { stories: entry.stories, source: entry.source };
}

/** Test hook: clears the module-level cache. */
export function __clearStoryCache(): void {
  cache = null;
  inFlight = null;
}

/** Seeds the cache (used by the Express server to restore a disk snapshot). */
export function primePublicationCache(stories: Story[], source = "primed"): void {
  if (!Array.isArray(stories) || stories.length === 0) return;
  cache = { stories: normalize(stories), fetchedAt: Date.now(), source };
}

/** Returns the current cache snapshot, if any. */
export function getCachedPublication(): CacheEntry | null {
  return cache ? { ...cache } : null;
}
