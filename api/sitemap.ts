import type { VercelRequest, VercelResponse } from "@vercel/node";
import { buildSitemap } from "../src/lib/sitemap.js";

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  if (_req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  res.setHeader("X-Content-Type-Options", "nosniff");

  try {
    const xml = await buildSitemap();
    res.setHeader("Content-Type", "application/xml; charset=utf-8");
    res.setHeader("Cache-Control", "public, max-age=3600");
    return res.status(200).send(xml);
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    console.error("sitemap handler failed", detail);
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    return res.status(500).send("Sitemap unavailable");
  }
}

export const maxDuration = 30;
