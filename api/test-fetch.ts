import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function (_: VercelRequest, res: VercelResponse) {
  try {
    const resp = await fetch('https://httpbin.org/ip');
    const txt = await resp.text();
    return res.json({ ok: true, body: txt.substring(0, 100) });
  } catch (e: any) {
    return res.json({ ok: false, error: e.message });
  }
}

export const maxDuration = 10;
