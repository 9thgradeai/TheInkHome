# The Ink Home — SEO Engineering

Central overview of the publication's search, discovery, and AI-retrieval engineering.

## Product
The Ink Home (https://theinkhome.live) is an independent literary publication of essays, stories, and reflections, published on Medium and mirrored/curated on its own domain. Stack: React 19 + Vite 6 + Tailwind v4, Express (dev/prod), Vercel serverless functions, in-memory + disk publication cache from Medium RSS.

## Technical SEO surface
- `public/robots.txt` — allows crawling, disallows /api/, references sitemap.
- `/sitemap.xml` — dynamic, serverless (`api/sitemap.ts`) + Express route, includes static routes + live story slugs.
- Canonical URLs — server-resolved per route in `serveSPAWithSEO` (server.ts) and client `applyPageMeta` (src/lib/seo.ts).
- Metadata — title, description, OG, Twitter, canonical, robots, JSON-LD.
- Structured data — Organization (index.html), Article (story pages), WebSite (homepage).
- Prerendered story pages (scripts/prerender.ts) for crawlable HTML.
- Internal linking — story→author, story→archive, related stories, categories, writers.

## Content lanes
- Lane A: original literary content (core product).
- Lane B: writer resources (submission guidelines, editorial policy, The Desk).

## AI discoverability
- Crawlable HTML, consistent identity, author attribution, editorial policies, accurate metadata, internal links. `public/llms.txt` provides a concise machine-readable overview.

## Monitoring
See `monitoring.md`. Weekly lightweight review; monthly technical audit.

## Files
- baseline-audit.md
- technical-implementation.md
- content-opportunity-map.md
- competitor-analysis.md
- content-distribution.md
- monitoring.md
- 90-day-growth-plan.md
