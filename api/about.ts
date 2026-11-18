import type { VercelRequest, VercelResponse } from "@vercel/node";
import { FALLBACK_ABOUT } from "../src/data/fallbackAbout.ts";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Cache-Control", "public, max-age=300, stale-while-revalidate=600");
  return res.status(200).json(FALLBACK_ABOUT);
}

export const maxDuration = 15;
