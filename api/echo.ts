import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function (_: VercelRequest, res: VercelResponse) {
  return res.text('ok');
}

export const maxDuration = 5;
