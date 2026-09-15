import { useState, useCallback, useEffect } from "react";
import { Story } from "../types";
import FALLBACK_STORIES from "../data/fallbackStories";
import FALLBACK_ABOUT from "../data/fallbackAbout";
import { analytics } from "../lib/analytics";
import { hydrateInteractions, persistInteractions } from "../lib/sync";

export function useAppState() {
  const [stories, setStories] = useState<Story[]>(() => FALLBACK_STORIES || []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editors, setEditors] = useState<any[]>(() => FALLBACK_ABOUT.editors || []);
  const [writers, setWriters] = useState<any[]>(() => FALLBACK_ABOUT.writers || []);
  const [aboutInfo, setAboutInfo] = useState<any>(() => ({
    description: FALLBACK_ABOUT.description,
    officialWebsite: FALLBACK_ABOUT.officialWebsite,
  }));

  const [entered, setEntered] = useState(false);
  const [bgMode, setBgMode] = useState<"stellar" | "ink" | "forest" | "constellation">(() => {
    try {
      const saved = localStorage.getItem("the-ink-home:atmosphere");
      return ["stellar", "ink", "forest", "constellation"].includes(saved as any) ? (saved as any) : "stellar";
    } catch { return "stellar"; }
  });
  const [activeTab, setActiveTab] = useState<"3d" | "grid" | "list" | "authors" | "saved" | "guideline">("3d");
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);
  const [cinematicComplete, setCinematicComplete] = useState(() => {
    try { return sessionStorage.getItem("the-ink-home:cinematic") === "1"; } catch { return false; }
  });
  const [isWelcomeHome, setIsWelcomeHome] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const [scrollY, setScrollY] = useState(0);

  const [likedSlugs, setLikedSlugs] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem("the-ink-home:likes") || "[]"); } catch { return []; }
  });
  const [savedSlugs, setSavedSlugs] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem("the-ink-home:saves") || "[]"); } catch { return []; }
  });

  useEffect(() => { localStorage.setItem("the-ink-home:likes", JSON.stringify(likedSlugs)); }, [likedSlugs]);
  useEffect(() => { localStorage.setItem("the-ink-home:saves", JSON.stringify(savedSlugs)); }, [savedSlugs]);

  useEffect(() => {
    let mounted = true;
    hydrateInteractions(likedSlugs, savedSlugs, (likes, saves) => {
      if (!mounted) return;
      setLikedSlugs(likes);
      setSavedSlugs(saves);
    });
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    const t = setTimeout(() => persistInteractions(likedSlugs, savedSlugs), 800);
    return () => clearTimeout(t);
  }, [likedSlugs, savedSlugs]);

  useEffect(() => { localStorage.setItem("the-ink-home:atmosphere", bgMode); }, [bgMode]);

  useEffect(() => {
    const handleWinScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleWinScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleWinScroll);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'A') setAdminOpen(prev => !prev);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    const isTyping = () => {
      const el = document.activeElement as HTMLElement | null;
      return !!el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable);
    };
    const handlePaletteKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && (e.key === "k" || e.key === "K")) { e.preventDefault(); setPaletteOpen(prev => !prev); return; }
      if (e.key === "/" && !isTyping()) { e.preventDefault(); setPaletteOpen(true); }
    };
    window.addEventListener("keydown", handlePaletteKey);
    return () => window.removeEventListener("keydown", handlePaletteKey);
  }, []);

  useEffect(() => {
    if (!cinematicComplete || entered) return;
    const handleGateKey = (e: KeyboardEvent) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); enterWebsite(); } };
    window.addEventListener("keydown", handleGateKey);
    return () => window.removeEventListener("keydown", handleGateKey);
  }, [cinematicComplete, entered]);

  const navigateTo = useCallback((path: string) => {
    if (window.location.pathname !== path) { window.history.pushState(null, "", path); window.dispatchEvent(new PopStateEvent("popstate")); }
  }, []);

  const handleSelectStory = useCallback((story: Story | null) => {
    setSelectedStory(story);
    if (story) { navigateTo(`/story/${story.slug}`); analytics.storyRead(story.slug, story.title); }
    else { navigateTo("/" + (activeTab === "authors" ? "about" : activeTab)); }
  }, [activeTab, navigateTo]);

  const handleTabChange = useCallback((tab: "3d" | "grid" | "list" | "authors" | "saved" | "guideline") => {
    setActiveTab(tab); navigateTo("/" + (tab === "authors" ? "about" : tab));
  }, [navigateTo]);

  const enterWebsite = useCallback(() => {
    setIsWelcomeHome(true); setEntered(true); setCinematicComplete(false);
    navigateTo("/" + (activeTab === "authors" ? "about" : activeTab));
  }, [activeTab, navigateTo]);

  const handleCinematicComplete = useCallback(() => {
    setCinematicComplete(true); try { sessionStorage.setItem("the-ink-home:cinematic", "1"); } catch {}
  }, []);

  const handleToggleLike = useCallback((slug: string) => {
    setLikedSlugs(prev => prev.includes(slug) ? prev.filter(s => s !== slug) : [...prev, slug]);
  }, []);

  const handleToggleSave = useCallback((slug: string) => {
    setSavedSlugs(prev => prev.includes(slug) ? prev.filter(s => s !== slug) : [...prev, slug]);
  }, []);

  return {
    stories, loading, error, editors, writers, aboutInfo,
    entered, bgMode, activeTab, selectedStory, cinematicComplete, isWelcomeHome, adminOpen, paletteOpen,
    coords, scrollY, likedSlugs, savedSlugs,
    setEntered, setBgMode, setActiveTab, setSelectedStory, setCinematicComplete, setIsWelcomeHome, setAdminOpen, setPaletteOpen,
    setCoords, setScrollY,
    setStories, setLoading, setError, setEditors, setWriters, setAboutInfo,
    navigateTo, handleSelectStory, handleTabChange, enterWebsite, handleCinematicComplete,
    handleToggleLike, handleToggleSave,
  };
}
