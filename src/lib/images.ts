/**
 * Rewrite image URLs to a smaller, compressed variant so cards and articles
 * don't fetch full-resolution originals. Applies to the two CDNs the feed uses:
 * Medium (`cdn-images-1.medium.com`) and Unsplash.
 */
export function optimizeImageUrl(url: string, maxWidth = 720): string {
  if (!url) return url;

  // Medium CDN: downscale directly (no proxy — avoids 404/flicker in dev and when
  // server.ts has no /api/img handler). Vercel edge handles /api/img for cookie-less cache separately.
  if (url.includes("cdn-images-1.medium.com") || url.includes("miro.medium.com")) {
    return url
      .replace(/\/max\/\d+\//, `/max/${maxWidth}/`)
      .replace(/\/resize:fit:\d+/, `/resize:fit:${maxWidth}`);
  }

  // Unsplash: rewrite width + quality
  if (url.includes("images.unsplash.com")) {
    try {
      const u = new URL(url);
      u.searchParams.set("w", String(maxWidth));
      u.searchParams.set("q", "70");
      return u.toString();
    } catch {
      return url;
    }
  }

  // Picsum (fallback covers): downscale the fixed /W/H/ path variant.
  if (url.includes("picsum.photos")) {
    const h = Math.max(1, Math.round(maxWidth * 0.625));
    return url.replace(/\/\d+\/\d+\.jpg/, `/${maxWidth}/${h}.jpg`);
  }

  return url;
}

/**
 * Post-process sanitized article HTML: downscale Medium content images and make
 * every image lazy + async so offscreen figures don't cost payload or main thread.
 */
export function optimizeContentHtml(html: string, maxWidth = 720): string {
  return html
    .replace(/<img\s/g, '<img loading="lazy" decoding="async" referrerpolicy="no-referrer" ')
    .replace(/(<img[^>]+src=")([^"]+cdn-images-1\.medium\.com[^"]+)/g, (_m, pre, src) => {
      const optimized = src
        .replace(/\/max\/\d+\//, `/max/${maxWidth}/`)
        .replace(/\/resize:fit:\d+/, `/resize:fit:${maxWidth}`);
      return `${pre}${optimized}`;
    })
    .replace(/(<img[^>]+src=")([^"]+miro\.medium\.com[^"]+)/g, (_m, pre, src) => {
      const optimized = src.replace(/\/resize:fit:\d+/, `/resize:fit:${maxWidth}`);
      return `${pre}${optimized}`;
    });
}
