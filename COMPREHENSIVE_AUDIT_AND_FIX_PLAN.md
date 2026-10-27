# COMPREHENSIVE AUDIT & PRODUCTION-GRADE FIX PLAN
**Project:** The Ink Home  
**Date:** 2026-10-27  
**Scope:** UI/UX, Frontend, Backend, AI Integration, Security, Performance, Deployment

---

## 1. CRITICAL SECURITY ISSUES (P0 - Must Fix Immediately)

| Issue | Location | Severity | Details | Production-Grade Fix |
|---|---|---|---|---|
| **Exposed API Key** | `.env` line 5 | CRITICAL | Groq API key `gsk_...` is committed to repo. | Rotate the key IMMEDIATELY. Remove from git history (`git filter-repo` or `BFG`). Add `.env` to gitignore (already there but file was committed). Use Vercel env vars only. Never commit secrets. |
| **Exposed secrets in VCS** | `.git` history | CRITICAL | The key is in git history. | Rotate key regardless of removal. Consider all keys as compromised. |
| **Overly permissive CORS/Proxy usage** | `server.ts:98-125` | HIGH | Uses `corsfix.com` and other third-party proxies to fetch RSS. Can leak URLs/requests. | Self-host proxy or use server-side fetching without third-party proxies. Add allowlists, rate limiting. |
| **No input validation/sanitization on AI endpoint** | `api/ai.ts`, `server.ts:640-709` | HIGH | Minimal validation; system prompt concatenation could be abused. | Strict schema validation (zod), prompt injection mitigation, input length limits, content filtering. |
| **Helmet disabled CSP** | `server.ts:637-642` | HIGH | `contentSecurityPolicy: false` | Enable strict CSP with nonces/hashes. Configure properly for fonts, images, scripts. |
| **No CSRF protection** | All POST endpoints | MEDIUM-HIGH | POST /api/track, /api/ai have no CSRF tokens. | For server-rendered forms add CSRF; for SPA API calls use SameSite cookies or custom headers + CORS allowlist. |
| **Rate limiting bypassable** | `server.ts:655-660` | MEDIUM | In-memory rate limiting won't scale across serverless/Vercel instances. | Use Redis/Upstash (already a dep) or Vercel's built-in rate limiting. |
| **Telemetry logs sensitive data** | `api/track.ts:23`, `server.ts:733` | MEDIUM | Logs full payload to console. | Sanitize logs, use structured logging, avoid PII. Never log request bodies in production. |
| **Error boundary leaks stack traces** | `src/main.tsx:33-66` | MEDIUM | Shows full error/stack to users in dev-like UI. | Only show in development; in prod show generic error + error ID for support. |
| **RSS parsing without limits** | `src/lib/api-server.ts`, `server.ts` | MEDIUM | No size limits on XML responses could cause OOM. | Stream parsing, size limits (content-length/max body), timeouts. |

---

## 2. BACKEND ISSUES (P0-P1)

| Issue | Location | Severity | Details | Production-Grade Fix |
|---|---|---|---|---|
| **Duplicate/fragile API implementations** | `api/*.ts` vs `server.ts` | HIGH | Both Express server and Vercel serverless functions exist with different logic (AI endpoint differs). | Single source of truth. Consolidate - either use serverless functions OR Express; avoid duplication. In prod Vercel uses `/api/*` functions. |
| **In-memory cache only** | `server.ts:48-59, 317-412` | HIGH | Cache resets on every serverless cold start. No persistence strategy across instances. | Use Upstash Redis (dep exists), Vercel KV, or filesystem cache only for dev. Add cache warming. |
| **Blocking I/O in sync** | `server.ts:248-412` | MEDIUM-HIGH | Sync does many sequential fetches with concurrency but can block. | Make non-blocking, use background jobs (QStash), add circuit breakers. |
| **No health check depth** | `api/health.ts`, `server.ts:714-722` | MEDIUM | Minimal health checks. | Add checks for RSS reachability, AI config, cache freshness, dependencies. |
| **Missing error handling in sync** | `server.ts:350-412` | MEDIUM | Falls back to defaults silently. | Log with context, alerting, metrics. Add retry with exponential backoff. |
| **Hardcoded values** | Throughout | MEDIUM | Many URLs, timeouts hardcoded. | Environment variables for all external services. |
| **Type safety gaps** | Many `any` types | MEDIUM | Heavy use of `any` in server.ts, api files. | Strict TypeScript, proper interfaces. |
| **Avatar resolution complexity** | `server.ts:412-603` | MEDIUM | 4-tier waterfall with many external calls, can timeout. | Cache aggressively, simplify to 1-2 reliable sources, add timeouts per tier. |
| **No request ID/tracing** | All endpoints | MEDIUM | Hard to debug in production. | Add correlation IDs, structured logging (pino/winston). |
| **Missing compression/caching headers consistency** | Mixed | LOW-MEDIUM | Some endpoints set headers differently. | Centralize middleware for headers/caching. |

---

## 3. FRONTEND/UI/UX ISSUES (P0-P1)

| Issue | Location | Severity | Details | Production-Grade Fix |
|---|---|---|---|---|
| **No proper loading states** | Various components | HIGH | Some places lack skeletons; errors not user-friendly. | Consistent skeleton screens, error boundaries per route, retry mechanisms. |
| **Accessibility gaps** | Throughout | HIGH | Missing ARIA labels in places, keyboard nav issues possible, focus management in modals. | WCAG 2.1 AA compliance: proper ARIA, focus trap in modals, keyboard navigation, skip links (partially present), screen reader testing. |
| **Mobile UX issues** | `Carousel3D.tsx`, modals | HIGH | Complex 3D carousel may have performance issues on low-end devices; touch handling could be better. | Simplify animations on mobile, respect `prefers-reduced-motion` (partially done), add proper touch targets (44px). |
| **Performance - large bundle** | `vite.config.ts`, deps | HIGH | Three.js, motion, etc. are heavy. Three is marked external but still imported? | Code splitting, lazy load heavy components (Carousel3D, Three scenes), tree shaking. Check if Three actually used. |
| **Layout shifts** | Images without dimensions | MEDIUM-HIGH | Many images lack explicit width/height causing CLS. | Add aspect ratios, use width/height attrs, CSS aspect-ratio. |
| **No image optimization** | Throughout | MEDIUM-HIGH | Direct Unsplash URLs, no srcset, no lazy loading strategy. | Use responsive images, WebP/AVIF, CDN optimization, proper loading attrs. |
| **Theme switching** | `App.tsx`, atmosphere system | MEDIUM | Atmosphere stored? Check localStorage - not visible. May not persist. | Persist theme preference, add system preference detection. |
| **Inconsistent routing** | `App.tsx` custom router | MEDIUM | Custom history-based routing instead of React Router. Works but missing features. | Consider React Router for better code-splitting, nested routes, loaders. Or improve current router. |
| **Form validation missing** | AI assistant, etc. | MEDIUM | Minimal validation. | Proper client-side validation with error messages. |
| **Color contrast** | Some text colors | MEDIUM | Some `text-white/30`, `text-white/40` may fail contrast. | Check contrast ratios, ensure AA compliance. |
| **No offline support** | PWA files exist (`sw.js`, `manifest.json`) but service worker removed per README? | MEDIUM | README says "No Service Worker: Removed for Vercel to avoid stale-cache issues" but files exist in dist. | Either implement proper SW or remove files. Inconsistent state. |
| **Animations heavy** | Framer Motion everywhere | MEDIUM | Can cause jank on low-end devices. | Use CSS animations where possible, respect reduced motion, use `will-change` carefully. |

---

## 4. AI INTEGRATION ISSUES (P0-P1)

| Issue | Location | Severity | Details | Production-Grade Fix |
|---|---|---|---|---|
| **Duplicate AI implementations** | `api/ai.ts` vs `server.ts:640-709` | HIGH | Different system prompts, different error handling, different models/config. | Single implementation. |
| **Hardcoded model** | Both places use `openai/gpt-oss-20b` | MEDIUM | Hardcoded, not configurable. | Environment variable for model selection. |
| **Weak system prompt** | Both implementations | MEDIUM | Minimal prompt, no guardrails. | Comprehensive system prompt with guardrails, jailbreak prevention, rate limiting per user. |
| **No conversation history limits** | `AIAssistant.tsx` | MEDIUM | Sends full message history each time, can grow unbounded. | Limit to last N messages, truncate long conversations. |
| **No streaming** | Both endpoints | MEDIUM | Non-streaming responses feel slower. | Implement streaming for better UX (SSE). |
| **API key exposure risk** | Frontend calls `/api/ai` (good) but key in env needs rotation | CRITICAL | Key was exposed in `.env` in repo. | Rotate key NOW. |
| **No usage tracking/cost controls** | None | HIGH | No tracking of tokens/costs, can be abused. | Add usage metering, per-IP/user limits, cost caps. |
| **Error messages leak info** | `api/ai.ts:108-141` | LOW-MEDIUM | Some errors may leak details. | Generic error messages to users, detailed logs server-side. |
| **No fallback model** | None | MEDIUM | If primary fails, no fallback. | Multiple provider fallback (Groq -> OpenRouter -> etc.). |

---

## 5. DATA & CONTENT ISSUES (P1)

| Issue | Location | Severity | Details | Production-Grade Fix |
|---|---|---|---|---|
| **Hardcoded author data duplication** | Multiple files (`api/about.ts`, `src/lib/api-server.ts`, `src/data/fallbackAbout.ts`) | MEDIUM | Same data in 3 places. | Single source of truth (maybe CMS or single file). |
| **Fallback stories are placeholders** | `src/data/fallbackStories.ts` | LOW | 30 generated placeholders with picsum images. | Replace with real curated stories or better placeholders. |
| **Mixed avatar sources** | Throughout | MEDIUM | Mix of Unsplash, Medium URLs, pravatar. Inconsistent. | Standardize, optimize, use own CDN or proper hosting. |
| **No content validation** | RSS parsing | MEDIUM | Trusts external content. | Sanitize all HTML (DOMPurify used in places - good), validate structure. |
| **Stale cache issues** | `App.tsx:997-1040` | MEDIUM | Client-side caching logic complex. | Simplify, add versioning, proper invalidation. |

---

## 6. DEPENDENCIES & BUILD ISSUES (P1)

| Issue | Location | Severity | Details | Production-Grade Fix |
|---|---|---|---|---|
| **Unused dependencies** | `package.json` | MEDIUM | `@google/genai`, `@upstash/redis`, `three`, `gh-pages` may not be fully used or needed. | Audit and remove unused deps to reduce bundle size. |
| **Vite config externals** | `vite.config.ts:28-35` | MEDIUM | Externals include things that might be needed client-side. | Review externals - `three` is external but imported? Check usage. |
| **TypeScript strictness** | `tsconfig.json` | MEDIUM | No strict mode enabled. | Enable `strict: true` for better type safety. |
| **Missing dev dependencies** | None obvious | LOW | Could benefit from eslint, prettier. | Add linting/formatting for code quality. |
| **Node version pinning** | `package.json:8-10` | LOW | Specifies Node 24.x - good. | Ensure CI/CD matches. |

---

## 7. DEPLOYMENT & CONFIG ISSUES (P1)

| Issue | Location | Severity | Details | Production-Grade Fix |
|---|---|---|---|---|
| **Vercel config routing** | `vercel.json` | MEDIUM | Routes serve from `/dist/` for assets but build outputs to `dist/` - correct. Has SW routes but SW removed. | Clean up unused routes. |
| **CNAME present** | `dist/CNAME` | LOW | Custom domain configured. | Fine if intentional. |
| **404.html in dist** | `dist/404.html` | LOW | Present. | Good for SPA fallback. |
| **Environment variables** | Multiple places check for keys | HIGH | Need to ensure all required env vars set in Vercel. | Document all env vars, add validation on startup. |
| **Build process** | `package.json` | LOW | Build works. | Add build validation, checks. |

---

## PRIORITIZED ACTION PLAN

### PHASE 0: EMERGENCY SECURITY (Do NOW - < 1 hour)
1. **Rotate Groq API key** - Go to Groq console, revoke old key, generate new one. Update in Vercel env vars.
2. **Remove .env from git tracking** - `git rm --cached .env` (already in .gitignore but tracked). Commit.
3. **Purge secrets from git history** - Use `git filter-repo` or BFG Repo-Cleaner to remove .env from all history.
4. **Audit for other secrets** - Scan codebase for hardcoded keys.
5. **Force push cleaned history** - Coordinate with team if any.

### PHASE 1: CRITICAL FIXES (1-2 days)
1. **Consolidate AI endpoints** - Make single source of truth, remove duplication.
2. **Enable CSP properly** - Configure Helmet CSP with safe directives.
3. **Add input validation** - Use Zod for all API inputs.
4. **Fix error boundaries** - Don't leak stack traces in production.
5. **Secure logging** - Remove/sanitize sensitive logs.
6. **Add proper rate limiting** - Consider Redis-backed for serverless.

### PHASE 2: HIGH PRIORITY (2-4 days)
1. **Performance optimization** - Code splitting, lazy loading, image optimization.
2. **Accessibility improvements** - Focus traps, ARIA, keyboard nav, contrast fixes.
3. **Error handling** - Better user-facing errors, retry logic.
4. **Type safety** - Enable strict TypeScript, fix `any` types.
5. **Consolidate duplicate code** - Merge fallback data, API logic.
6. **Mobile UX** - Optimize carousel for mobile, touch improvements.

### PHASE 3: MEDIUM PRIORITY (4-7 days)
1. **Add monitoring/logging** - Structured logging, error tracking (Sentry).
2. **Testing** - Add unit/integration tests (Vitest configured but no tests).
3. **PWA cleanup** - Either implement proper SW or remove files.
4. **Documentation** - Update README with security notes, env vars.
5. **Bundle analysis** - Optimize chunks.
6. **SEO improvements** - Add meta tags, structured data.

---

## QUICK WINS
- Add `rel="noopener noreferrer"` to all external links (check - ReadingPage does it)
- Add width/height to images
- Enable strict TypeScript
- Remove console.logs from production builds
- Add loading states everywhere
- Improve focus styles
- Add aria-labels where missing
