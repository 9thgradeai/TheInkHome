import type { VercelRequest, VercelResponse } from "@vercel/node";
export default function handler(_req: VercelRequest, res: VercelResponse) {
  res.status(200).json({ status: "ok", uptime: process.uptime(), service: "the-ink-home" });
}
