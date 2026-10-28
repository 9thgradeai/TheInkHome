import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function (_: VercelRequest, res: VercelResponse) {
  return res.status(200).json({ ok: true, msg: 'hello from stories' });
}

export const maxDuration = 10;
