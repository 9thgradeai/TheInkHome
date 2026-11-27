import { getPublicationStories } from "./api-server.js";

/**
 * Sitemap for crawlers.
 *
 * Built from the live archive so new stories appear without a redeploy, with a
 * static fallback for the routes that always exist.
 */
const SITE_URL = "https://theinkhome.live";

const STATIC_PATHS = [
  "/",
  "/stories",
  "/writers",
  "/about",
  "/desk",
  "/saved",
  "/privacy",
  "/terms",
  "/editorial",
] as const;

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function buildSitemap(): Promise<string> {
  let storyPaths: string[] = [];
  try {
    const { stories } = await getPublicationStories();
    storyPaths = stories.map((story) => `/story/${story.slug}`);
  } catch {
    // The static routes still make a valid sitemap.
  }

  const lastmod = new Date().toISOString().slice(0, 10);
  const entries = [...STATIC_PATHS, ...storyPaths]
    .map(
      (route) =>
        `  <url>\n    <loc>${escapeXml(`${SITE_URL}${route}`)}</loc>\n    <lastmod>${lastmod}</lastmod>\n  </url>`,
    )
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries}\n</urlset>\n`;
}
