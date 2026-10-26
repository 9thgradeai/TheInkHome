import type { VercelRequest, VercelResponse } from "@vercel/node";
import FALLBACK_ABOUT from "../src/data/fallbackAbout";

type Story = {
  title: string;
  link: string;
  author: string;
  role: string;
  pubDate: string;
  categories: string[];
  description: string;
  content: string;
  cover: string;
  slug: string;
  avatar: string;
};

const DEFAULT_STORIES: Story[] = [
  {
    title: "The Spatial Medium: Redefining Digital Architecture",
    link: "https://medium.com/the-ink-home/spatial-medium-redefining-digital-architecture",
    author: "Elena Rostov",
    role: "Editor-in-Chief",
    pubDate: "Sun, 31 May 2026 10:00:00 GMT",
    categories: ["Architecture", "Digital Art", "Design"],
    description: "An inquiry into the collapse of screen borders, tracing how digital typography transitions from absolute grid references to floating spatial objects in three-dimensional environments.",
    content: "<p>The screen is no longer a surface. It is a portal with physical, kinetic depth. As we transition from flat editorial spaces to volumetric layouts, we are forced to rethink typography, paragraph spacing, and user eye tracking. In this first major thesis from the Spatial Design lab at The Ink Home, we trace the transition from paper to pixels, and finally, into multi-dimensional kinetic canvases.</p><figure><img src=\"https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80\" /></figure><p>The concept of digital printing elements floating in depth allows editors to establish physical visual hierarchy. Larger headers can sit 20px closer to the camera, creating natural parallax during scroll.</p>",
    cover: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80",
    slug: "spatial-medium-redefining-digital-architecture",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80"
  },
  {
    title: "Aesthesis and the Algorithmic Composer",
    link: "https://medium.com/the-ink-home/aesthesis-algorithmic-composer",
    author: "Devon Vance",
    role: "AI Creative Lead",
    pubDate: "Fri, 29 May 2026 14:15:00 GMT",
    categories: ["Artificial Intelligence", "Sound", "Philosophy"],
    description: "How neural networks are rebuilding the acoustic syntax of modern interactive journalism, generating ambient soundtracks keyed directly to reading velocity.",
    content: "<p>What does text sound like when it is read? Not spoken, but felt. At The Ink Home, we've developed a generative ambient soundscape system that dynamically syncs background tones with the user's reading position. High-density words trigger subtle high-frequency resonances, while narrative gaps bring in deep drone base hums.</p><figure><img src=\"https://images.unsplash.com/photo-1614741118887-7a4ee193a5fa?auto=format&fit=crop&w=1200&q=80\" /></figure><p>This is the future of immersive editorial. The browser serves not just as a visual reader, but as a sensory conductor.</p>",
    cover: "https://images.unsplash.com/photo-1614741118887-7a4ee193a5fa?auto=format&fit=crop&w=1200&q=80",
    slug: "aesthesis-algorithmic-composer",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80"
  },
  {
    title: "Liquid Typography: The Kinetic Textures of Midnight",
    link: "https://medium.com/the-ink-home/liquid-typography-kinetic-textures",
    author: "Sophia Sterling",
    role: "Senior Graphic Editor",
    pubDate: "Wed, 27 May 2026 09:30:00 GMT",
    categories: ["Typography", "Motion Design", "Creative Coding"],
    description: "Plunging deep into viscous web text layouts. We explore the implementation of fluid shaders that bend, float, and flow dynamically as the cursor collides with headlines.",
    content: "<p>Static fonts are dead. When we look at a screen, we expect characters to display organic behaviors like tension and viscosity. Liquid Typography examines WebGL-based typeface meshes that adapt to mouse momentum, splitting and re-joining with gorgeous metallic finishes.</p><figure><img src=\"https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?auto=format&fit=crop&w=1200&q=80\" /></figure><p>The tactile weight of these digital glyphs creates physical engagement, transforming reading from a passive habit into an active somatic experience.</p>",
    cover: "https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?auto=format&fit=crop&w=1200&q=80",
    slug: "liquid-typography-kinetic-textures",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80"
  },
  {
    title: "The Ink Archive: Tracing the Philosophy of Cyber-Scribes",
    link: "https://medium.com/the-ink-home/philosophy-of-cyber-scribes",
    author: "Elena Rostov",
    role: "Editor-in-Chief",
    pubDate: "Mon, 25 May 2026 18:20:00 GMT",
    categories: ["Philosophy", "Literature", "Cyberculture"],
    description: "An archival study of electronic literary clubs, examining how the ink on our hands became code in the browser, and the collective spirit of the digital publication.",
    content: "<p>The ink of the modern age does not stain fingers; it alters screens. In tracing the lineage from printed zines to the Medium feed, the cybernetic publishing space retains its punk roots. This long-form article details our collective's mission to preserve raw editorial control amidst algorithmic feed curation.</p><figure><img src=\"https://images.unsplash.com/photo-1541701494587-cb58502866ab?auto=format&fit=crop&w=1200&q=80\" /></figure><p>By transforming Medium metadata into spatial coordinates, we free the articles from standardized corporate grids into infinite editorial solar systems.</p>",
    cover: "https://images.unsplash.com/photo-1541701494587-cb58502866ab?auto=format&fit=crop&w=1200&q=80",
    slug: "philosophy-of-cyber-scribes",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80"
  },
  {
    title: "Metadimensional Interfaces: Beyond the Desktop Metaphor",
    link: "https://medium.com/the-ink-home/metadimensional-interfaces-beyond-desktop",
    author: "Marcus Chen",
    role: "Interaction Director",
    pubDate: "Thu, 21 May 2026 11:10:00 GMT",
    categories: ["UI/UX", "Future", "Science Fiction"],
    description: "A prospective review of zero-gravity dashboards, spatial data stacks, and multi-layered typography systems designed for neural-link and depth interfaces.",
    content: "<p>For forty years, human-computer interaction has lived in the flat confines of cardboard-desktop file systems. But what happens when interfaces occupy floating depths? We present a speculative UI suite that arranges ideas in atomic orbits, letting stories interact with one another based on content tags.</p><figure><img src=\"https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=1200&q=80\" /></figure><p>In the spatial web, context is visual distance. High relevance brings items closer, while divergent files drift to the horizons.</p>",
    cover: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=1200&q=80",
    slug: "metadimensional-interfaces-beyond-desktop",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80"
  }
];

const PRESET_COVERS = [
  "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1614741118887-7a4ee193a5fa?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1541701494587-cb58502866ab?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=1200&q=80"
];

const AUTHOR_AVATARS: Record<string, string> = {
  "Elena Rostov": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80",
  "Devon Vance": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80",
  "Sophia Sterling": "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80",
  "Marcus Chen": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80"
};

const AUTHOR_ROLES: Record<string, string> = {
  "Elena Rostov": "Editor-in-Chief",
  "Devon Vance": "AI Creative Lead",
  "Sophia Sterling": "Senior Graphic Editor",
  "Marcus Chen": "Interaction Director"
};

function djb2Hash(str: string): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) + str.charCodeAt(i);
    hash = hash & hash;
  }
  return Math.abs(hash);
}

function transformRSSItems(items: any[]): Story[] {
  return items.map((item: any): Story => {
    const content = item.content || item.description || "";
    let cover = "";
    const imgMatches = content.match(/<img[^>]+src=["']([^"']+)["']/i);
    if (imgMatches && imgMatches[1]) {
      cover = imgMatches[1];
    } else {
      cover = PRESET_COVERS[djb2Hash(item.title) % PRESET_COVERS.length];
    }

    const author = item.author || "The Ink Home Team";
    const avatar = AUTHOR_AVATARS[author] || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80";
    const role = AUTHOR_ROLES[author] || "Staff Editor";

    let slug = "";
    if (item.link) {
      const parts = item.link.split("/");
      const lastPart = parts[parts.length - 1];
      slug = lastPart ? lastPart.split("?")[0] : "";
    }
    if (!slug) {
      slug = item.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    }

    const cleanSnippet = content
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .substring(0, 180) + "...";

    return {
      title: item.title,
      link: item.link,
      author,
      role,
      pubDate: item.pubDate,
      categories: Array.isArray(item.categories) ? item.categories : ["Editorial"],
      description: cleanSnippet,
      content,
      cover,
      slug,
      avatar
    };
  });
}

function parseMediumRSS(xmlText: string): Story[] {
  const items: Story[] = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match;

  while ((match = itemRegex.exec(xmlText)) !== null) {
    const itemContent = match[1];

    let title = "Untitled Story";
    const titleMatch = itemContent.match(/<title>(?:<!\[CDATA\[([\s\S]*?)\]\]>|([^<]*))<\/title>/);
    if (titleMatch) {
      title = (titleMatch[1] || titleMatch[2] || "").trim();
    }

    let link = "";
    const linkMatch = itemContent.match(/<link>(?:<!\[CDATA\[([\s\S]*?)\]\]>|([^<]*))<\/link>/);
    if (linkMatch) {
      link = (linkMatch[1] || linkMatch[2] || "").trim();
    }

    let author = "The Ink Home Team";
    const creatorMatch = itemContent.match(/<dc:creator>(?:<!\[CDATA\[([\s\S]*?)\]\]>|([^<]*))<\/dc:creator>/) ||
                         itemContent.match(/<creator>(?:<!\[CDATA\[([\s\S]*?)\]\]>|([^<]*))<\/creator>/);
    if (creatorMatch) {
      author = (creatorMatch[1] || creatorMatch[2] || "").trim();
    }

    let pubDate = new Date().toUTCString();
    const pubDateMatch = itemContent.match(/<pubDate>(?:<!\[CDATA\[([\s\S]*?)\]\]>|([^<]*))<\/pubDate>/);
    if (pubDateMatch) {
      pubDate = (pubDateMatch[1] || pubDateMatch[2] || "").trim();
    }

    const categories: string[] = [];
    let catMatch;
    const categoryRegex = /<category>(?:<!\[CDATA\[([\s\S]*?)\]\]>|([^<]*))<\/category>/g;
    while ((catMatch = categoryRegex.exec(itemContent)) !== null) {
      categories.push((catMatch[1] || catMatch[2] || "").trim());
    }
    if (categories.length === 0) {
      categories.push("Editorial", "The Ink Home");
    }

    let content = "";
    const contentMatch = itemContent.match(/<content:encoded>(?:<!\[CDATA\[([\s\S]*?)\]\]>|([\s\S]*?))<\/content:encoded>/) ||
                         itemContent.match(/<description>(?:<!\[CDATA\[([\s\S]*?)\]\]>|([\s\S]*?))<\/description>/);
    if (contentMatch) {
      content = (contentMatch[1] || contentMatch[2] || "").trim();
    }

    let cover = "";
    const imgRegex = /<img[^>]+src=["']([^"']+)["']/i;
    const imgMatch = content.match(imgRegex);
    if (imgMatch && imgMatch[1]) {
      cover = imgMatch[1];
    } else {
      cover = PRESET_COVERS[djb2Hash(title) % PRESET_COVERS.length];
    }

    const avatar = AUTHOR_AVATARS[author] || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80";
    const role = AUTHOR_ROLES[author] || "Staff Editor";

    let slug = "";
    if (link) {
      const parts = link.split("/");
      const lastPart = parts[parts.length - 1];
      slug = lastPart ? lastPart.split("?")[0] : "";
    }
    if (!slug) {
      slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    }

    const cleanSnippet = content
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .substring(0, 180) + "...";

    items.push({
      title,
      link,
      author,
      role,
      pubDate,
      categories,
      description: cleanSnippet,
      content,
      cover,
      slug,
      avatar
    });
  }

  return items;
}

async function fetchWithTimeout(
  url: string,
  timeout = 8000,
  headers?: Record<string, string>,
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    return await fetch(url, { signal: controller.signal, headers });
  } finally {
    clearTimeout(timer);
  }
}

const PUBLICATION_FEED = "https://medium.com/feed/the-ink-home";
const MAX_STORIES = 50;
const CORS_PROXY = "https://proxy.corsfix.com/?url=";
const PROXY_ORIGIN = "https://theinkhome.live";
let directRateLimitedUntil = 0;

async function fetchViaCorsProxy(url: string): Promise<Story[]> {
  try {
    const response = await fetchWithTimeout(
      `${CORS_PROXY}${encodeURIComponent(url)}`,
      15000,
      { Origin: PROXY_ORIGIN },
    );
    if (response.ok) {
      const parsed = parseMediumRSS(await response.text());
      if (parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error(`Vercel CORS proxy failed for ${url}:`, e);
  }
  return [];
}

const AUTHOR_INDEX = new Map(
  [...FALLBACK_ABOUT.editors, ...FALLBACK_ABOUT.writers].map((author) => [
    author.name.toLowerCase(),
    author,
  ]),
);

function normalizeLink(link: string): string {
  return (link || "").split("?")[0];
}

function enrichStory(story: Story): Story {
  const meta = AUTHOR_INDEX.get(String(story.author || "").toLowerCase());
  return {
    ...story,
    link: normalizeLink(story.link),
    role: meta?.role || "Contributor",
    avatar: meta?.avatar || "",
    categories: Array.isArray(story.categories)
      ? story.categories.filter((c) => c && c !== "the-ink-home").slice(0, 5)
      : ["Editorial"],
  };
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchFeedStories(url: string, useProxyFallback = false): Promise<Story[]> {
  if (Date.now() > directRateLimitedUntil) {
    for (let attempt = 0; attempt < 2; attempt += 1) {
      try {
        const response = await fetchWithTimeout(url, 9000);
        if (response.ok) {
          const parsed = parseMediumRSS(await response.text());
          if (parsed.length > 0) return parsed;
        }
        if (response.status === 429 || response.status === 403) {
          directRateLimitedUntil = Date.now() + 5 * 60 * 1000;
          console.warn(`Vercel: Medium rate limited ${url}. Using proxy for 5 minutes.`);
          break;
        }
      } catch (e) {
        console.error(`Vercel RSS fetch failed for ${url} (attempt ${attempt + 1}):`, e);
        await sleep(600 * (attempt + 1));
      }
    }
  }

  const proxied = await fetchViaCorsProxy(url);
  if (proxied.length > 0) return proxied;

  if (useProxyFallback) {
    try {
      const rss2JsonUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(url)}`;
      const proxyRes = await fetchWithTimeout(rss2JsonUrl, 9000);
      if (proxyRes.ok) {
        const jsonPayload = await proxyRes.json();
        if (jsonPayload?.status === "ok" && Array.isArray(jsonPayload.items) && jsonPayload.items.length > 0) {
          return transformRSSItems(jsonPayload.items);
        }
      }
    } catch (e) {
      console.error(`Vercel rss2json fallback failed for ${url}:`, e);
    }
  }

  return [];
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
      const index = cursor++;
      if (index >= items.length) return;
      results[index] = await fn(items[index]);
      if (delayMs > 0) await sleep(delayMs);
    }
  });
  await Promise.all(workers);
  return results;
}

async function fetchFreshStories(): Promise<Story[]> {
  const main = await fetchFeedStories(PUBLICATION_FEED, true);

  const tags = Array.from(
    new Set(
      main
        .flatMap((story) => story.categories || [])
        .map((tag) => String(tag).trim().toLowerCase())
        .filter((tag) => tag.length > 1 && tag.length < 40 && tag !== "the-ink-home"),
    ),
  ).slice(0, 16);

  const tagFeeds = tags.length
    ? await mapWithConcurrency(
        tags,
        4,
        (tag) => fetchFeedStories(`${PUBLICATION_FEED}/tagged/${encodeURIComponent(tag)}`),
        120,
      )
    : [];

  const seen = new Set<string>();
  const merged: Story[] = [];

  for (const story of [...main, ...tagFeeds.flat()]) {
    const key = story.slug || normalizeLink(story.link) || story.title;
    if (!key || seen.has(key)) continue;
    seen.add(key);
    merged.push(enrichStory(story));
  }

  merged.sort((a, b) => (Date.parse(b.pubDate) || 0) - (Date.parse(a.pubDate) || 0));

  return merged.slice(0, MAX_STORIES);
}

const CACHE_TTL = 5 * 60 * 1000;
let storyCache: Story[] = [];
let storyCacheTime = 0;
let activeFetch: Promise<Story[]> | null = null;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (Date.now() - storyCacheTime > CACHE_TTL || storyCache.length === 0) {
    if (!activeFetch) {
      activeFetch = fetchFreshStories().finally(() => {
        activeFetch = null;
      });
    }

    const fresh = await activeFetch;
    if (fresh.length > 0) {
      storyCache = fresh;
      storyCacheTime = Date.now();
    } else if (storyCache.length === 0) {
      storyCacheTime = Date.now() - CACHE_TTL + 30 * 1000;
    }
  }

  const stories = storyCache.length > 0 ? storyCache : DEFAULT_STORIES.map((s) => ({ ...s }));
  res.setHeader("Cache-Control", "public, max-age=300, stale-while-revalidate=600");
  return res.status(200).json({ source: "cache", stories });
}

export const maxDuration = 60;
