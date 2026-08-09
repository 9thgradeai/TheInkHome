import { useEffect } from "react";

interface SeoDescriptor {
  title: string;
  description?: string;
  type?: "website" | "article";
  image?: string;
  url?: string;
}

const SITE_NAME = "The Ink Home";
const DEFAULT_DESC =
  "Where Words Feel at Home — a spatial, cyber-philosophical digital literary publication exploring code, architecture, and the spaces between.";
const DEFAULT_IMG = "/assets/The_Ink_Home.webp";

function upsertMeta(attr: "name" | "property", key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  if (el.getAttribute("content") !== content) el.setAttribute("content", content);
}

function upsertLink(rel: string, href: string) {
  let el = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", rel);
    document.head.appendChild(el);
  }
  if (el.getAttribute("href") !== href) el.setAttribute("href", href);
}

function upsertJsonLd(id: string, obj: object) {
  let el = document.getElementById(id) as HTMLScriptElement | null;
  if (!el) {
    el = document.createElement("script");
    el.type = "application/ld+json";
    el.id = id;
    document.head.appendChild(el);
  }
  el.textContent = JSON.stringify(obj);
}

/**
 * Imperatively keep <head> in sync with the current route/story so every page and
 * article is crawlable and shares rich previews (OG + Twitter + JSON-LD).
 */
export function useSeo(d: SeoDescriptor | null) {
  useEffect(() => {
    if (!d) return;
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const title = d.title.includes(SITE_NAME) ? d.title : `${d.title} | ${SITE_NAME}`;
    const description = d.description || DEFAULT_DESC;
    const image = d.image?.startsWith("http") ? d.image : `${origin}${d.image || DEFAULT_IMG}`;
    const url = d.url || `${origin}/`;

    document.title = title;
    upsertMeta("name", "description", description);
    upsertMeta("property", "og:title", title);
    upsertMeta("property", "og:description", description);
    upsertMeta("property", "og:type", d.type || "website");
    upsertMeta("property", "og:url", url);
    upsertMeta("property", "og:image", image);
    upsertMeta("property", "og:site_name", SITE_NAME);
    upsertMeta("name", "twitter:card", "summary_large_image");
    upsertMeta("name", "twitter:title", title);
    upsertMeta("name", "twitter:description", description);
    upsertMeta("name", "twitter:image", image);
    upsertLink("canonical", url);

    // Remove any stale article schema before writing a non-article page.
    if (d.type !== "article") {
      document.getElementById("seo-article-jsonld")?.remove();
      return;
    }
    upsertJsonLd("seo-article-jsonld", {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: d.title,
      description,
      image,
      url,
      publisher: {
        "@type": "Organization",
        name: SITE_NAME,
        logo: { "@type": "ImageObject", url: `${origin}${DEFAULT_IMG}` },
      },
    });
  }, [d]);
}
