# The Ink Home — Operations

## Runtime

- Local / self-hosted: `npm run dev` → Express + Vite middleware on `PORT` (default 3000).
- Production (Vercel): `api/*.ts` functions; static assets from `dist`.

## Story sync

- Primary source: `https://medium.com/feed/the-ink-home`
- Fallbacks: tag feeds, rss2json, bundled real-story snapshot.
- Cache TTL: 10 minutes; stale-while-revalidate 600 seconds.
- Disk snapshot: `.cache/publication.json` (gitignored, self-hosted only).
- Bundled snapshot: `src/data/fallbackStories.ts` (committed). Refresh with `npm run sync:snapshot`.
  Served as `source: "snapshot"` only when every live source fails, so production is never empty.
- On serverless, tag-feed aggregation is awaited within a bounded budget so cold starts return the
  full archive; self-hosted enriches the cache in the background.
- Endpoint returns `{ source, stories }`; sources include `medium-rss`, `rss2json`, `snapshot`, and
  `*-stale` cache variants.

## Incident: `/api/stories` returning an empty archive

- Symptom: landing/archive pages show "We couldn't reach the publication" on the custom domain while
  `localhost` works.
- Root cause: `api/stories.ts` had been left as a debug stub returning `{ stories: [] }`. The Express
  dev server (`server.ts`) used the real pipeline, so only production was affected.
- Fix: restore the handler to call `getPublicationStories`, and add a committed snapshot fallback so
  a stub/outage can never blank the archive again. `src/lib/api-server.test.ts` asserts the fallback.

## Incident: `/api/stories` returning 500

## Incident: `/api/*` returning 500 `FUNCTION_INVOCATION_FAILED`

- Root cause: Vercel transpiles each function and its traced dependencies from `.ts` to `.js` but
  leaves relative import specifiers verbatim. Using `.ts` (or extensionless) specifiers therefore
  asks the Node ESM loader for a `.ts` file that does not exist at runtime → `ERR_MODULE_NOT_FOUND`
  → `FUNCTION_INVOCATION_FAILED`. Local `tsx`/Vite hide this because they resolve `.ts` directly.
- Fix: relative imports inside `api/*` and all server modules they reach (`src/lib/*`, `src/data/*`)
  must use the **emitted `.js` extension** (e.g. `import { x } from "./validation.js"`). Type-only
  imports use `import type { ... }` and are erased, so their extension is irrelevant.
- Guard: `npm run build` only bundles the frontend; always smoke-test the deployed `/api/stories`
  after a deploy (see `docs/TESTING.md`).

## Incident: AI assistant returning 503

- Root cause: `GROQ_API_KEY` not configured.
- Fix: configure the key; assistant is intentionally disabled otherwise.

## Rollback

- Static assets: redeploy previous build.
- Serverless functions: redeploy previous commit/tag.
- Local: revert commit and restart (`npm run dev`).

## Follow-ups

- Enable `strict` TypeScript mode.
- Add Playwright smoke tests for the SPA routes.
- Convert font binaries to WOFF2.
- Back AI rate limiting with a shared store in multi-instance deploys.
