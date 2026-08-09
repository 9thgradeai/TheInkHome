import type { VercelRequest, VercelResponse } from "@vercel/node";

/**
 * Best-effort likes/saves sync.
 *
 * NOTE ON CROSS-DEVICE: this currently persists per-visitor to an HTTP-only
 * cookie (no external datastore required, survives serverless cold starts and
 * page reloads). It is NOT truly cross-device — a reader on a new device gets a
 * fresh cookie. To make it genuinely cross-device, replace the cookie store
 * below with a durable datastore keyed by a stable reader id (e.g. a Vercel
 * Marketplace DB / Upstash Redis) and drop the reader id in the POST body.
 */

const COOKIE = "ink_interactions";

interface Interactions {
  likes: string[];
  saves: string[];
}

function readStore(req: VercelRequest): Interactions {
  const raw = req.cookies?.[COOKIE];
  if (raw) {
    try {
      const p = JSON.parse(decodeURIComponent(raw));
      if (p && Array.isArray(p.likes) && Array.isArray(p.saves)) {
        return { likes: p.likes.map(String), saves: p.saves.map(String) };
      }
    } catch {
      // fall through to empty
    }
  }
  return { likes: [], saves: [] };
}

function writeStore(res: VercelResponse, data: Interactions) {
  const value = encodeURIComponent(JSON.stringify(data));
  res.setHeader("Set-Cookie", `${COOKIE}=${value}; Path=/; SameSite=Lax; Max-Age=31536000`);
}

function sanitize(arr: string[]): string[] {
  return [...new Set(arr.filter((s) => typeof s === "string" && s.length > 0))].slice(0, 500);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const store = readStore(req);

  if (req.method === "GET") {
    return res.status(200).json(store);
  }

  if (req.method === "POST") {
    let body: any = req.body;
    if (typeof body === "string") {
      try { body = JSON.parse(body); } catch { body = {}; }
    }
    const likes = sanitize(Array.isArray(body.likes) ? body.likes : store.likes);
    const saves = sanitize(Array.isArray(body.saves) ? body.saves : store.saves);
    const next: Interactions = { likes, saves };
    writeStore(res, next);
    return res.status(200).json(next);
  }

  return res.status(405).json({ error: "Method not allowed" });
}
