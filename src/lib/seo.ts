/**
 * Client-side head management.
 *
 * The Express server already injects correct meta tags for the first paint
 * (see `serveSPAWithSEO`); this module keeps the document head in step after
 * the client-side router moves, so shares and tab titles stay accurate.
 */

const SITE_NAME = "The Ink Home";
const SITE_URL = "https://theinkhome.live";
const DEFAULT_IMAGE = `${SITE_URL}/assets/og-image.jpg`;
const DEFAULT_DESCRIPTION =
  "An independent publication of essays on technology, culture, creativity, relationships and the quiet parts of being human.";

function ensureMeta(selector: string, attribute: "name" | "property", key: string): HTMLMetaElement | null {
  let node = document.head.querySelector<HTMLMetaElement>(selector);
  if (!node) {
    node = document.createElement("meta");
    node.setAttribute(attribute, key);
    document.head.appendChild(node);
  }
  return node;
}

function setText(selector: string, attribute: "name" | "property", key: string, value: string): void {
  ensureMeta(selector, attribute, key)?.setAttribute("content", value);
}

function setLink(rel: string, href: string): void {
  let node = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!node) {
    node = document.createElement("link");
    node.rel = rel;
    document.head.appendChild(node);
  }
  node.href = href;
}

function setJsonLd(id: string, data: unknown): void {
  let node = document.getElementById(id) as HTMLScriptElement | null;
  if (!node) {
    node = document.createElement("script");
    node.id = id;
    node.type = "application/ld+json";
    document.head.appendChild(node);
  }
  node.textContent = JSON.stringify(data);
}

function clearJsonLd(id: string): void {
  document.getElementById(id)?.remove();
}

export interface PageMeta {
  title: string;
  description: string;
  path: string;
  image?: string;
  type?: "website" | "article";
  article?: { publishedTime: string; author: string };
  robots?: string;
  jsonLd?: unknown;
}

export function applyPageMeta(meta: PageMeta): void {
  const fullTitle = meta.title.endsWith(SITE_NAME) ? meta.title : `${meta.title} | ${SITE_NAME}`;
  const url = `${SITE_URL}${meta.path}`;
  const image = meta.image || DEFAULT_IMAGE;
  const description = meta.description || DEFAULT_DESCRIPTION;

  document.title = fullTitle;

  setText('meta[name="description"]', "name", "description", description);
  setText('meta[property="og:title"]', "property", "og:title", fullTitle);
  setText('meta[property="og:description"]', "property", "og:description", description);
  setText('meta[property="og:url"]', "property", "og:url", url);
  setText('meta[property="og:image"]', "property", "og:image", image);
  setText('meta[property="og:type"]', "property", "og:type", meta.type || "website");
  setText('meta[property="og:site_name"]', "property", "og:site_name", SITE_NAME);

  setText('meta[name="twitter:card"]', "name", "twitter:card", "summary_large_image");
  setText('meta[name="twitter:title"]', "name", "twitter:title", fullTitle);
  setText('meta[name="twitter:description"]', "name", "twitter:description", description);
  setText('meta[name="twitter:image"]', "name", "twitter:image", image);

  if (meta.article) {
    setText('meta[name="author"]', "name", "author", meta.article.author);
    setText(
      'meta[property="article:published_time"]',
      "property",
      "article:published_time",
      meta.article.publishedTime,
    );
  }

  setText('meta[name="robots"]', "name", "robots", meta.robots || "index, follow");
  setLink("canonical", url);

  if (meta.jsonLd) setJsonLd("page-jsonld", meta.jsonLd);
  else clearJsonLd("page-jsonld");
}

export function applyHomeMeta(): void {
  applyPageMeta({
    title: `${SITE_NAME} — Where Words Feel at Home`,
    description:
      "An independent publication of thoughtful essays on technology, culture, creativity, relationships and the quiet parts of being human.",
    path: "/",
  });
}

export const SITE_META = {
  siteName: SITE_NAME,
  siteUrl: SITE_URL,
  defaultImage: DEFAULT_IMAGE,
  defaultDescription: DEFAULT_DESCRIPTION,
} as const;
