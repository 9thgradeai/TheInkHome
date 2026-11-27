# Monitoring

## Weekly (lightweight)
- Check /sitemap.xml and /robots.txt availability.
- Review search visibility (Search Console when available).
- Identify one high-impact opportunity.
- Fix one meaningful issue.
- Improve one page/resource.
- Review technical alerts.

## Monthly
- Technical health audit.
- Content decay review.
- Search opportunity review.
- Competitor review.
- Backlink/reference review.
- Organic conversion analysis.
- Roadmap adjustment.

## Automated checks (CI)
- tsc --noEmit
- vitest (incl. seo tests)
- vite build
- sitemap validity test
- robots test
- canonical test

## External setup required
- Google Search Console verification
- Bing Webmaster Tools
- Analytics (GA4 or Plausible) — not yet wired

## Follower counts
Medium profile follower counts are sourced from src/data/fallbackAbout.ts (Farhan Kabir: 809, Dua Batool: 161). Medium blocks automated scraping (403), so these are manually refreshed. To automate, integrate an authorized Medium API or a scheduled human update. Story counts are fully dynamic from the live RSS feed.
