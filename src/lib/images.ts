/**
 * Rewrite image URLs to a smaller, compressed variant so cards and articles
 * don't fetch full-resolution originals. Applies to the two CDNs the feed uses:
 * Medium (`cdn-images-1.medium.com`) and Unsplash.
 */
export function optimizeImageUrl(url: string, maxWidth = 720): string {
  if (!url) return url;

  // Medium CDN: /max/2600/1*....jpeg or /resize:fit:1024/1*....
  if (url.includes("cdn-images-1.medium.com")) {
    const resized = url
      .replace(/\/max\/\d+\//, `/max/${maxWidth}/`)
      .replace(/\/resize:fit:\d+/, `/resize:fit:${maxWidth}`);
    return resized;
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
      return `${pre}${optimized}`;
    });
}
