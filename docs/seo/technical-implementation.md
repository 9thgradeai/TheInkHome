# Technical SEO Implementation

## Rendering
SPA with server-resolved metadata. Express (dev) / Vercel (prod) injects title, description, OG, Twitter, canonical, robots, and JSON-LD into index.html per route. Client keeps head in sync via src/lib/seo.ts.

## Canonical policy
- Self-referencing canonicals per route.
- Story URLs: https://theinkhome.live/story/{slug}
- No canonical chains. Trailing slash: none (paths used as-is).

## Sitemap
- /sitemap.xml (api/sitemap.ts + Express). Includes static routes + live story slugs. Cache 1h.

## Robots
- public/robots.txt: Allow /, Disallow /api/, Sitemap reference.

## Structured data
- Organization (index.html)
- WebSite (homepage, added)
- Article (story pages)
- BreadcrumbList (story pages, added)

## Metadata system
- src/lib/seo.ts applyPageMeta / applyHomeMeta.
- server.ts serveSPAWithSEO for first paint.

## Internal linking
- Story → author (/writer/{slug}), Story → archive (/stories), related stories, categories filter, writers.

## Performance
- Code splitting, lazy routes, font preloads, image lazy loading, reduced-motion respect.

## llms.txt
- public/llms.txt provides concise machine-readable overview.
