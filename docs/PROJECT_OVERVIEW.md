# The Ink Home — Project Overview

## Product

**The Ink Home** is an independent Medium publication turned into a React 19 + Vite 6 single-page
app. It publishes long-form essays about technology, culture, creativity, productivity,
relationships and mental health, and hosts a reading experience, an archive, a writers directory and
an AI assistant.

## Stack

| Concern | Choice |
| --- | --- |
| UI framework | React 19 + Vite 6 |
| Styling | Tailwind CSS v4 (`@tailwindcss/vite`) |
| 3D | React Three Fiber + drei + three (lazy-loaded) |
| Motion | `motion` (framer-motion) |
| Content CMS | Medium RSS feeds |
| AI | Groq (`openai/gpt-oss-20b`), OpenAI-compatible chat completions |
| API runtime | Express (`server.ts`) locally, Vercel serverless (`api/*.ts`) in production |
| Validation | Zod |
| Sanitization | isomorphic-dompurify |
| Rate limiting / security headers | helmet, express-rate-limit |

## Repository layout

```
api/                     Vercel serverless functions (native ESM)
  ai.ts                  Ink Assistant endpoint
  about.ts               Publication about endpoint
  health.ts              Liveness endpoint
  stories.ts             Publication stories endpoint
server.ts                Express server (local dev + self-host)
src/
  App.tsx                Router / landing composition
  components/           Live components only
  pages/                 Stories / Writers / About pages
  lib/                  api-server, ai, ai-server, knowledge, validation, format (+ tests)
  data/                 fallbackAbout
  types.ts
docs/                   This documentation set
```

## Current behaviour

- **Stories** are fetched from `https://medium.com/feed/the-ink-home`, with tag feeds and an
  rss2json fallback, normalized into the internal `Story` shape and capped at 50 entries.
- **About** data comes from `/api/about` with a small fallback payload.
- **Ink Assistant** is server-side prompt driven; the client sends conversation history plus a small
  page/story context object.
- Static assets, fonts and the SPA fallback are served by Vite in dev and by Express in production
  (when built).

## Source of truth

- Story data: Medium RSS (primary) → rss2json (fallback) → tag feeds (secondary aggregation) →
  in-memory/disk cache → bundled last-known-good snapshot (`src/data/fallbackStories.ts`),
  refreshed via `npm run sync:snapshot`.
- Publication facts: `src/lib/knowledge.ts` (server-side Ink Assistant knowledge base).

## Deployment modes

1. **Vercel** — `api/*.ts` serverless functions + static build from `dist`.
2. **Self-hosted** — built `dist/` served by the Express server with SPA fallback and SEO handlers.
