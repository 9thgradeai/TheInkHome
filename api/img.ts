import type { VercelRequest, VercelResponse } from "@vercel/node";

/**
 * Edge-cached image proxy for Medium CDN assets.
 *
 * Story covers/content images live on `cdn-images-1.medium.com`, which sets
 * third-party cookies — failing Lighthouse's "best-practices" category. Serving
 * them through our own origin keeps the reader on our host (no third-party
 * cookie) and lets the CDN cache the bytes (`s-maxage`) so repeated loads are
 * served without invoking the function.
 *
 * SSRF guard: only the Medium CDN host is allowed.
 */

const ALLOWED_HOSTS = new Set(["cdn-images-1.medium.com"]);
const CACHE = "public, max-age=86400, s-maxage=31536000, immutable";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const raw = Array.isArray(req.query.u) ? req.query.u[0] : req.query.u;
  if (!raw) return res.status(400).end();

  let target: URL;
  try {
    target = new URL(raw);
  } catch {
    return res.status(400).end();
  }

  if (target.protocol !== "https:" || !ALLOWED_HOSTS.has(target.hostname)) {
    return res.status(403).end();
  }

  try {
    const upstream = await fetch(target.toString(), {
      headers: { "User-Agent": "TheInkHome/1.0" },
    });
    if (!upstream.ok) return res.status(upstream.status).end();
    const buf = Buffer.from(await upstream.arrayBuffer());
    res.setHeader("Content-Type", upstream.headers.get("content-type") || "image/jpeg");
    res.setHeader("Cache-Control", CACHE);
    res.setHeader("Access-Control-Allow-Origin", "*");
    return res.status(200).send(buf);
  } catch {
    return res.status(502).end();
  }
}
