import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(_: VercelRequest, res: VercelResponse) {
  return res.json({ 
    groqKey: !!process.env.GROQ_API_KEY ? 'set' : 'missing',
    nodeVersion: process.version,
    envKeys: Object.keys(process.env).filter(k => !k.startsWith('_'))
  });
}

export const maxDuration = 10;
