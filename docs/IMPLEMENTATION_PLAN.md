# Implementation Plan — The Ink Home

Status legend: `pending` · `in_progress` · `completed` · `blocked`

## Phase 1 — Discovery and audit (completed)

- Audited frontend components, pages, data libraries and API layer.
- Confirmed the Vercel ESM runtime blocker (`ERR_MODULE_NOT_FOUND` for extension-less imports) and the
  type-only import blocker (`SyntaxError: does not provide an export named 'Story'`).
- Confirmed `@types/react` / `@types/react-dom` were missing, so `tsc --noEmit` previously validated
  almost nothing for React code.
- Audited design system: dead components, accent usage, colour count, missing `@theme` tokens.

## Phase 2 — Server-side story pipeline (completed)

- Rewrote `src/lib/api-server.ts` with a real Medium RSS pipeline, rss2json fallback, tag-feed
  aggregation, in-memory TTL cache, request de-duplication and a test hook.
- Rewrote `api/stories.ts` and `api/about.ts` to use it with explicit `.ts` import extensions.
- Added `src/lib/knowledge.ts`, `src/lib/validation.ts`, `src/lib/ai-server.ts`.
- Rewrote `api/ai.ts` to delegate to the shared backend.

## Phase 3 — Local development server (completed)

- Refactored `server.ts` onto the shared story + AI backends.
- Made Redis dependency optional/unnecessary; removed dead avatar waterfall and tag-fetch duplication.
- Added disk cache snapshot (`.cache/publication.json`) and periodic resync.

## Phase 4 — Live-site correctness fixes (completed)

- Wired tag-feed aggregation into the feed loader; verified a live run returned 42 real stories.
- Confirmed `/api/stories`, `/api/about`, `/api/ai`, `/api/health` all load and respond correctly under
  native ESM (the Vercel execution model).

## Phase 5 — Frontend correctness fixes (completed)

- Removed dead `Hero` and fabricated `FALLBACK_STORIES` fallback content.
- Removed dead code paths and fake interactions (likes, newsletter form, share URL).
- Fixed assistant quick-question flow (stale state) and moved system prompt + KB server-side.
- Removed duplicate page headers; added loading skeletons and error/retry states.

## Phase 6 — Delivery hygiene (completed)

- Added `@types/react`, `@types/react-dom`; `npm run lint` (`tsc --noEmit`) is clean.
- Added real unit tests (`src/lib/api-server.test.ts`, `src/lib/format.test.ts`) — 15 passing.
- Added security headers to `vercel.json` and CSP to the Express server.
- Removed dead API functions (`api/test*.ts`, `api/echo.ts`, `api/validation-test.ts`, `api/track.ts`).

## Phase 7 — Documentation (pending)

- Produce the remaining documents listed in `/docs`.

## Known blockers

- No `VERCEL_TOKEN` and no `vercel` CLI installed in this environment, so production deploy and
  production smoke tests could not be executed.
- No `GROQ_API_KEY` in the local environment, so the AI assistant currently answers `503` until a key
  is configured.
