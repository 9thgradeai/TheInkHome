import type { VercelRequest, VercelResponse } from "@vercel/node";
import { transformRSSItems, parseMediumRSS } from "../../src/lib/api-server";

async function fetchWithTimeout(url: string, timeout = 8000): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    return await fetch(url, { signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function fetchFreshStories(): Promise<any[]> {
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
    console.error("Crawl RSS2JSON failed:", e);
  }

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
    console.error("Crawl RSS fetch failed:", e);
  }

  return [];
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const stories = await fetchFreshStories();
    const storyCount = stories.length;
    const now = new Date().toISOString();
    return res.status(200).json({
      status: "crawled",
      stories: storyCount,
      message: storyCount > 0 ? `Crawled ${storyCount} new stories` : "No new stories found",
      stats: {
        documents: storyCount,
        embeddings: storyCount,
        lastCrawled: now,
      },
    });
  } catch (err) {
    console.error("Crawl error:", err);
    return res.status(500).json({
      error: "Crawl failed",
      message: err instanceof Error ? err.message : "Unknown error",
    });
  }
}
