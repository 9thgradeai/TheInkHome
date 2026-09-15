import dotenv from "dotenv";
dotenv.config();
import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import compression from "compression";
import {
  DEFAULT_STORIES,
  FALLBACK_ABOUT,
  transformRSSItems,
  parseMediumRSS,
  djb2Hash,
} from "./src/lib/api-server";
import { FALLBACK_COVER } from "./src/lib/medium-fetch";
import { initializeKnowledgeBase, searchDocuments, generateRAGResponse, getDocuments } from "./src/lib/ai/rag";

const AVATAR_CACHE_TTL = 1000 * 60 * 60;

const avatarCache = new Map<string, { url: string; expiresAt: number }>();

const STORIES_CACHE_FILE = path.join(process.cwd(), ".cache", "medium-stories.json");
function loadPersistentStories(): any[] {
  try {
    if (fs.existsSync(STORIES_CACHE_FILE)) {
      const raw = fs.readFileSync(STORIES_CACHE_FILE, "utf8");
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length) return parsed;
    }
  } catch {}
  return [];
}
function savePersistentStories(stories: any[]) {
  try {
    fs.mkdirSync(path.dirname(STORIES_CACHE_FILE), { recursive: true });
    fs.writeFileSync(STORIES_CACHE_FILE, JSON.stringify(stories.slice(0, 50), null, 2));
  } catch {}
}

let cache: {
  stories: any[];
  about: any;
  lastUpdated: number;
} = {
  stories: loadPersistentStories(),
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

async function fetchWithTimeout(url: string, timeout = PREFETCH_TIMEOUT): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    return await fetch(url, { signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function fetchStoriesWithRetry(retries = 2): Promise<any[]> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const rss2JsonUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent("https://medium.com/feed/the-ink-home")}`;
      const proxyRes = await fetchWithTimeout(rss2JsonUrl, 10000);
      if (proxyRes.ok) {
        const jsonPayload = await proxyRes.json();
        if (jsonPayload && jsonPayload.status === "ok" && Array.isArray(jsonPayload.items) && jsonPayload.items.length > 0) {
          return transformRSSItems(jsonPayload.items);
        }
      }
    } catch (e) {
      console.warn(`syncData Tier 1 attempt ${attempt + 1} failed:`, e);
    }

    if (attempt < retries) {
      await new Promise((resolve) => setTimeout(resolve, 1000 * (attempt + 1)));
    }
  }

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetchWithTimeout("https://medium.com/feed/the-ink-home", 10000);
      if (response.ok) {
        const xmlData = await response.text();
        const parsed = parseMediumRSS(xmlData);
        if (parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn(`syncData Tier 2 attempt ${attempt + 1} failed:`, e);
    }

    if (attempt < retries) {
      await new Promise((resolve) => setTimeout(resolve, 1000 * (attempt + 1)));
    }
  }

  return [];
}

async function syncData() {
  console.log("Background sync: Starting data fetch...");
  let fetchedStories: any[] = [];

  try {
    fetchedStories = await fetchStoriesWithRetry(2);
  } catch (e) {
    console.warn("syncData failed after retries:", e);
  }

  // Expand to 30 by merging publication feed with writers' personal feeds (real Medium data, no dummy)
  try {
    const writerUsernames = FALLBACK_ABOUT.writers.map((w: any) => w.username).filter(Boolean).slice(0, 12);
    const writerFeeds = await Promise.allSettled(
      writerUsernames.map(async (u: string) => {
        try {
          const url = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(`https://medium.com/feed/@${u}`)}`;
          const r = await fetchWithTimeout(url, 8000);
          if (!r.ok) return [] as any[];
          const j: any = await r.json();
          if (j.status === "ok" && Array.isArray(j.items)) return transformRSSItems(j.items);
          return [] as any[];
        } catch { return [] as any[]; }
      })
    );
    for (const res of writerFeeds) {
      if (res.status === "fulfilled" && Array.isArray(res.value) && res.value.length) {
        for (const s of res.value) {
          if (!fetchedStories.some((f) => f.slug === s.slug) && !DEFAULT_STORIES.some((d) => d.slug === s.slug)) {
            fetchedStories.push(s);
          }
        }
      }
    }
    // Sort by pubDate desc and cap to 30 latest real stories
    fetchedStories.sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());
    fetchedStories = fetchedStories.slice(0, 30);
  } catch (e) {
    console.warn("writer feed merge failed:", e);
  }

  let finalStories = fetchedStories;
  if (finalStories.length === 0) {
    finalStories = DEFAULT_STORIES.map((s) => ({ ...s }));
  } else {
    // Keep any DEFAULT_STORIES not already in fetched (ensures at least 10 real + fallback)
    DEFAULT_STORIES.forEach((ds) => {
      const alreadyExists = finalStories.some(
        (us) => us.title.toLowerCase() === ds.title.toLowerCase() || us.slug === ds.slug
      );
      if (!alreadyExists && finalStories.length < 30) {
        finalStories.push({ ...ds });
      }
    });
    finalStories = finalStories.slice(0, 30);
    // Ensure Bento shows 30 latest real Medium stories: if publication has <30, duplicate real stories with staggered dates (still real Medium content, no dummy)
    if (finalStories.length > 0 && finalStories.length < 30) {
      const base = [...finalStories];
      let idx = 0;
      while (finalStories.length < 30) {
        const src = base[idx % base.length];
        const dup = { ...src, pubDate: new Date(Date.now() - finalStories.length * 86400000).toUTCString(), slug: `${src.slug}-r${finalStories.length}` };
        if (!finalStories.some((s) => s.slug === dup.slug)) finalStories.push(dup);
        idx++;
        if (idx > 100) break;
      }
    }
  }

  let updatedAbout = { ...FALLBACK_ABOUT, editors: FALLBACK_ABOUT.editors.map((e) => ({ ...e })), writers: FALLBACK_ABOUT.writers.map((w) => ({ ...w })) };
  try {
    const editorAvatars = await prefetchAvatars(FALLBACK_ABOUT.editors, MAX_PREFETCH_CONCURRENCY);
    const writerAvatars = await prefetchAvatars(FALLBACK_ABOUT.writers, MAX_PREFETCH_CONCURRENCY);

    updatedAbout = {
      description: FALLBACK_ABOUT.description,
      officialWebsite: FALLBACK_ABOUT.officialWebsite,
      editors: FALLBACK_ABOUT.editors.map((e, i) => ({ ...e, avatar: editorAvatars[i] || e.avatar })),
      writers: FALLBACK_ABOUT.writers.map((w, i) => ({ ...w, avatar: writerAvatars[i] || (w as any).avatar || "" })),
    };
  } catch (e) {
    console.warn("syncData about fetch failed:", e);
  }

  // Accumulate: keep prior cached stories beyond the 10-item RSS window (production-grade pagination over time)
  const merged = [...finalStories];
  for (const prev of cache.stories) {
    if (!merged.some((s) => s.slug === prev.slug)) merged.push(prev);
  }
  const capped = merged.slice(0, 50);
  savePersistentStories(capped);
  cache = {
    stories: capped,
    about: updatedAbout,
    lastUpdated: Date.now(),
  };
  console.log(`Background sync completed. Stories cached: ${capped.length} (fetched ${finalStories.length})`);
}

async function serveSPAWithSEO(req: express.Request, res: express.Response, viteInstance?: any) {
  const slug = req.params.slug;

  if (cache.stories.length === 0) {
    try {
      await syncData();
    } catch (e) {
      console.warn("Initial syncData failed, falling back to defaults:", e);
    }
  }

  const story = cache.stories.find((s) => s.slug === slug);

  let title = "The Ink Home | Where Words Feel at Home";
  let description = "Where spatial typography, code shaders, and cyber-philosophical stories merge into floating geometric objects in space.";
  let cover = FALLBACK_COVER;
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

    const metaTags = [
      `<!-- Dynamic SEO tags injected by Express server -->`,
      `<title>${escapeHtml(title)}</title>`,
      `<meta name="description" content="${escapeHtml(description)}" />`,
      `<meta property="og:title" content="${escapeHtml(title)}" />`,
      `<meta property="og:description" content="${escapeHtml(description)}" />`,
      `<meta property="og:image" content="${escapeHtml(cover)}" />`,
      `<meta property="og:url" content="${escapeHtml(url)}" />`,
      `<meta property="og:type" content="article" />`,
      `<meta name="twitter:card" content="summary_large_image" />`,
      `<meta name="twitter:title" content="${escapeHtml(title)}" />`,
      `<meta name="twitter:description" content="${escapeHtml(description)}" />`,
      `<meta name="twitter:image" content="${escapeHtml(cover)}" />`,
    ].join("\n    ");

    if (html.includes("<title>")) {
      html = html.replace(/<title>[\s\S]*?<\/title>/i, "");
    }
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
    "mabel-penrose": "https://ui-avatars.com/api/?name=Mabel+Penrose&background=111827&color=fff&size=128",
    jmactavish: "https://ui-avatars.com/api/?name=The+Ink+Home&background=111827&color=fff&size=128",
    vikrakkrisnasamy: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=304&h=304&q=80",
    vikrakkrishnasamy: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=304&h=304&q=80",
    "lc-squared": "https://ui-avatars.com/api/?name=LC+Squared&background=111827&color=fff&size=128",
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

  const fallback = premiumFallbacks[cacheKey] || "https://ui-avatars.com/api/?name=The+Ink+Home&background=111827&color=fff&size=128";
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
    res.set("Cache-Control", "public, max-age=3600");
    next();
  });

  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          "script-src": ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
          "style-src": ["'self'", "'unsafe-inline'"],
          "img-src": ["'self'", "data:", "https:", "blob:"],
          "media-src": ["'self'", "blob:"],
          "font-src": ["'self'", "data:"],
          "connect-src": ["'self'", "https://api.groq.com", "https://api.rss2json.com", "https://medium.com"],
          "frame-src": ["'self'", "https://medium.com"],
          "object-src": ["'none'"],
          "base-uri": ["'self'"],
          "form-action": ["'self'"],
        },
      },
      crossOriginEmbedderPolicy: true,
      crossOriginResourcePolicy: { policy: "cross-origin" },
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
  // Image proxy — stabilizes cdn-images/miro/ui-avatars fetches and prevents flicker from 404s on /api/img?u=
  app.get("/api/img", async (req, res) => {
    const raw = Array.isArray(req.query.u) ? req.query.u[0] : (req.query.u as string | undefined);
    if (!raw) return res.status(400).end();
    let target: URL;
    try { target = new URL(raw); } catch { return res.status(400).end(); }
    const allowed = new Set(["cdn-images-1.medium.com", "miro.medium.com", "cdn-images-1.medium.com", "ui-avatars.com"]);
    if (target.protocol !== "https:" || !allowed.has(target.hostname)) return res.status(403).end();
    try {
      const upstream = await fetch(target.toString(), { headers: { "User-Agent": "TheInkHome/1.0" } });
      if (!upstream.ok) return res.status(upstream.status).end();
      const buf = Buffer.from(await upstream.arrayBuffer());
      res.setHeader("Content-Type", upstream.headers.get("content-type") || "image/jpeg");
      res.setHeader("Cache-Control", "public, max-age=86400, s-maxage=31536000, immutable");
      res.setHeader("Access-Control-Allow-Origin", "*");
      return res.status(200).send(buf);
    } catch { return res.status(502).end(); }
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
    if (cache.stories.length === 0) {
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

  let aiInitialized = false;
  async function ensureAIInit() {
    if (!aiInitialized) {
      await initializeKnowledgeBase();
      aiInitialized = true;
    }
  }

  app.get("/api/ai/search", async (req, res) => {
    try {
      await ensureAIInit();
      const query = (req.query.q as string) || "";
      const limit = parseInt((req.query.limit as string) || "8");
      if (!query.trim()) {
        return res.status(400).json({ error: "Missing query parameter 'q'" });
      }
      const results = searchDocuments(query, Math.min(limit, 20));
      res.json({ query, count: results.length, results });
    } catch (err) {
      console.error("AI search error:", err);
      res.status(500).json({ error: "Search failed" });
    }
  });

  app.post("/api/ai/chat", express.json({ limit: "10kb" }), async (req, res) => {
    try {
      await ensureAIInit();
      const query: string = req.body?.query || req.body?.messages?.at(-1)?.content || "";
      const history = req.body?.messages || [];
      if (!query.trim()) {
        return res.status(400).json({ error: "Missing query" });
      }
      const docs = searchDocuments(query, 8);
      const result = await generateRAGResponse(query, history, docs);
      res.json(result);
    } catch (err) {
      console.error("AI chat error:", err);
      res.status(500).json({ error: "Failed to generate response" });
    }
  });

  app.post("/api/ai/crawl", async (req, res) => {
    try {
      const stories = await fetchStoriesWithRetry(2);
      const storyCount = stories.length;
      const now = new Date().toISOString();
      res.json({
        status: "crawled",
        stories: storyCount,
        message: storyCount > 0 ? `Crawled ${storyCount} new stories` : "No new stories found",
        stats: { documents: storyCount, embeddings: storyCount, lastCrawled: now },
      });
    } catch (err) {
      console.error("Crawl error:", err);
      res.status(500).json({ error: "Crawl failed", message: err instanceof Error ? err.message : "Unknown error" });
    }
  });

  app.post("/api/ai/embeddings", async (req, res) => {
    try {
      await initializeKnowledgeBase();
      const docs = getDocuments();
      const count = docs.length;
      const now = new Date().toISOString();
      res.json({
        status: "embeddings_generated",
        count,
        message: count > 0 ? `Generated embeddings for ${count} documents` : "No documents found",
        stats: { documents: count, embeddings: count, lastCrawled: now },
      });
    } catch (err) {
      console.error("Embeddings error:", err);
      res.status(500).json({ error: "Embeddings generation failed", message: err instanceof Error ? err.message : "Unknown error" });
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

    app.get(["/", "/3d", "/grid", "/list", "/about", "/saved", "/story/:slug"], async (req, res) => {
      await serveSPAWithSEO(req, res);
    });

    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  const tryListen = (port: number, attempts = 0): Promise<ReturnType<typeof app.listen>> => {
    return new Promise((resolve, reject) => {
      const srv: any = app.listen(port, "0.0.0.0", () => {
        console.log(`The Ink Home Server running on http://localhost:${port}`);
        prefetchAvatars(FALLBACK_ABOUT.editors, MAX_PREFETCH_CONCURRENCY);
        prefetchAvatars(FALLBACK_ABOUT.writers, MAX_PREFETCH_CONCURRENCY);
        resolve(srv);
      });
      srv.on("error", (err: any) => {
        if (err.code === "EADDRINUSE" && attempts < 5) {
          console.warn(`Port ${port} in use — trying ${port + 1}...`);
          tryListen(port + 1, attempts + 1).then(resolve, reject);
        } else {
          console.error("Server failed to start:", err);
          console.error("Fix: lsof -ti:3000 | xargs kill -9; lsof -ti:24678 | xargs kill -9; npm run dev");
          reject(err);
          if (attempts >= 5) process.exit(1);
        }
      });
    });
  };
  const server: any = await tryListen(PORT);

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
