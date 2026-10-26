import { Story } from "../types";

export function formatDate(value: string, style: "short" | "long" = "long"): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-US",
    style === "short"
      ? { month: "short", day: "numeric" }
      : { month: "long", day: "numeric", year: "numeric" },
  );
}

export function readingTime(story: Story): number {
  const text = (story.content || story.description || "").replace(/<[^>]+>/g, " ");
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 220));
}

export function initials(name: string): string {
  const parts = (name || "?").replace(/[^a-zA-Z0-9 ]/g, " ").trim().split(/\s+/);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function topCategories(stories: Story[], limit = 10): string[] {
  const counts = new Map<string, number>();
  stories.forEach((story) => {
    (story.categories || []).forEach((category) => {
      const key = category.trim();
      if (!key || key.toLowerCase() === "the-ink-home") return;
      counts.set(key, (counts.get(key) || 0) + 1);
    });
  });
  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([category]) => category);
}

export function stripHtml(value: string): string {
  return (value || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}
