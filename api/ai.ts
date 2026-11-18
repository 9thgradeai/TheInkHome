import type { VercelRequest, VercelResponse } from "@vercel/node";
import { runInkAssistant, getClientIp } from "../src/lib/ai-server.ts";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const result = await runInkAssistant({
    body: req.body,
    ip: getClientIp(req.headers as Record<string, string | string[] | undefined>),
  });

  return res.status(result.status).json(result.body);
}

export const maxDuration = 60;
