/**
 * Rewrite image URLs to a smaller, compressed variant so cards and articles
 * don't fetch full-resolution originals. Applies to the two CDNs the feed uses:
 * Medium (`cdn-images-1.medium.com`) and Unsplash.
 */
export function optimizeImageUrl(url: string, maxWidth = 720): string {
  if (!url) return url;

  // Medium CDN: downscale AND proxy through our origin (removes third-party
  // cookies and lets the CDN edge-cache the bytes). See api/img.ts.
  if (url.includes("cdn-images-1.medium.com")) {
    const resized = url
      .replace(/\/max\/\d+\//, `/max/${maxWidth}/`)
      .replace(/\/resize:fit:\d+/, `/resize:fit:${maxWidth}`);
    return `/api/img?u=${encodeURIComponent(resized)}`;
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
    .replace(/<img\s/g, '<img loading="lazy" decoding="async" ')
    .replace(/(<img[^>]+src=")([^"]+cdn-images-1\.medium\.com[^"]+)/g, (_m, pre, src) => {
      const optimized = src
        .replace(/\/max\/\d+\//, `/max/${maxWidth}/`)
        .replace(/\/resize:fit:\d+/, `/resize:fit:${maxWidth}`);
      return `${pre}/api/img?u=${encodeURIComponent(optimized)}`;
    });
}
