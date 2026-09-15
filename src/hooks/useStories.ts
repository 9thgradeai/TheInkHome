import { useEffect, useState } from "react";
import { Story } from "../types";
import FALLBACK_STORIES from "../data/fallbackStories";
import FALLBACK_ABOUT from "../data/fallbackAbout";

export function useStories() {
  const [stories, setStories] = useState<Story[]>(() => FALLBACK_STORIES || []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editors, setEditors] = useState<any[]>(() => FALLBACK_ABOUT.editors || []);
  const [writers, setWriters] = useState<any[]>(() => FALLBACK_ABOUT.writers || []);
  const [aboutInfo, setAboutInfo] = useState<any>(() => ({
    description: FALLBACK_ABOUT.description,
    officialWebsite: FALLBACK_ABOUT.officialWebsite,
  }));

  useEffect(() => {
    let cancelled = false;
    async function fetchInitialData() {
      setLoading(true);
      const fetchWithTimeout = (input: RequestInfo, timeout = 5000) =>
        Promise.race([fetch(input), new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), timeout))] as any);
      const API_BASE = (import.meta as any).env?.VITE_API_BASE ? String((import.meta as any).env.VITE_API_BASE).replace(/\/+$/g, "") : "";
      const DESIRED = 30;
      const CACHE_KEY = "the-ink-home:stories-cache";
      const CACHE_TTL = 1000 * 60 * 30;
      try {
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed?.ts && Date.now() - parsed.ts < CACHE_TTL && Array.isArray(parsed.stories) && parsed.stories.length > 0) {
            setStories(parsed.stories.slice(0, DESIRED));
          }
        }
      } catch {}
      const mapRSS = (it: any): Story => {
        const title = it.title || "Untitled";
        const link = it.link || "";
        const author = it.author || "The Ink Home";
        const pubDate = it.pubDate || new Date().toUTCString();
        const content = it.content || it.description || "";
        const coverMatch = (content || "").match(/<img[^>]+src=["']([^"']+)["']/i);
        const cover = coverMatch?.[1];
        let slug = "";
        if (link) {
          const parts = link.split("/");
          const last = parts[parts.length - 1];
          slug = last ? last.split("?")[0] : "";
        }
        if (!slug) slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
        return { title, link, author, role: "", pubDate, categories: Array.isArray(it.categories) ? it.categories : ["Editorial"], description: (content || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().substring(0, 180) + "...", content, cover, slug, avatar: undefined } as Story;
      };
      const applyStories = (incoming: Story[]) => {
        if (incoming.length === 0) return;
        setStories((prev) => {
          const slugs = new Set<string>();
          const merged: Story[] = [];
          for (const s of incoming) if (!slugs.has(s.slug)) { merged.push(s); slugs.add(s.slug); }
          for (const p of prev) if (!slugs.has(p.slug)) { merged.push(p); slugs.add(p.slug); }
          const final = merged.slice(0, DESIRED);
          try { localStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), stories: final })); } catch {}
          return final;
        });
      };
      try {
        const [storiesRes, aboutRes] = await Promise.all([
          fetchWithTimeout(`${API_BASE}/api/stories`, 5000).catch(() => null),
          fetchWithTimeout(`${API_BASE}/api/about`, 5000).catch(() => null),
        ]);
        let serverStories: Story[] = [];
        if (storiesRes?.ok) {
          const data = await storiesRes.json();
          serverStories = (data.stories || []) as Story[];
        }
        if (!cancelled) applyStories(serverStories);
        if (aboutRes?.ok) {
          const aboutData = await aboutRes.json();
          if (!cancelled) {
            if (Array.isArray(aboutData.editors)) setEditors(aboutData.editors);
            if (Array.isArray(aboutData.writers)) setWriters(aboutData.writers);
            if (aboutData.description) setAboutInfo({ description: aboutData.description, officialWebsite: aboutData.officialWebsite || "https://theinkhome.live/" });
          }
        }
        if (serverStories.length === 0) {
          const rss2jsonUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent("https://medium.com/feed/the-ink-home")}`;
          const resp: any = await fetchWithTimeout(rss2jsonUrl, 6000);
          if (resp?.ok) {
            const payload = await resp.json();
            if (payload && Array.isArray(payload.items)) {
              const mapped = payload.items.map(mapRSS);
              if (!cancelled) applyStories(mapped);
            }
          }
        }
      } catch (err: any) {
        if (!cancelled) setError(err.message || "Unknown error");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchInitialData();
    return () => { cancelled = true; };
  }, []);

  return { stories, setStories, loading, error, editors, setEditors, writers, setWriters, aboutInfo, setAboutInfo };
}
