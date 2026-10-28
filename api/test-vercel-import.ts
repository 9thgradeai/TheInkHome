import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function (_: VercelRequest, res: VercelResponse) {
  return res.json({ ok: true });
}

export const maxDuration = 10;
