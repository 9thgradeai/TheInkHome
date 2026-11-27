# Baseline Audit — The Ink Home

## Executive summary
The Ink Home is a React SPA behind an Express/Vercel layer with server-resolved SEO metadata, a dynamic sitemap, robots.txt, canonical URLs, and JSON-LD. Content is sourced from the Medium RSS feed (max 60 stories) with in-memory + disk caching. There is no database or auth.

## Strengths
- Server-side metadata injection per route (serveSPAWithSEO).
- Dynamic sitemap from live archive.
- Prerendered story pages for crawlers.
- Clean, readable slugs.
- Author pages derived from bylines.
- Honest, no-fake-features UX.
- Accessible focus/aria/reduced-motion support.

## Confirmed weaknesses
- About page editorial data is static fallback (bios/followers); live story counts now derived.
- No automated SEO tests.
- No llms.txt (added).
- No breadcrumbs schema.
- No WebSite/SearchAction schema.
- Category/topic pages are not standalone routes (topics are filters on /stories).
- No content opportunity research data (qualitative only).
- No competitor analysis document (added as hypothesis-level).

## Unknowns
- Search Console / Bing data not available.
- Real indexing status unknown.
- Real Core Web Vitals not measured here.

## Prioritized opportunities
P0: sitemap validity, canonical consistency, noindex on 404, robots correctness — done.
P1: breadcrumbs schema, WebSite schema, automated SEO tests, llms.txt — implementing.
P2: standalone topic pages, content opportunity research, distribution docs — documented.
