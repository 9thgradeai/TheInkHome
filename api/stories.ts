import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getPublicationStories } from "../src/lib/api-server.ts";

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Cache-Control", "public, max-age=300, stale-while-revalidate=600");
  return res.status(200).json({ source: "import-test", stories: [] });
}

export const maxDuration = 60;
