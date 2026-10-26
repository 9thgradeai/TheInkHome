import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import compression from "compression";
import dotenv from "dotenv";

dotenv.config();
import {
  DEFAULT_STORIES,
  FALLBACK_ABOUT,
  transformRSSItems,
  parseMediumRSS,
  djb2Hash,
} from "./src/lib/api-server";

const AVATAR_CACHE_TTL = 1000 * 60 * 60;

const avatarCache = new Map<string, { url: string; expiresAt: number }>();

let cache: {
  stories: any[];
  about: any;
  lastUpdated: number;
} = {
  stories: [],
  about: null,
  lastUpdated: 0,
};

const MAX_PREFETCH_CONCURRENCY = 5;
const PREFETCH_TIMEOUT = 8000;

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

async function fetchWithTimeout(
  url: string,
  timeout = PREFETCH_TIMEOUT,
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

const CORS_PROXY = "https://proxy.corsfix.com/?url=";
const PROXY_ORIGIN = "http://localhost:3000";
let directRateLimitedUntil = 0;

async function fetchViaCorsProxy(url: string): Promise<any[]> {
  try {
    const response = await fetchWithTimeout(
      `${CORS_PROXY}${encodeURIComponent(url)}`,
      18000,
      { Origin: PROXY_ORIGIN },
    );
    if (response.ok) {
      const parsed = parseMediumRSS(await response.text());
      if (parsed.length > 0) return parsed;
    }
    if (response.status === 429 || response.status === 403) {
      console.warn(`CORS proxy rate limited for ${url}.`);
    }
  } catch (e) {
    console.warn(`CORS proxy failed for ${url}:`, e);
  }
  return [];
}

const PUBLICATION_FEED = "https://medium.com/feed/the-ink-home";
const MAX_STORIES = 50;
const DISK_CACHE_FILE = path.join(process.cwd(), ".cache", "publication.json");

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function loadCacheFromDisk() {
  try {
    if (!fs.existsSync(DISK_CACHE_FILE)) return;
    const payload = JSON.parse(fs.readFileSync(DISK_CACHE_FILE, "utf8"));
    if (Array.isArray(payload?.stories) && payload.stories.length > 0) {
      cache = {
        stories: payload.stories,
        about: payload.about || null,
        lastUpdated: payload.lastUpdated || Date.now(),
      };
      console.log(`Loaded ${payload.stories.length} stories from disk cache.`);
    }
  } catch (error) {
    console.warn("Could not load disk cache:", error);
  }
}

function saveCacheToDisk() {
  try {
    fs.mkdirSync(path.dirname(DISK_CACHE_FILE), { recursive: true });
    fs.writeFileSync(DISK_CACHE_FILE, JSON.stringify(cache), "utf8");
  } catch (error) {
    console.warn("Could not save disk cache:", error);
  }
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

function enrichStory(story: any): any {
  const meta = AUTHOR_INDEX.get(String(story.author || "").toLowerCase());
  return {
    ...story,
    link: normalizeLink(story.link),
    role: meta?.role || "Contributor",
    avatar: meta?.avatar || "",
    username: meta?.username || "",
    categories: Array.isArray(story.categories)
      ? story.categories.filter((c: string) => c && c !== "the-ink-home").slice(0, 5)
      : ["Editorial"],
  };
}

async function fetchFeedStories(url: string, useProxyFallback = false): Promise<any[]> {
  if (Date.now() > directRateLimitedUntil) {
    for (let attempt = 0; attempt < 2; attempt += 1) {
      try {
        const response = await fetchWithTimeout(url, 12000);
        if (response.ok) {
          const parsed = parseMediumRSS(await response.text());
          if (parsed.length > 0) return parsed;
        }
        if (response.status === 429 || response.status === 403) {
          directRateLimitedUntil = Date.now() + 5 * 60 * 1000;
          console.warn(`Medium rate limited ${url}. Using proxy for the next 5 minutes.`);
          break;
        }
      } catch (e) {
        console.warn(`RSS fetch failed for ${url} (attempt ${attempt + 1}):`, e);
        await sleep(800 * (attempt + 1));
      }
    }
  }

  const proxied = await fetchViaCorsProxy(url);
  if (proxied.length > 0) return proxied;

  if (useProxyFallback) {
    try {
      const proxyRes = await fetchWithTimeout(
        `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(url)}`,
        12000,
      );
      if (proxyRes.ok) {
        const payload = await proxyRes.json();
        if (payload?.status === "ok" && Array.isArray(payload.items) && payload.items.length > 0) {
          return transformRSSItems(payload.items);
        }
      }
    } catch (e) {
      console.warn(`rss2json fallback failed for ${url}:`, e);
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

async function fetchStoriesWithRetry(): Promise<any[]> {
  const main = await fetchFeedStories(PUBLICATION_FEED, true);

  const tags = Array.from(
    new Set(
      main
        .flatMap((story: any) => story.categories || [])
        .map((tag: string) => String(tag).trim().toLowerCase())
        .filter((tag: string) => tag.length > 1 && tag.length < 40 && tag !== "the-ink-home"),
    ),
  ).slice(0, 22);

  const tagFeeds = tags.length
    ? await mapWithConcurrency(
        tags,
        3,
        (tag) => fetchFeedStories(`${PUBLICATION_FEED}/tagged/${encodeURIComponent(tag)}`),
        220,
      )
    : [];

  const seen = new Set<string>();
  const merged: any[] = [];

  for (const story of [...main, ...tagFeeds.flat()]) {
    const key = story.slug || normalizeLink(story.link) || story.title;
    if (!key || seen.has(key)) continue;
    seen.add(key);
    merged.push(enrichStory(story));
  }

  merged.sort((a, b) => {
    const aTime = Date.parse(a.pubDate) || 0;
    const bTime = Date.parse(b.pubDate) || 0;
    return bTime - aTime;
  });

  return merged.slice(0, MAX_STORIES);
}

let activeSync: Promise<void> | null = null;

function syncData(): Promise<void> {
  if (activeSync) return activeSync;

  activeSync = performSync().finally(() => {
    activeSync = null;
  });

  return activeSync;
}

async function performSync() {
  console.log("Background sync: Starting data fetch...");
  let fetchedStories: any[] = [];

  try {
    fetchedStories = await fetchStoriesWithRetry();
  } catch (e) {
    console.warn("syncData failed after retries:", e);
  }

  const updatedAbout = cache.about
    ? cache.about
    : {
        ...FALLBACK_ABOUT,
        editors: FALLBACK_ABOUT.editors.map((e) => ({ ...e })),
        writers: FALLBACK_ABOUT.writers.map((w) => ({ ...w })),
      };

  if (fetchedStories.length > 0) {
    cache = {
      stories: fetchedStories.slice(0, MAX_STORIES),
      about: updatedAbout,
      lastUpdated: Date.now(),
    };
    saveCacheToDisk();
    console.log(`Background sync completed. Stories cached: ${cache.stories.length}`);
    return;
  }

  if (cache.stories.length > 0) {
    cache = { ...cache, about: updatedAbout };
    saveCacheToDisk();
    console.warn(`Background sync returned no stories. Keeping ${cache.stories.length} cached stories.`);
    return;
  }

  cache = {
    stories: DEFAULT_STORIES.map((s) => ({ ...s })),
    about: updatedAbout,
    lastUpdated: Date.now(),
  };
  console.warn("Background sync returned no stories and no cache exists. Using default stories.");
}

async function serveSPAWithSEO(req: express.Request, res: express.Response, viteInstance?: any) {
  const slug = req.params.slug;

  if (cache.stories.length < 10) {
    try {
      await syncData();
    } catch (e) {
      console.warn("Initial syncData failed, falling back to defaults:", e);
    }
  }

  const story = cache.stories.find((s) => s.slug === slug);

  const pagePath = (req.originalUrl || "/").split("?")[0];
  const pageTitles: Record<string, string> = {
    "/": "The Ink Home — Where Words Feel at Home",
    "/stories": "Stories | The Ink Home",
    "/writers": "Writers | The Ink Home",
    "/about": "About | The Ink Home",
  };

  let title = pageTitles[pagePath] || "The Ink Home — Where Words Feel at Home";
  let description =
    "An independent Medium publication of essays on technology, culture, creativity, relationships and the quiet parts of being human.";
  let cover = "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80";
  let url = `https://theinkhome.live/story/${slug || ""}`;

  if (story) {
    title = `${story.title} | The Ink Home`;
    description = story.description || description;
    cover = story.cover || cover;
    url = story.link || url;
  }

  try {
    const isProduction = process.env.NODE_ENV === "production";
    const htmlPath = path.join(process.cwd(), isProduction ? "dist/index.html" : "index.html");

    let html: string;
    try {
      html = fs.readFileSync(htmlPath, "utf8");
    } catch (err) {
      if (isProduction) {
        return res.status(404).send("Application not compiled yet. Run npm run build first.");
      }
      throw err;
    }

    if (!isProduction && viteInstance) {
      html = await viteInstance.transformIndexHtml(req.originalUrl, html);
    }

    const cleanTitle = title.replace(/\s+/g, " ").trim();
    const cleanDescription = description.replace(/\s+/g, " ").trim();

    const metaTags = [
      `<!-- Dynamic SEO tags injected by Express server -->`,
      `<title>${escapeHtml(cleanTitle)}</title>`,
      `<meta name="description" content="${escapeHtml(cleanDescription)}" />`,
      `<meta property="og:title" content="${escapeHtml(cleanTitle)}" />`,
      `<meta property="og:description" content="${escapeHtml(cleanDescription)}" />`,
      `<meta property="og:image" content="${escapeHtml(cover)}" />`,
      `<meta property="og:url" content="${escapeHtml(url)}" />`,
      `<meta property="og:type" content="article" />`,
      `<meta name="twitter:card" content="summary_large_image" />`,
      `<meta name="twitter:title" content="${escapeHtml(cleanTitle)}" />`,
      `<meta name="twitter:description" content="${escapeHtml(cleanDescription)}" />`,
      `<meta name="twitter:image" content="${escapeHtml(cover)}" />`,
    ].join("\n    ");

    html = html
      .replace(/<title>[\s\S]*?<\/title>/gi, "")
      .replace(
        /<meta[^>]+(?:name|property)=["'](?:description|og:title|og:description|og:image|og:url|og:type|twitter:card|twitter:title|twitter:description|twitter:image)["'][^>]*\/?>/gi,
        "",
      );
    html = html.replace("<head>", `<head>${metaTags}`);

    res.status(200).set({ "Content-Type": "text/html" }).end(html);
  } catch (err) {
    console.error("SEO Injection failed:", err);
    const isProduction = process.env.NODE_ENV === "production";
    const fallbackPath = path.join(process.cwd(), isProduction ? "dist/index.html" : "index.html");
    try {
      res.sendFile(fallbackPath);
    } catch (sendErr) {
      res.status(500).send("Unable to serve application.");
    }
  }
}

const isPlaceholderUrl = (url: string): boolean => {
  if (!url) return true;
  const lowerUrl = url.toLowerCase();
  return (
    lowerUrl.includes("10fd5c419ac61637245384e7099e131627900034828f4f386bdaa47a74eae156") ||
    lowerUrl.includes("avatar/default") ||
    lowerUrl.includes("dn-uploads")
  );
};

const OG_IMAGE_RE = /<meta[^>]+property\s*=\s*["']og:image["'][^>]*content\s*=\s*["']([^"']+)["']/i;
const OG_IMAGE_RE2 = /<meta[^>]+content\s*=\s*["']([^"']+)["'][^>]*property\s*=\s*["']og:image["']/i;
const TWITTER_IMAGE_RE = /<meta[^>]+name\s*=\s*["']twitter:image["'][^>]*content\s*=\s*["']([^"']+)["']/i;
const APPLE_TOUCH_ICON_RE = /<link[^>]+rel\s*=\s*["']apple-touch-icon["'][^>]*href\s*=\s*["']([^"']+)["']/i;

async function resolveAvatarFromHtml(html: string): Promise<string | null> {
  const ogMatch = html.match(OG_IMAGE_RE) || html.match(OG_IMAGE_RE2) || html.match(TWITTER_IMAGE_RE) || html.match(APPLE_TOUCH_ICON_RE);
  if (ogMatch && ogMatch[1]) {
    const imgUrl = ogMatch[1].trim();
    if (imgUrl && imgUrl.startsWith("http") && !isPlaceholderUrl(imgUrl)) {
      return imgUrl;
    }
  }
  return null;
}

async function getMediumAvatarWithCache(username: string): Promise<string> {
  const cacheKey = username.toLowerCase().trim();
  const cached = avatarCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.url;
  }

  const premiumFallbacks: Record<string, string> = {
    farhankabir133: "https://miro.medium.com/v2/resize:fit:2400/1*OonAmXM0uBzGf_KYL3s85w.png",
    dbatool242: "https://miro.medium.com/v2/resize:fit:2400/1*4o35ax2_LSaOtP-3Lfi0Eg.jpeg",
    yiwanye: "https://miro.medium.com/v2/da:true/resize:fit:2400/0*UtfdEWoDpfcG0zQE",
    soamidayakrishnananda: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=304&h=304&q=80",
    annajaworska: "https://miro.medium.com/v2/resize:fit:2400/0*_D8djmuiTP88tAfM.jpeg",
    marmanrezashah: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=304&h=304&q=80",
    achellesantos: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=304&h=304&q=80",
    amberfaulk: "https://miro.medium.com/v2/da:true/resize:fit:2400/0*p2SLJ4oqFubl4-Fw",
    paushalidas: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=304&h=304&q=80",
    sadmantaqi: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=304&h=304&q=80",
    taibamansuri: "https://miro.medium.com/v2/resize:fit:2400/1*1dpRDcpKeFMMpwXY2PT8nw.jpeg",
    claudiocasella: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=304&h=304&q=80",
    amooridwan: "https://images.unsplash.com/photo-1513956589380-bad6acb9b9d4?auto=format&fit=crop&w=304&h=304&q=80",
    logeshtv: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=304&h=304&q=80",
    mimmaya: "https://images.unsplash.com/photo-1554151228-14d9def656e4?auto=format&fit=crop&w=304&h=304&q=80",
    adammcclarin: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=304&h=304&q=80",
    mabelpenrose: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=304&h=304&q=80",
    "mabel-penrose": "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=304&h=304&q=80",
    jmactavish: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=304&h=304&q=80",
    vikrakkrisnasamy: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=304&h=304&q=80",
    vikrakkrishnasamy: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=304&h=304&q=80",
    "lc-squared": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=304&h=304&q=80",
    lcsquared: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=304&h=304&q=80",
    michaelkoyfman: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=304&h=304&q=80",
  };

  try {
    const profileUrl = "https://medium.com/@" + username;
    const response = await fetchWithTimeout(profileUrl, 10000);
    if (response.ok) {
      const html = await response.text();
      const imgUrl = await resolveAvatarFromHtml(html);
      if (imgUrl) {
        avatarCache.set(cacheKey, { url: imgUrl, expiresAt: Date.now() + AVATAR_CACHE_TTL });
        return imgUrl;
      }
    }
  } catch (err) {
    console.warn("Tier 1 avatar fetch failed:", err);
  }

  try {
    const userFeedUrl = `https://medium.com/feed/@${username}`;
    const rss2JsonUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(userFeedUrl)}`;
    const res = await fetchWithTimeout(rss2JsonUrl, 10000);
    if (res.ok) {
      const data = await res.json();
      if (data && data.status === "ok" && data.feed && data.feed.image) {
        const imgUrl = data.feed.image.trim();
        if (imgUrl && imgUrl.startsWith("http") && !isPlaceholderUrl(imgUrl)) {
          avatarCache.set(cacheKey, { url: imgUrl, expiresAt: Date.now() + AVATAR_CACHE_TTL });
          return imgUrl;
        }
      }
    }
  } catch (err) {
    console.warn("Tier 2 avatar fetch failed:", err);
  }

  try {
    const profileUrl = "https://medium.com/@" + username;
    const allOriginsUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(profileUrl)}`;
    const response = await fetchWithTimeout(allOriginsUrl, 10000);
    if (response.ok) {
      const data = await response.json();
      const html = data && data.contents;
      if (html) {
        const imgUrl = await resolveAvatarFromHtml(html);
        if (imgUrl) {
          avatarCache.set(cacheKey, { url: imgUrl, expiresAt: Date.now() + AVATAR_CACHE_TTL });
          return imgUrl;
        }
      }
    }
  } catch (err) {
    console.warn("Tier 3 avatar fetch failed:", err);
  }

  try {
    const unavatarUrl = `https://unavatar.io/medium/${username}`;
    const response = await fetchWithTimeout(unavatarUrl, 8000);
    if (response.ok && response.url && !isPlaceholderUrl(response.url)) {
      avatarCache.set(cacheKey, { url: response.url, expiresAt: Date.now() + AVATAR_CACHE_TTL });
      return response.url;
    }
  } catch (err) {
    console.warn("Tier 4 avatar fetch failed:", err);
  }

  const fallback = premiumFallbacks[cacheKey] || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=304&h=304&q=80";
  avatarCache.set(cacheKey, { url: fallback, expiresAt: Date.now() + AVATAR_CACHE_TTL });
  return fallback;
}

async function prefetchAvatars<T extends { username?: string; avatar?: string }>(
  entities: T[],
  concurrency = MAX_PREFETCH_CONCURRENCY
): Promise<(string | undefined)[]> {
  const results: (string | undefined)[] = new Array(entities.length);
  let index = 0;

  async function worker() {
    while (index < entities.length) {
      const current = index++;
      const entity = entities[current];
      if (entity && entity.username) {
        try {
          results[current] = await getMediumAvatarWithCache(entity.username);
        } catch {
          results[current] = entity.avatar;
        }
      } else {
        results[current] = entity?.avatar;
      }
    }
  }

  const workers = Array.from({ length: Math.min(concurrency, entities.length) }, () => worker());
  await Promise.allSettled(workers);
  return results;
}



async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(compression());

  app.use(express.json({ limit: "100kb" }));
  app.use(express.text({ type: "application/json", limit: "100kb" }));

  app.use((req, res, next) => {
    res.set("Cache-Control", "no-store");
    next();
  });

  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
    })
  );

  const requestLogger = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const start = Date.now();
    res.on("finish", () => {
      const duration = Date.now() - start;
      console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} -> ${res.statusCode} (${duration}ms)`);
    });
    next();
  };
  app.use(requestLogger);

  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Too many requests, please try again later" },
  });
  app.use("/api/", apiLimiter);

  app.get("/api/health", (req, res) => {
    res.status(200).json({
      status: "ok",
      uptime: process.uptime(),
      stories: cache.stories.length,
      lastSync: new Date(cache.lastUpdated).toISOString(),
    });
  });

  app.get("/api/stories", async (req, res) => {
    res.set("Cache-Control", "public, max-age=300, stale-while-revalidate=600");
    if (cache.stories.length < 10) {
      try {
        await syncData();
      } catch (err) {
        console.error("Initial data sync failed:", err);
      }
    }
    res.json({ source: "cache", stories: cache.stories });
  });

  app.get("/api/about", async (req, res) => {
    res.set("Cache-Control", "public, max-age=300, stale-while-revalidate=600");
    if (!cache.about) {
      try {
        await syncData();
      } catch (err) {
        console.error("Initial about sync failed:", err);
      }
    }
    res.json(cache.about || FALLBACK_ABOUT);
  });

  app.post("/api/track", (req, res) => {
    let payload = req.body;
    if (typeof payload === "string") {
      try {
        payload = JSON.parse(payload);
      } catch (e) {}
    }
    const event = req.query.event || "unknown";
    console.log(`[TELEMETRY] Event: ${event} | Payload:`, payload);
    res.status(200).json({ success: true, message: "Telemetry received successfully" });
  });

app.post("/api/ai", async (req, res) => {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "AI assistant is not configured." });
    }
    try {
      const body = req.body;
      if (!body || !body.messages || !Array.isArray(body.messages)) {
        return res.status(400).json({ error: "Invalid request body." });
      }
      const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "openai/gpt-oss-20b",
          messages: [
            { role: "system", content: "You are Ink Assistant for The Ink Home. Help users with submission guidelines, how to become a writer, and publication information. Keep answers concise and helpful. Keep answers under 200 words." },
            ...body.messages,
          ],
          temperature: body.temperature ?? 0.5,
          max_tokens: body.max_tokens ?? 512,
          stream: false,
        }),
      });
      if (!groqRes.ok) {
        const errText = await groqRes.text().catch(() => "unknown");
        console.error("Groq API error:", groqRes.status, errText);
        return res.status(groqRes.status).json({ error: "AI service error. Please try again." });
      }
      const data = await groqRes.json();
      const reply = data?.choices?.[0]?.message?.content || "";
      if (!reply) {
        return res.status(502).json({ error: "AI response was empty. Please try again." });
      }
      return res.status(200).json({ reply });
    } catch (error) {
      console.error("AI endpoint error:", error);
      return res.status(500).json({ error: "Internal server error." });
    }
  });

  let vite: any;
  if (process.env.NODE_ENV !== "production") {
    vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use("/assets", express.static(path.join(process.cwd(), "assets"), { maxAge: "1y", immutable: true }));
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath, { maxAge: "1y", immutable: true }));

    app.use("/api/stories", (req, res, next) => {
      res.set("Cache-Control", "public, max-age=300, stale-while-revalidate=600");
      next();
    });
    app.use("/api/about", (req, res, next) => {
      res.set("Cache-Control", "public, max-age=300, stale-while-revalidate=600");
      next();
    });

    app.get(["/", "/stories", "/writers", "/about", "/story/:slug"], async (req, res) => {
      await serveSPAWithSEO(req, res);
    });

    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  loadCacheFromDisk();

  const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`The Ink Home Server running on http://localhost:${PORT}`);
    syncData().catch((err) => console.warn("Initial background sync failed:", err));
  });

  setInterval(() => {
    syncData().catch((err) => console.warn("Scheduled background sync failed:", err));
  }, 10 * 60 * 1000);

  server.on("error", (err) => {
    console.error("Server failed to start:", err);
    process.exit(1);
  });

  const gracefulShutdown = () => {
    console.log("Shutting down gracefully...");
    server.close(() => {
      console.log("Server closed.");
      process.exit(0);
    });
    setTimeout(() => {
      console.error("Forced shutdown due to timeout");
      process.exit(1);
    }, 5000);
  };

  process.on("SIGTERM", gracefulShutdown);
  process.on("SIGINT", gracefulShutdown);
  process.on("uncaughtException", (err) => {
    console.error("Uncaught exception:", err);
  });
  process.on("unhandledRejection", (reason) => {
    console.error("Unhandled rejection:", reason);
  });

  return server;
}

startServer().catch((err) => {
  console.error("Startup failed:", err);
  process.exit(1);
});
