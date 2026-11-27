import { describe, expect, it } from "vitest";
import { buildSitemap } from "./sitemap";

describe("sitemap", () => {
  it("returns valid urlset xml", async () => {
    const xml = await buildSitemap();
    expect(xml).toContain('<?xml version="1.0"');
    expect(xml).toContain("<urlset");
    expect(xml).toContain("</urlset>");
  });

  it("contains no duplicate loc entries", async () => {
    const xml = await buildSitemap();
    const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
    expect(new Set(locs).size).toBe(locs.length);
  });

  it("references the canonical site url", async () => {
    const xml = await buildSitemap();
    expect(xml).toContain("https://theinkhome.live/");
  });
});

describe("robots", () => {
  it("references the sitemap", () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const fs = require("node:fs");
    const robots = fs.readFileSync("public/robots.txt", "utf8");
    expect(robots).toContain("Sitemap:");
    expect(robots).toContain("sitemap.xml");
    expect(robots).toContain("Disallow: /api/");
  });
});
