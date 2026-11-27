import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import compression from "compression";
import dotenv from "dotenv";
import { createLogger, format, transports } from "winston";
import {
  getPublicationStories,
  primePublicationCache,
  getCachedPublication,
} from "./src/lib/api-server.ts";
import { FALLBACK_ABOUT } from "./src/data/fallbackAbout.ts";
import { runInkAssistant, getClientIp } from "./src/lib/ai-server.ts";
import { buildSitemap } from "./src/lib/sitemap.ts";

dotenv.config();

const isProduction = process.env.NODE_ENV === "production";

const logger = createLogger({
  level: isProduction ? "info" : "debug",
  format: format.combine(format.timestamp(), format.json()),
  transports: [new transports.Console()],
});

const DISK_CACHE_FILE = path.join(process.cwd(), ".cache", "publication.json");
const DISK_SYNC_INTERVAL_MS = 10 * 60 * 1000;

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function loadDiskCache(): void {
  try {
    if (!fs.existsSync(DISK_CACHE_FILE)) return;
    const payload = JSON.parse(fs.readFileSync(DISK_CACHE_FILE, "utf8"));
    if (Array.isArray(payload?.stories) && payload.stories.length > 0) {
      primePublicationCache(payload.stories, payload.source || "disk-cache");
      logger.info(`Loaded ${payload.stories.length} stories from disk cache`);
    }
  } catch (error) {
    logger.warn("Could not load disk cache", {
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

function saveDiskCache(): void {
  try {
    const cached = getCachedPublication();
    if (!cached || cached.stories.length === 0) return;
    fs.mkdirSync(path.dirname(DISK_CACHE_FILE), { recursive: true });
    fs.writeFileSync(
      DISK_CACHE_FILE,
      JSON.stringify({ stories: cached.stories, source: cached.source, lastUpdated: Date.now() }),
      "utf8",
    );
  } catch (error) {
    logger.warn("Could not save disk cache", {
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

const SITE_URL = "https://theinkhome.live";
const DEFAULT_IMAGE = `${SITE_URL}/assets/og-image.jpg`;

interface RouteMeta {
  title: string;
  description: string;
  image: string;
  type: "website" | "article";
  canonical: string;
  robots?: string;
  jsonLd?: Record<string, unknown>;
}

/** Static routes get their own title, description and structured data. */
function routeMeta(pathname: string): RouteMeta | null {
  const staticRoutes: Record<string, { title: string; description: string }> = {
    "/": {
      title: "The Ink Home — Where Words Feel at Home",
      description:
        "An independent publication of essays on technology, culture, creativity, relationships and the quiet parts of being human.",
    },
    "/stories": {
      title: "Stories | The Ink Home",
      description:
        "Every essay in The Ink Home, searchable across titles, bylines, topics and full text.",
    },
    "/writers": {
      title: "Writers | The Ink Home",
      description: "Meet the writers and editors behind The Ink Home.",
    },
    "/about": {
      title: "About | The Ink Home",
      description: "What The Ink Home publishes, who edits it, and how to submit your writing.",
    },
    "/desk": {
      title: "The Desk | The Ink Home",
      description: "A local-first drafting space for preparing work before it goes out.",
    },
    "/saved": {
      title: "Reading list | The Ink Home",
      description: "Stories you saved or liked, kept on this device.",
    },
    "/privacy": {
      title: "Privacy | The Ink Home",
      description: "How The Ink Home handles your data.",
    },
    "/terms": {
      title: "Terms | The Ink Home",
      description: "Terms of use for The Ink Home.",
    },
    "/editorial": {
      title: "Editorial policy | The Ink Home",
      description: "How The Ink Home chooses, edits and credits what it publishes.",
    },
  };

  const entry = staticRoutes[pathname];
  if (entry) {
    return {
      ...entry,
      image: DEFAULT_IMAGE,
      type: "website",
      canonical: `${SITE_URL}${pathname}`,
      jsonLd:
        pathname === "/"
          ? {
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: "The Ink Home",
              url: SITE_URL,
              description: entry.description,
              potentialAction: {
                "@type": "SearchAction",
                target: `${SITE_URL}/stories?q={search_term_string}`,
                "query-input": "required name=search_term_string",
              },
            }
          : undefined,
    };
  }

  const writerMatch = pathname.match(/^\/writer\/([^/]+)$/);
  if (writerMatch) {
    const name = decodeURIComponent(writerMatch[1])
      .split("-")
      .filter(Boolean)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
    return {
      title: `${name || "Writer"} | The Ink Home`,
      description: `Stories and profile for ${name || "this writer"} at The Ink Home.`,
      image: DEFAULT_IMAGE,
      type: "website",
      canonical: `${SITE_URL}${pathname}`,
    };
  }

  return null;
}

async function serveSPAWithSEO(
  req: express.Request,
  res: express.Response,
  vite?: any,
): Promise<void> {
  const slug = req.params.slug;
  const pathname = req.path;

  let stories: Awaited<ReturnType<typeof getPublicationStories>>["stories"] = [];
  try {
    const result = await getPublicationStories();
    stories = result.stories;
  } catch (error) {
    logger.warn("SEO story lookup failed", {
      error: error instanceof Error ? error.message : String(error),
    });
  }

  const story = slug ? stories.find((s) => s.slug === slug) : undefined;
  const meta = routeMeta(pathname);

  let title: string;
  let description: string;
  let image: string;
  let type: "website" | "article";
  let canonical: string;
  let robots: string | undefined;
  let jsonLd: Record<string, unknown> | undefined;

  if (story) {
    title = `${story.title} — The Ink Home`;
    description = (story.description || "A story from The Ink Home on Medium.")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 160);
    image = story.cover || DEFAULT_IMAGE;
    type = "article";
    canonical = `${SITE_URL}/story/${story.slug}`;
    jsonLd = {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: story.title,
      description,
      image,
      datePublished: new Date(story.pubDate).toISOString(),
      author: { "@type": "Person", name: story.author },
      publisher: { "@type": "Organization", name: "The Ink Home", url: SITE_URL },
      mainEntityOfPage: canonical,
    };
  } else if (meta) {
    ({ title, description, image, type, canonical, jsonLd } = meta);
    robots = meta.robots;
  } else if (slug) {
    // A story URL we could not resolve: let the client render the not-found state,
    // but keep it out of the index so crawlers do not accumulate dead links.
    title = "Story not found | The Ink Home";
    description = "This story could not be found in The Ink Home's archive.";
    image = DEFAULT_IMAGE;
    type = "website";
    canonical = `${SITE_URL}${pathname}`;
    robots = "noindex, follow";
  } else {
    title = "The Ink Home — Where Words Feel at Home";
    description =
      "An independent publication of essays on technology, culture, creativity, relationships and the quiet parts of being human.";
    image = DEFAULT_IMAGE;
    type = "website";
    canonical = `${SITE_URL}${pathname}`;
    robots = "noindex, follow";
  }

  const url = canonical;
  const safeTitle = escapeHtml(title);
  const safeDescription = escapeHtml(description);
  const safeUrl = escapeHtml(url);
  const safeImage = escapeHtml(image);

  let template: string;
  if (vite) {
    template = fs.readFileSync(path.resolve(process.cwd(), "index.html"), "utf-8");
    template = await vite.transformIndexHtml(req.originalUrl, template);
  } else {
    template = fs.readFileSync(path.resolve(process.cwd(), "dist", "index.html"), "utf-8");
  }

  const metaTags = `
    <title>${safeTitle}</title>
    <meta name="description" content="${safeDescription}" />
    <link rel="canonical" href="${safeUrl}" />
    ${robots ? `<meta name="robots" content="${escapeHtml(robots)}" />` : ""}
    <meta property="og:title" content="${safeTitle}" />
    <meta property="og:description" content="${safeDescription}" />
    <meta property="og:type" content="${type}" />
    <meta property="og:url" content="${safeUrl}" />
    <meta property="og:image" content="${safeImage}" />
    <meta property="og:site_name" content="The Ink Home" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${safeTitle}" />
    <meta name="twitter:description" content="${safeDescription}" />
    <meta name="twitter:image" content="${safeImage}" />
    ${story ? `<meta property="article:published_time" content="${escapeHtml(story.pubDate)}" />` : ""}
    ${story ? `<meta name="author" content="${escapeHtml(story.author)}" />` : ""}
    ${jsonLd ? `<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>` : ""}
  `;

  const html = template.replace(/<title>[\s\S]*?<\/title>/i, metaTags);
  res.status(200).set({ "Content-Type": "text/html" }).end(html);
}

/** Sitemap covering the static routes and every story in the live archive. */
async function serveSitemap(_req: express.Request, res: express.Response): Promise<void> {
  try {
    const xml = await buildSitemap();
    res
      .set({
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "public, max-age=3600",
      })
      .status(200)
      .send(xml);
  } catch (error) {
    logger.error("Sitemap generation failed", {
      error: error instanceof Error ? error.message : String(error),
    });
    res.status(500).type("text/plain").send("Sitemap unavailable");
  }
}

async function startServer(): Promise<void> {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.disable("x-powered-by");
  app.use(compression());
  app.use(express.json({ limit: "100kb" }));

  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: isProduction ? ["'self'"] : ["'self'", "'unsafe-inline'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          fontSrc: ["'self'", "data:"],
          imgSrc: ["'self'", "data:", "https:", "blob:"],
          connectSrc: ["'self'"],
          mediaSrc: ["'self'", "https:"],
          objectSrc: ["'none'"],
          frameSrc: ["'self'", "https:"],
          baseUri: ["'self'"],
          formAction: ["'self'"],
          upgradeInsecureRequests: [],
        },
      },
      crossOriginEmbedderPolicy: false,
      crossOriginResourcePolicy: { policy: "cross-origin" },
      referrerPolicy: { policy: "strict-origin-when-cross-origin" },
    }),
  );

  const requestLogger: express.RequestHandler = (req, res, next) => {
    const start = Date.now();
    res.on("finish", () => {
      const duration = Date.now() - start;
      if (!isProduction) {
        logger.info("Request completed", {
          method: req.method,
          url: req.originalUrl,
          status: res.statusCode,
          duration_ms: duration,
        });
      }
    });
    next();
  };
  app.use(requestLogger);

  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Too many requests, please try again later" },
  });
  app.use("/api/", apiLimiter);

  app.get("/api/health", (_req, res) => {
    res.set("Cache-Control", "no-store");
    const cached = getCachedPublication();
    return res.status(200).json({
      status: "ok",
      uptime: process.uptime(),
      stories: cached?.stories.length ?? 0,
      lastSync: cached?.fetchedAt ? new Date(cached.fetchedAt).toISOString() : null,
    });
  });

  app.get("/api/stories", async (_req, res) => {
    try {
      const { stories, source } = await getPublicationStories();
      res.set("Cache-Control", "public, max-age=300, stale-while-revalidate=600");
      return res.json({ source, stories });
    } catch (error) {
      logger.error("Stories API error", {
        error: error instanceof Error ? error.message : String(error),
      });
      res.set("Cache-Control", "no-store");
      return res.status(500).json({ error: "Failed to load stories" });
    }
  });

  app.get("/api/about", (_req, res) => {
    res.set("Cache-Control", "public, max-age=300, stale-while-revalidate=600");
    return res.json(FALLBACK_ABOUT);
  });

  app.post("/api/ai", async (req, res) => {
    res.set("Cache-Control", "no-store");
    const result = await runInkAssistant({
      body: req.body,
      ip: getClientIp(req.headers as Record<string, string | string[] | undefined>, req.ip || "unknown"),
    });
    return res.status(result.status).json(result.body);
  });

  let vite: any;
  if (!isProduction) {
    vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(
      "/assets",
      express.static(path.join(process.cwd(), "dist", "assets"), { maxAge: "1y", immutable: true }),
    );
    app.use("/fonts", express.static(path.join(process.cwd(), "dist", "fonts"), { maxAge: "1y", immutable: true }));
    app.use(express.static(path.join(process.cwd(), "dist"), { maxAge: "1h", index: false }));
  }

  app.get("/sitemap.xml", (req, res) => void serveSitemap(req, res));

  app.get("/story/:slug", (req, res) => void serveSPAWithSEO(req, res, vite));
  app.get("/stories", (req, res) => void serveSPAWithSEO(req, res, vite));
  app.get("/writers", (req, res) => void serveSPAWithSEO(req, res, vite));
  app.get("/about", (req, res) => void serveSPAWithSEO(req, res, vite));

  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api/")) return next();
    return void serveSPAWithSEO(req, res, vite);
  });

  loadDiskCache();

  // Warm the cache in the background; failures are non-fatal (we serve stale/empty).
  getPublicationStories({ force: true })
    .then((result) => {
      logger.info(`Initial sync complete: ${result.stories.length} stories (${result.source})`);
      saveDiskCache();
    })
    .catch((error) => logger.warn("Initial sync failed", { error: error instanceof Error ? error.message : String(error) }));

  const syncInterval = setInterval(() => {
    getPublicationStories({ force: true })
      .then((result) => {
        logger.info(`Scheduled sync complete: ${result.stories.length} stories`);
        saveDiskCache();
      })
      .catch((error) => logger.warn("Scheduled sync failed", { error: error instanceof Error ? error.message : String(error) }));
  }, DISK_SYNC_INTERVAL_MS);

  process.on("SIGTERM", () => clearInterval(syncInterval));

  app.listen(PORT, "0.0.0.0", () => {
    logger.info(`The Ink Home server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((error) => {
  logger.error("Server failed to start", { error: error instanceof Error ? error.message : String(error) });
  process.exit(1);
});
