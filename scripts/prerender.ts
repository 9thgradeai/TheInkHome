import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { FALLBACK_STORIES } from "../src/data/fallbackStories.ts";

const DIST_DIR = path.resolve(process.cwd(), "dist");

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function slugFromStory(story: (typeof FALLBACK_STORIES)[number]): string {
  const fromLink = (story.link || "").split("/").pop()?.split("?")[0];
  const base = fromLink || story.slug;
  return base
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function renderStoryPage(story: (typeof FALLBACK_STORIES)[number]): string {
  const title = `${story.title} — The Ink Home`;
  const description = (story.description || "A story from The Ink Home.").replace(/\s+/g, " ").trim().slice(0, 160);
  const url = `https://theinkhome.live/story/${slugFromStory(story)}`;
  const image = story.cover || "https://theinkhome.live/assets/The_Ink_Home.webp";

  const html = readFileSync(path.join(DIST_DIR, "index.html"), "utf8");
  let out = html
    .replace(/<title>[\s\S]*?<\/title>/i, `<title>${escapeHtml(title)}</title>`)
    .replace(/<meta name="description" content="[^"]*" \/>/, `<meta name="description" content="${escapeHtml(description)}" />`)
    .replace(
      /<meta property="og:title" content="[^"]*" \/>/,
      `<meta property="og:title" content="${escapeHtml(title)}" />`,
    )
    .replace(
      /<meta property="og:description" content="[^"]*" \/>/,
      `<meta property="og:description" content="${escapeHtml(description)}" />`,
    )
    .replace(
      /<meta property="og:url" content="[^"]*" \/>/,
      `<meta property="og:url" content="${escapeHtml(url)}" />`,
    )
    .replace(
      /<meta property="og:type" content="[^"]*" \/>/,
      `<meta property="og:type" content="article" />`,
    )
    .replace(
      /<meta name="twitter:title" content="[^"]*" \/>/,
      `<meta name="twitter:title" content="${escapeHtml(title)}" />`,
    )
    .replace(
      /<meta name="twitter:description" content="[^"]*" \/>/,
      `<meta name="twitter:description" content="${escapeHtml(description)}" />`,
    )
    .replace(
      /<meta property="article:published_time" content="[^"]*" \/>/,
      `<meta property="article:published_time" content="${escapeHtml(new Date(story.pubDate).toUTCString())}" />`,
    )
    .replace(
      /<meta name="author" content="[^"]*" \/>/,
      `<meta name="author" content="${escapeHtml(story.author)}" />`,
    );

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: story.title,
    description,
    url,
    image,
    datePublished: new Date(story.pubDate).toISOString(),
    author: { "@type": "Person", name: story.author },
    publisher: { "@type": "Organization", name: "The Ink Home", url: "https://theinkhome.live" },
  };
  out = out.replace(
    /<script type="application\/ld\+json">[\s\S]*?<\/script>/,
    `<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>`,
  );

  return out;
}

async function main(): Promise<void> {
  const stories = FALLBACK_STORIES.slice(0, 10);
  for (const story of stories) {
    const slug = slugFromStory(story);
    const dir = path.join(DIST_DIR, "story", slug);
    mkdirSync(dir, { recursive: true });
    writeFileSync(path.join(dir, "index.html"), renderStoryPage(story), "utf8");
  }
  console.log(`Prerendered ${stories.length} story pages into dist/story`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
