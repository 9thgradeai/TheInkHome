import type { VercelRequest, VercelResponse } from '@vercel/node';
import { parseMediumRSS } from '../src/lib/api-server';

export default async function (_: VercelRequest, res: VercelResponse) {
  return res.json({ ok: true, parseMediumRSS: typeof parseMediumRSS });
}

export const maxDuration = 10;
