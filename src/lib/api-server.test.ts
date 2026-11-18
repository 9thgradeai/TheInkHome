import { describe, expect, it } from "vitest";
import { MAX_STORIES, PUBLICATION_FEED, djb2Hash, parseMediumRSS, transformRSSItems } from "./api-server";

const SAMPLE_RSS = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>The Ink Home</title>
    <item>
      <title>Why quiet writing matters</title>
      <link>https://medium.com/the-ink-home/why-quiet-writing-matters-abc123</link>
      <dc:creator>Case Study Author</dc:creator>
      <pubDate>Thu, 01 Oct 2026 10:00:00 GMT</pubDate>
      <category>Essays</category>
      <category>Mental Health</category>
      <content:encoded><![CDATA[<p>Quiet writing matters because it slows the breath.</p>]]></content:encoded>
    </item>
    <item>
      <title>Another essay</title>
      <link>https://medium.com/the-ink-home/another-essay-def456</link>
      <creator>Second Author</creator>
      <pubDate>Fri, 02 Oct 2026 10:00:00 GMT</pubDate>
    </item>
  </channel>
</rss>`;

describe("parseMediumRSS", () => {
  it("reads publication metadata", () => {
    expect(PUBLICATION_FEED).toBe("https://medium.com/feed/the-ink-home");
  });

  it("parses titles, authors, dates and categories from items", () => {
    const stories = parseMediumRSS(SAMPLE_RSS);
    expect(stories).toHaveLength(2);

    const first = stories[0];
    expect(first.title).toBe("Why quiet writing matters");
    expect(first.author).toBe("Case Study Author");
    expect(first.link).toContain("why-quiet-writing-matters");
    expect(first.categories).toEqual(["Essays", "Mental Health"]);
    expect(first.pubDate).toBe("Thu, 01 Oct 2026 10:00:00 GMT");
  });

  it("derives a slug from the medium link", () => {
    const stories = parseMediumRSS(SAMPLE_RSS);
    expect(stories[0].slug).toBe("why-quiet-writing-matters-abc123");
  });

  it("falls back to a single editorial category when missing", () => {
    const stories = parseMediumRSS(SAMPLE_RSS);
    expect(stories[1].categories).toEqual(["Editorial"]);
  });
});

describe("transformRSSItems", () => {
  it("maps rss2json shaped payloads onto the Story contract", () => {
    const stories = transformRSSItems([
      {
        title: "Mapped Title",
        link: "https://medium.com/the-ink-home/mapped-title-aaa",
        author: "Mapped Author",
        content: "<p>Mapped body</p>",
      },
    ]);
    expect(stories).toHaveLength(1);
    expect(stories[0].title).toBe("Mapped Title");
    expect(stories[0].author).toBe("Mapped Author");
    expect(stories[0].categories).toEqual(["Editorial"]);
    expect(stories[0].description).toContain("Mapped body");
  });

  it("returns an empty list for non-array input", () => {
    expect(transformRSSItems(null)).toEqual([]);
  });
});

describe("djb2Hash", () => {
  it("is deterministic and stable", () => {
    expect(djb2Hash("abc")).toBe(djb2Hash("abc"));
    expect(djb2Hash("abc")).not.toBe(djb2Hash("abd"));
  });
});

describe("constants", () => {
  it("caps the archive at the planned slice size", () => {
    expect(MAX_STORIES).toBe(50);
  });
});
