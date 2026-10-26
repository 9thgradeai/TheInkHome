// Lightweight curated fallback stories used for instant client rendering when APIs are slow or unavailable.
import { Story } from "../types";

export const FALLBACK_STORIES: Story[] = [
  // 30 short curated placeholders to show instantly on static hosting
  ...Array.from({ length: 30 }).map((_, i) => {
    const num = i + 1;
    const title = [
      "The Spatial Medium",
      "Aesthesis and the Algorithmic Composer",
      "Liquid Typography",
      "Chronicles of a Shader",
      "The Quiet Network",
      "Synthetic Memoirs",
      "Memoirs of an Interface",
      "Post-Digital Gardens",
      "The Geometry of Sound",
      "Cartography of Attention",
      "The Silent Update",
      "Ink and Protocols",
      "The Ambient Compiler",
      "Fragments of a Feed",
      "The Archive of Moving Type",
      "Nocturne for Screens",
      "The Last Serif",
      "Anatomy of a Scroll",
      "Meta-Editorial Notes",
      "The Long-Form Machine",
      "Temporal Typography",
      "The Curated Drift",
      "Polygons of Meaning",
      "The Slow Render",
      "On Being Rendered",
      "The Interface Collector",
      "Letters from the Grid",
      "The Synchronous Essay",
      "Ephemeral Index",
      "The Ink Home Manifesto"
    ][i % 30] + ` — Vol ${String(num).padStart(3, "0")}`;

    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
      .slice(0, 64);

    return {
      title,
      link: `https://medium.com/the-ink-home/${slug}`,
      author: ["Elena Rostov", "Devon Vance", "Sophia Sterling", "Kai Mendoza"][i % 4],
      role: "Contributor",
      pubDate: new Date(Date.now() - i * 1000 * 60 * 60 * 24).toUTCString(),
      categories: [
        [
          "Writing",
          "Technology",
          "Culture",
          "Creativity",
          "Productivity",
          "Relationships",
          "Mental Health",
          "Life",
        ][i % 8],
      ],
      description: `Placeholder summary for ${title}. This is a curated fallback so the site shows rich content instantly while live fetches complete.`,
      content: "",
      cover: `https://picsum.photos/seed/theinkhome-${num}/800/500`,
      slug,
      avatar: `https://i.pravatar.cc/150?img=${(i % 70) + 1}`
    } as Story;
  })
];

export default FALLBACK_STORIES;
