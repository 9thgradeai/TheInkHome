import type { VercelRequest, VercelResponse } from '@vercel/node';
import { DEFAULT_STORIES } from '../src/lib/api-server';

export default async function (_: VercelRequest, res: VercelResponse) {
  // Return a static copy of default stories
  const stories = DEFAULT_STORIES.map(s => ({ ...s }));
  res.setHeader('Cache-Control', 'public, max-age=300, stale-while-revalidate=600');
  return res.status(200).json({ source: 'static', stories });
}

export const maxDuration = 60;
