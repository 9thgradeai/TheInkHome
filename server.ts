import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import compression from "compression";
import dotenv from "dotenv";
import { Redis } from "@upstash/redis";
import { createLogger, format, transports } from "winston";
import {
  DEFAULT_STORIES,
  FALLBACK_ABOUT,
  transformRSSItems,
  parseMediumRSS,
  djb2Hash,
} from "./src/lib/api-server";
import { AIRequestSchema } from "./src/lib/validation";

dotenv.config();

// Winston logger for structured request logging
const logger = createLogger({
  level: process.env.NODE_ENV === "production" ? "info" : "debug",
  format: format.combine(
    format.timestamp(),
    format.json()
  ),
  transports: [
    new transports.Console()
  ]
});

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});



const AVATAR_CACHE_TTL = 1000 * 60 * 60;
const avatarCache = new Map<string, { url: string; expiresAt: number }>();
let directRateLimitedUntil = 0;

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
       logger.warn(`CORS proxy rate limited for ${url}`);
     }
   } catch (e) {
     logger.warn(`CORS proxy failed for ${url}`, { error: e instanceof Error ? e.message : String(e) });
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
       logger.info(`Loaded ${payload.stories.length} stories from disk cache`);
     }
   } catch (error) {
     logger.warn("Could not load disk cache", { error: error instanceof Error ? error.message : String(error) });
  }
}

function saveCacheToDisk() {
  try {
    fs.mkdirSync(path.dirname(DISK_CACHE_FILE), { recursive: true });
    fs.writeFileSync(DISK_CACHE_FILE, JSON.stringify(cache), "utf8");
  } catch (error) {
    logger.warn("Could not save disk cache", { error: error instanceof Error ? error.message : String(error) });
  }
}

const AUTHOR_INDEX = new Map(
  [...FALLBACK_ABOUT.editors, ...FALLBACK_ABOUT.writers].map((author: any) => [
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
    role: meta?.role || story.role || "Contributor",
    avatar: meta?.avatar || story.avatar || "",
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
          logger.warn(`Medium rate limited ${url}. Using proxy fallback.`);
          break;
        }
      } catch (e) {
        logger.warn(`RSS fetch failed for ${url} (attempt ${attempt + 1})`, { error: e instanceof Error ? e.message : String(e) });
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
      logger.warn(`rss2json fallback failed for ${url}`, { error: e instanceof Error ? e.message : String(e) });
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
  logger.info("Background sync: Starting data fetch");
  let fetchedStories: any[] = [];

  try {
    fetchedStories = await fetchStoriesWithRetry();
  } catch (e) {
    logger.warn("syncData failed after retries", { error: e instanceof Error ? e.message : String(e) });
  }

  const updatedAbout = cache.about
    ? cache.about
    : {
        ...FALLBACK_ABOUT,
        editors: (FALLBACK_ABOUT.editors || []).map((e: any) => ({ ...e })),
        writers: (FALLBACK_ABOUT.writers || []).map((w: any) => ({ ...w })),
      };

  if (fetchedStories.length > 0) {
    cache = {
      stories: fetchedStories.slice(0, MAX_STORIES),
      about: updatedAbout,
      lastUpdated: Date.now(),
    };
    saveCacheToDisk();
    logger.info(`Background sync completed. Stories cached: ${cache.stories.length}`);
    return;
  }

  if (cache.stories.length > 0) {
    cache = { ...cache, about: updatedAbout };
    saveCacheToDisk();
    logger.warn(`Background sync returned no stories. Keeping ${cache.stories.length} cached stories.`);
    return;
  }

  cache = {
    stories: DEFAULT_STORIES.map((s: any) => ({ ...s })),
    about: updatedAbout,
    lastUpdated: Date.now(),
  };
  logger.warn("Background sync returned no stories and no cache exists. Using default stories.");
}

async function serveSPAWithSEO(req: express.Request, res: express.Response, viteInstance?: any) {
  const slug = req.params.slug;

   if (cache.stories.length < 10) {
     try {
       await syncData();
     } catch (e) {
       logger.warn("Initial syncData failed, falling back to defaults", { error: e instanceof Error ? e.message : String(e) });
     }
   }

  const story = slug ? cache.stories.find((s) => s.slug === slug) : undefined;
  const title = story ? `${story.title} — The Ink Home` : "The Ink Home — Where Words Feel at Home";
  const description = story
    ? (story.description || "").replace(/\s+/g, " ").trim().slice(0, 160)
    : "The Ink Home is an independent Medium publication of essays on technology, culture, creativity, relationships and the quiet parts of being human.";
  const url = story ? `https://theinkhome.live/story/${story.slug}` : `https://theinkhome.live${req.originalUrl}`;
  const image = story?.cover || "https://theinkhome.live/assets/The_Ink_Home.webp";

  const safeTitle = escapeHtml(title);
  const safeDescription = escapeHtml(description);
  const safeUrl = escapeHtml(url);
  const safeImage = escapeHtml(image);

  let template: string;
  if (viteInstance) {
    template = fs.readFileSync(path.resolve(process.cwd(), "index.html"), "utf-8");
    template = await viteInstance.transformIndexHtml(req.originalUrl, template);
  } else {
    template = fs.readFileSync(path.resolve(process.cwd(), "dist", "index.html"), "utf-8");
  }

  const metaTags = `
    <title>${safeTitle}</title>
    <meta name="description" content="${safeDescription}" />
    <meta property="og:title" content="${safeTitle}" />
    <meta property="og:description" content="${safeDescription}" />
    <meta property="og:type" content="${story ? "article" : "website"}" />
    <meta property="og:url" content="${safeUrl}" />
    <meta property="og:image" content="${safeImage}" />
    <meta property="og:site_name" content="The Ink Home" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${safeTitle}" />
    <meta name="twitter:description" content="${safeDescription}" />
    <meta name="twitter:image" content="${safeImage}" />
    ${story ? `<meta property="article:published_time" content="${escapeHtml(story.pubDate)}" />` : ""}
    ${story ? `<meta name="author" content="${escapeHtml(story.author)}" />` : ""}
  `;

  const html = template.replace(/<title>[\s\S]*?<\/title>/i, metaTags);
  res.status(200).set({ "Content-Type": "text/html" }).end(html);
}

const premiumFallbacks: Record<string, string> = {
  "farhankabir133": "https://miro.medium.com/v2/resize:fit:2400/1*OonAmXM0uBzGf_KYL3s85w.png",
  "dbatool242": "https://miro.medium.com/v2/resize:fit:2400/1*4o35ax2_LSaOtP-3Lfi0Eg.jpeg",
};

function isPlaceholderUrl(url: string): boolean {
  if (!url) return true;
  const lower = url.toLowerCase();
  return lower.includes("unsplash.com") && lower.includes("photo-") && !lower.includes("miro.medium");
}

async function resolveAvatarFromHtml(html: string): Promise<string | null> {
  const patterns = [
    /<img[^>]+class=["'][^"']*avatar[^"']*["'][^>]+src=["']([^"']+)["']/i,
    /<img[^>]+src=["']([^"']+)["'][^>]+class=["'][^"']*avatar[^"']*["']/i,
    /property=["']og:image["'][^>]+content=["']([^"']+)["']/i,
    /<img[^>]+src=["'](https:\/\/cdn-images-1\.medium\.com[^"']+)["']/i,
    /<img[^>]+src=["'](https:\/\/miro\.medium\.com[^"']+)["']/i,
  ];
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match && match[1] && match[1].startsWith("http")) {
      return match[1];
    }
  }
  return null;
}

async function getMediumAvatarWithCache(username: string): Promise<string> {
  const clean = username.replace(/^@/, "").trim();
  if (!clean) return premiumFallbacks["farhankabir133"];
  const cacheKey = clean.toLowerCase();
  
  const cached = avatarCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.url;
  }

  if (premiumFallbacks[cacheKey]) {
    avatarCache.set(cacheKey, { url: premiumFallbacks[cacheKey], expiresAt: Date.now() + AVATAR_CACHE_TTL });
    return premiumFallbacks[cacheKey];
  }

  try {
    const rssUrl = `https://medium.com/feed/@${clean}`;
    const response = await fetchWithTimeout(rssUrl, 8000);
    if (response.ok) {
      const xml = await response.text();
      const imgMatch = xml.match(/<image>[\s\S]*?<url>(?:<!\[CDATA\[([\s\S]*?)\]\]>|([^<]*))<\/url>/i);
      if (imgMatch) {
        const imgUrl = (imgMatch[1] || imgMatch[2] || "").trim();
        if (imgUrl && imgUrl.startsWith("http") && !isPlaceholderUrl(imgUrl)) {
          avatarCache.set(cacheKey, { url: imgUrl, expiresAt: Date.now() + AVATAR_CACHE_TTL });
          return imgUrl;
        }
      }
    }
   } catch (err) {
     logger.warn("Tier 1 avatar fetch failed", { error: err instanceof Error ? err.message : String(err) });
   }

  try {
    const rss2jsonUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(`https://medium.com/feed/@${clean}`)}`;
    const response = await fetchWithTimeout(rss2jsonUrl, 8000);
    if (response.ok) {
      const data = await response.json();
      if (data && data.status === "ok" && data.feed && data.feed.image) {
        const imgUrl = data.feed.image.trim();
        if (imgUrl && imgUrl.startsWith("http") && !isPlaceholderUrl(imgUrl)) {
          avatarCache.set(cacheKey, { url: imgUrl, expiresAt: Date.now() + AVATAR_CACHE_TTL });
          return imgUrl;
        }
      }
    }
   } catch (err) {
     logger.warn("Tier 2 avatar fetch failed", { error: err instanceof Error ? err.message : String(err) });
   }

  try {
    const profileUrl = "https://medium.com/@" + clean;
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
     logger.warn("Tier 3 avatar fetch failed", { error: err instanceof Error ? err.message : String(err) });
   }

  try {
    const unavatarUrl = `https://unavatar.io/medium/${clean}`;
    const response = await fetchWithTimeout(unavatarUrl, 8000);
    if (response.ok && response.url && !isPlaceholderUrl(response.url)) {
      avatarCache.set(cacheKey, { url: response.url, expiresAt: Date.now() + AVATAR_CACHE_TTL });
      return response.url;
     }
   } catch (err) {
     logger.warn("Tier 4 avatar fetch failed", { error: err instanceof Error ? err.message : String(err) });
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
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'"],
          styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
          fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
          imgSrc: ["'self'", "data:", "https:", "blob:"],
          connectSrc: ["'self'", "https:"],
          mediaSrc: ["'self'", "https:"],
          objectSrc: ["'none'"],
          frameSrc: ["'self'", "https:"],
          upgradeInsecureRequests: [],
        },
      },
      crossOriginEmbedderPolicy: false,
      crossOriginResourcePolicy: { policy: "cross-origin" },
    })
  );

const requestLogger = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (process.env.NODE_ENV !== "production") {
      logger.info(`Request completed`, {
        method: req.method,
        url: req.originalUrl,
        status: res.statusCode,
        duration_ms: duration,
        timestamp: new Date().toISOString()
      });
    }
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
    res.set("Cache-Control", "no-store");
    return res.status(200).json({
      status: "ok",
      uptime: process.uptime(),
      stories: cache.stories.length,
      lastSync: cache.lastUpdated ? new Date(cache.lastUpdated).toISOString() : null,
    });
  });

  app.get("/api/stories", async (req, res) => {
    try {
      const cacheKey = "stories:latest";
      const cached = await redis.get(cacheKey);
      
      if (cached) {
        res.set("Cache-Control", "public, max-age=300, stale-while-revalidate=600");
        return res.json({ source: "redis", stories: cached });
      }

       // Fetch fresh stories if not in cache
       if (cache.stories.length < 10) {
         try {
           await syncData();
         } catch (err) {
           logger.error("Initial data sync failed", { error: err instanceof Error ? err.message : String(err) });
         }
       }

      // Store in Redis
      if (cache.stories.length > 0) {
        await redis.set(cacheKey, cache.stories, {
          ex: 300,
        });
      }

      res.set("Cache-Control", "public, max-age=300, stale-while-revalidate=600");
      return res.json({ source: "cache", stories: cache.stories });
     } catch (error) {
       logger.error("Stories API error", { error: error instanceof Error ? error.message : String(error) });
       res.status(500).json({ error: "Failed to fetch stories" });
     }
  });

  app.get("/api/about", async (req, res) => {
    try {
      const cached = await redis.get("about:publication");
      
      if (cached) {
        res.set("Cache-Control", "public, max-age=300, stale-while-revalidate=600");
        return res.json({ source: "redis", about: cached });
      }

       if (!cache.about) {
         try {
           await syncData();
         } catch (err) {
           logger.error("Initial about sync failed", { error: err instanceof Error ? err.message : String(err) });
         }
       }

      const aboutData = cache.about || FALLBACK_ABOUT;
      await redis.set("about:publication", aboutData, {
        ex: 300,
      });

      res.set("Cache-Control", "public, max-age=300, stale-while-revalidate=600");
      return res.json({ source: "cache", about: aboutData });
     } catch (error) {
       logger.error("About API error", { error: error instanceof Error ? error.message : String(error) });
       res.status(500).json({ error: "Failed to fetch about data" });
     }
  });

  app.post("/api/track", (req, res) => {
    res.set("Cache-Control", "no-store");
    let payload = req.body;
    if (typeof payload === "string") {
      try {
        payload = JSON.parse(payload);
      } catch (e) {}
    }
     if (process.env.NODE_ENV !== "production") {
       const event = req.query.event || "unknown";
       logger.debug(`Telemetry event: ${event}`);
     }
    res.status(200).json({ success: true });
  });

  app.post("/api/ai", async (req, res) => {
    res.set("Cache-Control", "no-store");
    res.set("X-Accel-Buffering", "false"); // Disable nginx buffering for streaming
    
    // Rate limiting using Redis
    const ip = req.ip || "unknown";
    const rateLimitKey = `ai:rate_limit:${ip}`;
    const now = Date.now();
    const windowMs = 60 * 1000;
    const maxRequests = 10;
    
    try {
      const count = await redis.incr(rateLimitKey);
      if (count === 1) {
        await redis.expire(rateLimitKey, windowMs / 1000);
      }
      
      if (count > maxRequests) {
        return res.status(429).json({ error: "Too many requests. Please try again later." });
      }
     } catch (err) {
       // If Redis fails, allow the request through (no rate limiting fallback)
       logger.warn("Redis rate limit failed, allowing request", { error: err instanceof Error ? err.message : String(err) });
     }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "AI assistant is not configured." });
    }

    try {
      const validation = AIRequestSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: "Invalid request format." });
      }

      const { messages, temperature = 0.5, max_tokens = 512 } = validation.data;

      const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: process.env.AI_MODEL || "openai/gpt-oss-20b",
          messages: [
            { role: "system", content: "You are Ink Assistant for The Ink Home. Help users with submission guidelines, how to become a writer, and publication information. Keep answers concise and helpful. Keep answers under 200 words." },
            ...messages.filter((m: any) => m.role !== "system"),
          ],
          temperature,
          max_tokens: Math.min(max_tokens, 512),
          stream: true, // Enable streaming
        }),
        signal: AbortSignal.timeout(30000),
      });

       if (!groqRes.ok) {
         logger.error("Groq API error", { status: groqRes.status });
         if (groqRes.status === 429) {
           return res.status(429).json({ error: "AI service rate limit exceeded. Please try again later." });
         }
         return res.status(503).json({ error: "AI service temporarily unavailable. Please try again later." });
       }

      // Stream response back to client
      const { Readable } = await import("stream");
      const readable = Readable.from(groqRes.body as any);
      
      res.setHeader("Content-Type", "application/json");
      
      let fullReply = "";
      
      for await (const chunk of groqRes.body as any) {
        const text = chunk.toString();
        // Parse SSE or JSON lines from Groq
        const lines = text.split("\n");
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const dataStr = line.slice(6);
            try {
              const data = JSON.parse(dataStr);
              if (data.choices?.[0]?.delta?.content) {
                fullReply += data.choices[0].delta.content;
              }
              if (data.done) {
                break;
              }
            } catch {
              // Ignore parse errors
            }
          }
        }
      }
      
      if (!fullReply) {
        const data = await groqRes.json();
        const reply = data?.choices?.[0]?.message?.content || "";
        if (!reply) {
          return res.status(502).json({ error: "AI response was empty. Please try again." });
        }
        return res.status(200).json({ reply });
      }
      
      return res.status(200).json({ reply: fullReply });
     } catch (error) {
       logger.error("AI endpoint error", { error: error instanceof Error ? error.message : String(error) });
       return res.status(500).json({ error: "AI assistant temporarily unavailable. Please try again." });
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
    app.use("/fonts", express.static(path.join(process.cwd(), "dist", "fonts"), { maxAge: "1y", immutable: true }));
    app.use(express.static(path.join(process.cwd(), "dist"), { maxAge: "1h" }));
  }

  app.get("/story/:slug", (req, res, next) => serveSPAWithSEO(req, res, vite));
  app.get("/stories", (req, res, next) => serveSPAWithSEO(req, res, vite));
  app.get("/writers", (req, res, next) => serveSPAWithSEO(req, res, vite));
  app.get("/about", (req, res, next) => serveSPAWithSEO(req, res, vite));

  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api/")) return next();
    return serveSPAWithSEO(req, res, vite);
  });

   loadCacheFromDisk();
   syncData().catch((err) => logger.warn("Initial background sync failed", { error: err instanceof Error ? err.message : String(err) }));
   const syncInterval = setInterval(() => {
     syncData().catch((err) => logger.warn("Scheduled background sync failed", { error: err instanceof Error ? err.message : String(err) }));
   }, 15 * 60 * 1000);

  process.on("SIGTERM", () => {
    clearInterval(syncInterval);
  });

   app.listen(PORT, "0.0.0.0", () => {
     logger.info(`The Ink Home server running on http://0.0.0.0:${PORT}`);
   });
}

startServer();
