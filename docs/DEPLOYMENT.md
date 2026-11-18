# The Ink Home — Deployment Guide

## Vercel

1. Build command: `npm run build` (Vite → `dist`).
2. Output directory: `dist`.
3. Functions: `api/*.ts`.

### vercel.json notes

- `version: 2`, functions map, catch-all rewrite to `/index.html`.

```json
{
  "version": 2,
  "functions": {
    "api/stories.ts": { "maxDuration": 60 },
    "api/about.ts": { "maxDuration": 30 },
    "api/ai.ts": { "maxDuration": 60 },
    "api/health.ts": { "maxDuration": 10 }
  },
  "routes": [
    { "src": "/api/(.*)", "dest": "/api/$1" },
    { "src": "/assets/(.*)", "dest": "/assets/$1" },
    { "src": "/fonts/(.*)", "dest": "/fonts/$1" },
    { "src": "/manifest.json", "dest": "/manifest.json" },
    { "src": "/(.*)", "dest": "/index.html" }
  ],
  "headers": [
    { "source": "/(.*)", "headers": [ ...security headers... ] },
    { "source": "/assets/(.*)", "headers": [ { "key": "Cache-Control", "value": "public, max-age=31536000, immutable" } ] },
    { "source": "/fonts/(.*)", "headers": [ { "key": "Cache-Control", "value": "public, max-age=31536000, immutable" } ] }
  ]
}
```

## Environment variables

| Variable | Required | Notes |
| --- | --- | --- |
| `GROQ_API_KEY` | Yes (for AI) | Groq API key; assistant returns `503` without it. |
| `AI_MODEL` | No | Defaults to `openai/gpt-oss-20b`. |
| `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` | Optional | No longer required by the current server. |

## Deploy

```bash
npm run deploy
# or
vercel --prod --token $VERCEL_TOKEN
```

## Self-host

```bash
npm run build
npm start
```

Serves `dist/` with SPA fallback, `/api/*` handlers, security headers and disk cache.

## Blockers in current environment

- `VERCEL_TOKEN` not set.
- `vercel` CLI not installed.
- `GROQ_API_KEY` not set.
