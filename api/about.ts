import type { VercelRequest, VercelResponse } from "@vercel/node";

const FALLBACK_ABOUT = {
  description: "The Ink Home is a place where words feel at home.",
  officialWebsite: "https://theinkhome.live/",
  editors: [{ name: "Farhan Kabir", role: "AI Engineer | Full-Stack Dev" }],
  writers: [],
};

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Cache-Control", "public, max-age=300, stale-while-revalidate=600");
  return res.status(200).json(FALLBACK_ABOUT);
}

export const maxDuration = 15;
