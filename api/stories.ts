import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getPublicationStories } from "../src/lib/api-server.ts";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  res.setHeader("X-Content-Type-Options", "nosniff");

  try {
    const { stories, source } = await getPublicationStories();
    res.setHeader("Cache-Control", "public, max-age=300, stale-while-revalidate=600");
    return res.status(200).json({ source, stories });
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    console.error("stories handler failed", detail);
    res.setHeader("Cache-Control", "no-store");
    return res.status(500).json({ error: "Failed to load stories" });
  }
}

export const maxDuration = 60;
