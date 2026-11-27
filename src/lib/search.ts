import type { Story } from "../types";
import { stripHtml } from "./format";

/**
 * Full-text search across the local corpus.
 *
 * The publication archive is fetched once and held in memory (see
 * `api-server.ts`), so searching it on the client is both instant and
 * genuinely complete — every field of every story is indexed here, not just
 * the title row. Scores favour titles and bylines over body copy, and ties
 * break on recency so the index never feels arbitrary.
 */

export interface SearchMatch {
  story: Story;
  score: number;
  /** Short excerpt around the first body hit, when the hit is in the body. */
  excerpt?: string;
}

export interface SearchOptions {
  category?: string;
  limit?: number;
}

const FIELD_WEIGHT = {
  title: 6,
  author: 4,
  categories: 3,
  description: 2,
  content: 1,
} as const;

const EXCERPT_RADIUS = 90;

function normalize(value: string): string {
  return stripHtml(value)
    .replace(/[’']/g, "'")
    .toLowerCase();
}

function tokenize(query: string): string[] {
  return normalize(query)
    .split(/[^a-z0-9']+/)
    .filter((token) => token.length > 0);
}

function countOccurrences(haystack: string, needle: string): number {
  if (!needle) return 0;
  let count = 0;
  let index = haystack.indexOf(needle);
  while (index !== -1 && count < 8) {
    count += 1;
    index = haystack.indexOf(needle, index + needle.length);
  }
  return count;
}

function buildExcerpt(body: string, needle: string): string | undefined {
  if (!needle) return undefined;
  const index = body.indexOf(needle);
  if (index === -1) return undefined;
  const start = Math.max(0, index - EXCERPT_RADIUS);
  const end = Math.min(body.length, index + needle.length + EXCERPT_RADIUS);
  const prefix = start > 0 ? "…" : "";
  const suffix = end < body.length ? "…" : "";
  return `${prefix}${body.slice(start, end).trim()}${suffix}`;
}

/** Searches a corpus. An empty query returns the corpus ordered by date. */
export function searchStories(
  stories: Story[],
  query: string,
  options: SearchOptions = {},
): SearchMatch[] {
  const { category, limit } = options;

  const byCategory =
    !category || category === "All"
      ? stories
      : stories.filter((story) => (story.categories || []).includes(category));

  const tokens = tokenize(query);
  if (tokens.length === 0) {
    return byCategory
      .slice()
      .sort((a, b) => Date.parse(b.pubDate) - Date.parse(a.pubDate))
      .slice(0, limit ?? byCategory.length)
      .map((story) => ({ story, score: 0 }));
  }

  const matches: SearchMatch[] = [];

  for (const story of byCategory) {
    const fields = {
      title: normalize(story.title),
      author: normalize(story.author),
      categories: normalize((story.categories || []).join(" ")),
      description: normalize(story.description),
      content: normalize(story.content),
    };

    let score = 0;
    let matchedEveryToken = true;
    let firstBodyHit: string | undefined;

    for (const token of tokens) {
      let tokenScore = 0;
      for (const field of Object.keys(fields) as (keyof typeof fields)[]) {
        const hits = countOccurrences(fields[field], token);
        if (hits > 0) tokenScore += FIELD_WEIGHT[field] * (hits > 1 ? 1.5 : 1);
      }
      if (tokenScore === 0) {
        matchedEveryToken = false;
        break;
      }
      score += tokenScore;
      if (!firstBodyHit && fields.content.includes(token)) {
        firstBodyHit = token;
      }
    }

    if (!matchedEveryToken) continue;

    matches.push({
      story,
      score,
      excerpt: firstBodyHit ? buildExcerpt(stripHtml(story.content), firstBodyHit) : undefined,
    });
  }

  matches.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return Date.parse(b.story.pubDate) - Date.parse(a.story.pubDate);
  });

  return limit ? matches.slice(0, limit) : matches;
}

/** Topic chips derived from the corpus, most used first. */
export function topicsFrom(stories: Story[], limit = 12): string[] {
  const counts = new Map<string, { count: number; label: string }>();
  for (const story of stories) {
    for (const raw of story.categories || []) {
      const label = raw.trim();
      if (!label) continue;
      const key = label.toLowerCase();
      if (key === "the-ink-home" || key === "editorial") continue;
      const entry = counts.get(key);
      if (entry) entry.count += 1;
      else counts.set(key, { count: 1, label });
    }
  }
  return Array.from(counts.values())
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
    .slice(0, limit)
    .map((entry) => entry.label);
}
