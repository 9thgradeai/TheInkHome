import type { VercelRequest, VercelResponse } from '@vercel/node';
import { AIRequestSchema } from '../src/lib/validation';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const validation = AIRequestSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: 'Invalid format', details: validation.error.format() });
    }
    return res.json({ ok: true, body: validation.data });
  } catch (e: any) {
    return res.status(500).json({ error: 'Import or schema error', message: e.message });
  }
}

export const maxDuration = 10;
