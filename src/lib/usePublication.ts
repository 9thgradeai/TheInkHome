import { useCallback, useEffect, useRef, useState } from "react";
import type { Story } from "../types";
import { FALLBACK_ABOUT } from "../data/fallbackAbout";
import { topCategories } from "./format";

export interface Person {
  name: string;
  username?: string;
  role: string;
  bio?: string;
  avatar?: string;
  followers?: number;
  mediumUrl?: string;
}

export interface AboutData {
  description: string;
  officialWebsite?: string;
  editors: Person[];
  writers: Person[];
}

const STORY_CACHE_KEY = "the-ink-home:stories:v6";
const STORY_CACHE_TIME = "the-ink-home:stories:v6:time";
const CACHE_TTL = 1000 * 60 * 20;
const MAX_STORIES = 60;
const FETCH_TIMEOUT_MS = 18000;

interface PublicationState {
  stories: Story[];
  about: AboutData;
  loading: boolean;
  error: boolean;
  /** True once at least one response has landed (used to soften skeletons). */
  live: boolean;
  source: string | null;
}

function readCache(): Story[] | null {
  try {
    const cachedAt = Number(window.localStorage.getItem(STORY_CACHE_TIME) || 0);
    const raw = window.localStorage.getItem(STORY_CACHE_KEY);
    if (!raw || Date.now() - cachedAt > CACHE_TTL) return null;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) return null;
    return parsed.slice(0, MAX_STORIES);
  } catch {
    return null;
  }
}

function writeCache(stories: Story[]): void {
  try {
    window.localStorage.setItem(STORY_CACHE_KEY, JSON.stringify(stories));
    window.localStorage.setItem(STORY_CACHE_TIME, String(Date.now()));
  } catch {
    /* storage full or blocked — the in-memory state still holds */
  }
}

/**
 * Loads the publication archive and editorial data.
 *
 * Strategy: show a warm cache immediately, then reconcile with the network.
 * A failure never leaves the reader with nothing — the last good response
 * stays on screen and the error is surfaced as a retry affordance instead.
 */
export function usePublication(reloadKey = 0): PublicationState & { reload: () => void } {
  const cached = useRef<Story[] | null>(null);
  if (cached.current === null) cached.current = readCache();

  const [stories, setStories] = useState<Story[]>(() => cached.current ?? []);
  const [about, setAbout] = useState<AboutData>(FALLBACK_ABOUT as AboutData);
  const [loading, setLoading] = useState(cached.current === null);
  const [error, setError] = useState(false);
  const [live, setLive] = useState(cached.current !== null);
  const [source, setSource] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  const reload = useCallback(() => setAttempt((value) => value + 1), []);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    setLoading(stories.length === 0);

    async function load() {
      try {
        const [storiesResponse, aboutResponse] = await Promise.all([
          fetch("/api/stories", { signal: controller.signal, cache: "no-store" }),
          fetch("/api/about", { signal: controller.signal }),
        ]);

        if (!storiesResponse.ok) throw new Error(`Stories request failed: ${storiesResponse.status}`);

        const payload = await storiesResponse.json();
        const incoming: Story[] = Array.isArray(payload?.stories) ? payload.stories : [];
        if (incoming.length === 0) throw new Error("Stories feed returned no stories");

        if (!cancelled) {
          const trimmed = incoming.slice(0, MAX_STORIES);
          setStories(trimmed);
          setSource(typeof payload.source === "string" ? payload.source : null);
          setLive(true);
          setError(false);
          cached.current = trimmed;
          writeCache(trimmed);
        }

        if (!cancelled && aboutResponse.ok) {
          const aboutPayload = await aboutResponse.json();
          if (Array.isArray(aboutPayload?.editors) && aboutPayload.editors.length > 0) {
            setAbout({
              description: aboutPayload.description || (FALLBACK_ABOUT as AboutData).description,
              officialWebsite: aboutPayload.officialWebsite,
              editors: aboutPayload.editors,
              writers: Array.isArray(aboutPayload.writers) ? aboutPayload.writers : [],
            });
          }
        }
      } catch {
        if (!cancelled) setError(true);
      } finally {
        window.clearTimeout(timer);
        if (!cancelled) setLoading(false);
      }
    }

    void load();

    return () => {
      cancelled = true;
      controller.abort();
      window.clearTimeout(timer);
    };
    // `stories` is intentionally excluded so a state update never re-triggers a fetch.
  }, [attempt, reloadKey]);

  return { stories, about, loading, error, live, source, reload };
}

/** Derives the contributor roster from the editorial list plus bylines. */
export function deriveContributors(
  about: AboutData,
  stories: Story[],
): (Person & { count: number })[] {
  const map = new Map<string, Person & { count: number }>();

  for (const writer of about.writers || []) {
    map.set(writer.name.toLowerCase(), { ...writer, count: 0 });
  }

  for (const story of stories) {
    const key = (story.author || "").toLowerCase();
    if (!key) continue;
    const existing = map.get(key);
    if (existing) {
      existing.count += 1;
      if (!existing.avatar && story.avatar) existing.avatar = story.avatar;
      if (!existing.role && story.role) existing.role = story.role;
    } else {
      map.set(key, {
        name: story.author,
        role: story.role || "Contributor",
        avatar: story.avatar,
        count: 1,
      });
    }
  }

  const editorNames = new Set((about.editors || []).map((editor) => editor.name.toLowerCase()));

  return Array.from(map.values())
    .filter((person) => !editorNames.has(person.name.toLowerCase()))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

/** Topic labels ordered by how often the archive uses them. */
export function deriveTopics(stories: Story[], limit = 12): string[] {
  return topCategories(stories, limit);
}
