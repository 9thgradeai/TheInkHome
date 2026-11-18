import { describe, expect, it } from "vitest";
import { formatDate, hashString, initials, readingTime, stripHtml, topCategories } from "./format";
import { Story } from "../types";

const story = (overrides: Partial<Story>): Story => ({
  title: "A story",
  link: "https://medium.com/the-ink-home/a-story",
  author: "Test Author",
  role: "Contributor",
  pubDate: "2026-10-01T10:00:00Z",
  categories: ["Essays", "Mental Health"],
  description: "A <em>short</em> description",
  content: "",
  cover: "",
  slug: "a-story",
  avatar: "",
  ...overrides,
});

describe("formatDate", () => {
  it("formats long dates", () => {
    expect(formatDate("2026-10-01T10:00:00Z")).toContain("October");
  });

  it("returns an empty string for invalid dates", () => {
    expect(formatDate("not-a-date")).toBe("");
  });
});

describe("readingTime", () => {
  it("estimates words per minute", () => {
    expect(readingTime(story({ content: "one two three four five six seven eight nine ten" }))).toBeGreaterThan(0);
  });
});

describe("initials", () => {
  it("combines the first and last name initials", () => {
    expect(initials("Farhan Kabir")).toBe("FK");
    expect(initials("Madonna")).toBe("MA");
  });
});

describe("hashString", () => {
  it("returns a numeric hash", () => {
    expect(typeof hashString("ink")).toBe("number");
  });
});

describe("stripHtml", () => {
  it("removes markup and collapses whitespace", () => {
    expect(stripHtml("<p>Hello <em>world</em> from Medium</p>")).toBe("Hello world from Medium");
  });
});

describe("topCategories", () => {
  it("counts and sorts categories", () => {
    const result = topCategories(
      [
        story({ categories: ["Essays"] }),
        story({ categories: ["Essays", "Technology"] }),
        story({ categories: ["Technology"] }),
      ],
      10,
    );
    expect(result[0]).toBe("Essays");
    expect(result).toContain("Technology");
  });
});
