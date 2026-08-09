import React, { useState, useEffect, useRef, useMemo, lazy, Suspense } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Story } from "./types";

const Carousel3D = lazy(() => import("./components/Carousel3D"));
const StoryGrid = lazy(() => import("./components/StoryGrid"));
const StoryList = lazy(() => import("./components/StoryList"));
const AuthorsSection = lazy(() => import("./components/AuthorsSection"));
const SubmissionGuideline = lazy(() => import("./components/SubmissionGuideline"));
const StoryModal = lazy(() => import("./components/StoryModal"));
import AvatarImage from "./components/AvatarImage";
import { Logo } from "./components/Logo";
import DataStreamBackground from "./components/DataStreamBackground";
import CursorGlow from "./components/CursorGlow";
import CinematicLoader from "./components/CinematicLoader";
import FALLBACK_STORIES from "./data/fallbackStories";
import FALLBACK_ABOUT from "./data/fallbackAbout";
import { 
  Compass, 
  LayoutGrid, 
  AlignLeft, 
  Users, 
  ExternalLink,
  BookOpen, 
  ArrowDown, 
  Cpu, 
  Radio,
  ChevronRight,
  ChevronLeft,
  Flame,
  Volume2,
  VolumeX,
  Heart,
  Bookmark,
  Feather,
  MoreHorizontal,
  Menu,
  ArrowUpRight
} from "lucide-react";
import Subscribe from "./components/Subscribe";
import { getLikesCount } from "./lib/interaction";
import AIAssistant from "./components/AIAssistant";
import AdminDashboard from "./components/AdminDashboard";
import CommandPalette from "./components/CommandPalette";
import { useAmbientAudio } from "./hooks/useAmbientAudio";
import { useSeo } from "./hooks/useSeo";
import { analytics } from "./lib/analytics";
import { hydrateInteractions, persistInteractions } from "./lib/sync";

export default function App() {
  // Initialize stories from local fallback for instant rendering on static hosts
  const [stories, setStories] = useState<Story[]>(() => FALLBACK_STORIES || []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editors, setEditors] = useState<any[]>(() => FALLBACK_ABOUT.editors || []);
  const [writers, setWriters] = useState<any[]>(() => FALLBACK_ABOUT.writers || []);
  const [aboutInfo, setAboutInfo] = useState<any>(() => ({
    description: FALLBACK_ABOUT.description,
    officialWebsite: FALLBACK_ABOUT.officialWebsite
  }));
  
  // Navigation & View Toggles
  const [entered, setEntered] = useState(false);
  const [bgMode, setBgMode] = useState<"stellar" | "ink" | "forest" | "constellation">(() => {
    // Restore the reader's last-chosen atmosphere across sessions.
    try {
      const saved = localStorage.getItem("the-ink-home:atmosphere");
      return (["stellar", "ink", "forest", "constellation"] as const).includes(saved as any) ? (saved as any) : "stellar";
    } catch { return "stellar"; }
  });
  const [activeTab, setActiveTab] = useState<"3d" | "grid" | "list" | "authors" | "saved" | "guideline">("3d");
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);
  // Show the cinematic loader only once per session — returning visitors skip it entirely.
  const [cinematicComplete, setCinematicComplete] = useState(() => {
    try { return sessionStorage.getItem("the-ink-home:cinematic") === "1"; } catch { return false; }
  });
  const [isWelcomeHome, setIsWelcomeHome] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);

  const pendingSlugRef = useRef<string | null>(null);

  // Mouse coords & Scroll tracking for Typographic Kinetic motion
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const [scrollY, setScrollY] = useState(0);

  const handleMouseMove = (e: React.MouseEvent) => {
    const x = (e.clientX / window.innerWidth) * 2 - 1;
    const y = (e.clientY / window.innerHeight) * 2 - 1;
    setCoords({ x, y });
  };

  useEffect(() => {
    const handleWinScroll = () => {
      setScrollY(window.scrollY);
    };
    window.addEventListener("scroll", handleWinScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleWinScroll);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'A') {
        setAdminOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // ⌘K / Ctrl+K toggles the command palette; "/" opens it when not typing in a field.
  useEffect(() => {
    const isTyping = () => {
      const el = document.activeElement as HTMLElement | null;
      return !!el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable);
    };
    const handlePaletteKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && (e.key === "k" || e.key === "K")) {
        e.preventDefault();
        setPaletteOpen((prev) => !prev);
        return;
      }
      if (e.key === "/" && !isTyping()) {
        e.preventDefault();
        setPaletteOpen(true);
      }
    };
    window.addEventListener("keydown", handlePaletteKey);
    return () => window.removeEventListener("keydown", handlePaletteKey);
  }, []);

  // Skip the landing gate with Enter/Space once the cinematic loader is done.
  useEffect(() => {
    if (!cinematicComplete || entered) return;
    const handleGateKey = (e: KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        enterWebsite();
      }
    };
    window.addEventListener("keydown", handleGateKey);
    return () => window.removeEventListener("keydown", handleGateKey);
  }, [cinematicComplete, entered]);

  // Helper to push history state and update URL
  const navigateTo = (path: string) => {
    if (window.location.pathname !== path) {
      window.history.pushState(null, "", path);
      window.dispatchEvent(new PopStateEvent("popstate"));
    }
  };

  const handleSelectStory = (story: Story | null) => {
    setSelectedStory(story);
    if (story) {
      navigateTo(`/story/${story.slug}`);
      analytics.storyRead(story.slug, story.title);
    } else {
      navigateTo("/" + (activeTab === "authors" ? "about" : activeTab));
    }
  };

  const handleTabChange = (tab: "3d" | "grid" | "list" | "authors" | "saved" | "guideline") => {
    setActiveTab(tab);
    navigateTo("/" + (tab === "authors" ? "about" : tab));
  };

  // GitHub Pages 404.html fallback: restore original path from query param
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const redirectPath = params.get("redirect_to");
    if (redirectPath) {
      window.history.replaceState(null, "", redirectPath);
      window.dispatchEvent(new PopStateEvent("popstate"));
    }
  }, []);

  // URL Path router synchronization listener
  useEffect(() => {
    const handleUrlChange = () => {
      const path = window.location.pathname;
      
      if (path === "/" || path === "") {
        setEntered(false);
        setSelectedStory(null);
        setIsWelcomeHome(false);
      } else if (path === "/3d") {
        setEntered(true);
        setActiveTab("3d");
        setSelectedStory(null);
      } else if (path === "/grid") {
        setEntered(true);
        setActiveTab("grid");
        setSelectedStory(null);
      } else if (path === "/list") {
        setEntered(true);
        setActiveTab("list");
        setSelectedStory(null);
      } else if (path === "/about") {
        setEntered(true);
        setActiveTab("authors");
        setSelectedStory(null);
      } else if (path === "/saved") {
        setEntered(true);
        setActiveTab("saved");
        setSelectedStory(null);
      } else if (path === "/guideline") {
        setEntered(true);
        setActiveTab("guideline");
        setSelectedStory(null);
      } else if (path.startsWith("/story/")) {
        const slug = path.replace("/story/", "");
        const found = stories.find(s => s.slug === slug);
        if (found) {
          setEntered(true);
          setSelectedStory(found);
        } else {
          pendingSlugRef.current = slug;
        }
      }
    };

    window.addEventListener("popstate", handleUrlChange);
    handleUrlChange();

    return () => window.removeEventListener("popstate", handleUrlChange);
  }, [stories]);

  useEffect(() => {
    if (pendingSlugRef.current && stories.length > 0) {
      const found = stories.find(s => s.slug === pendingSlugRef.current);
      if (found) {
        setSelectedStory(found);
        setEntered(true);
        pendingSlugRef.current = null;
      }
    }
  }, [stories]);

  // User Interaction State: Likes & Bookmarks saved to LocalStorage
  const [likedSlugs, setLikedSlugs] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem("the-ink-home:likes");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [savedSlugs, setSavedSlugs] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem("the-ink-home:saves");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem("the-ink-home:likes", JSON.stringify(likedSlugs));
  }, [likedSlugs]);

  useEffect(() => {
    localStorage.setItem("the-ink-home:saves", JSON.stringify(savedSlugs));
  }, [savedSlugs]);

  // Hydrate likes/saves from the backend once on load (local stays authoritative).
  useEffect(() => {
    let mounted = true;
    hydrateInteractions(likedSlugs, savedSlugs, (likes, saves) => {
      if (!mounted) return;
      setLikedSlugs(likes);
      setSavedSlugs(saves);
    });
    return () => { mounted = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Debounced best-effort sync to the backend whenever likes/saves change.
  useEffect(() => {
    const t = setTimeout(() => persistInteractions(likedSlugs, savedSlugs), 800);
    return () => clearTimeout(t);
  }, [likedSlugs, savedSlugs]);

  const handleToggleLike = (slug: string) => {
    setLikedSlugs((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]
    );
  };

  const handleToggleSave = (slug: string) => {
    setSavedSlugs((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]
    );
  };
  
  // Ambient Music State (Non-intrusive sound effects)
  const { musicPlaying, toggleSound, startAmbient } = useAmbientAudio();

  // SEO head management: per-route + per-article meta, OG/Twitter, canonical, JSON-LD.
  const seoDescriptor = useMemo(() => {
    if (selectedStory) {
      return {
        title: selectedStory.title,
        description: (selectedStory.description || "")
          .replace(/<[^>]+>/g, "")
          .replace(/\s+/g, " ")
          .trim()
          .slice(0, 160),
        type: "article" as const,
        image: selectedStory.cover,
        url: typeof window !== "undefined" ? `${window.location.origin}/#/story/${selectedStory.slug}` : undefined,
      };
    }
    const tabMeta: Record<string, { title: string; description: string }> = {
      "3d": { title: "The Volumetric Universe", description: "A spatial 3D carousel of editorial stories from The Ink Home." },
      grid: { title: "Bento Grid", description: "Browse The Ink Home's full archive as an immersive grid." },
      list: { title: "The Ledger", description: "The Ink Home publication ledger — every story in order." },
      guideline: { title: "Submission Guidelines", description: "How to become a writer at The Ink Home." },
      authors: { title: "About & Editors", description: "Meet the editors and authors behind The Ink Home." },
      saved: { title: "Saved Stories", description: "Your saved collection from The Ink Home." },
    };
    return tabMeta[activeTab] || { title: "Where Words Feel at Home" };
  }, [selectedStory, activeTab]);

  useSeo(seoDescriptor);

  // Persist the chosen atmosphere so the reader's world is remembered.
  useEffect(() => {
    try { localStorage.setItem("the-ink-home:atmosphere", bgMode); } catch {}
  }, [bgMode]);

  // Auto-fetch stories & About board profiles from Express proxy servers
  useEffect(() => {
    let cancelled = false;
    async function fetchInitialData() {
      setLoading(true);

      // Helper: fetch with a timeout so a slow/missing backend degrades gracefully.
      const fetchWithTimeout = (input: RequestInfo, timeout = 5000) => {
        return Promise.race([
          fetch(input),
          new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), timeout))
        ] as any);
      };

      // Base API URL configurable via Vite env: VITE_API_BASE.
      const API_BASE = (import.meta as any).env?.VITE_API_BASE
        ? String((import.meta as any).env.VITE_API_BASE).replace(/\/+$/g, "")
        : "";
      const DESIRED = 30;
      const CACHE_KEY = "the-ink-home:stories-cache";
      const CACHE_TTL = 1000 * 60 * 30; // 30 minutes

      // Hydrate from localStorage immediately for an instant first paint.
      try {
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed?.ts && Date.now() - parsed.ts < CACHE_TTL && Array.isArray(parsed.stories) && parsed.stories.length > 0) {
            setStories(parsed.stories.slice(0, DESIRED));
          }
        }
      } catch (e) {}

      // Map an rss2json item to our Story shape (used only as a static-host fallback).
      const mapRSS = (it: any): Story => {
        const title = it.title || "Untitled";
        const link = it.link || "";
        const author = it.author || "The Ink Home";
        const pubDate = it.pubDate || new Date().toUTCString();
        const content = it.content || it.description || "";
        const coverMatch = (content || "").match(/<img[^>]+src=["']([^"']+)["']/i);
        const cover = coverMatch && coverMatch[1] ? coverMatch[1] : undefined;
        let slug = "";
        if (link) {
          const parts = link.split("/");
          const last = parts[parts.length - 1];
          slug = last ? last.split("?")[0] : "";
        }
        if (!slug) slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
        return {
          title,
          link,
          author,
          role: "",
          pubDate,
          categories: Array.isArray(it.categories) ? it.categories : ["Editorial"],
          description: (content || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().substring(0, 180) + "...",
          content,
          cover,
          slug,
          avatar: undefined
        } as Story;
      };

      // Merge new stories over whatever is rendered, dedup, cap, and cache.
      const applyStories = (incoming: Story[]) => {
        if (incoming.length === 0) return;
        setStories((prev) => {
          const slugs = new Set<string>();
          const merged: Story[] = [];
          for (const s of incoming) { if (!slugs.has(s.slug)) { merged.push(s); slugs.add(s.slug); } }
          for (const p of prev) { if (!slugs.has(p.slug)) { merged.push(p); slugs.add(p.slug); } }
          const final = merged.slice(0, DESIRED);
          try { localStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), stories: final })); } catch (e) {}
          return final;
        });
      };

      try {
        // Primary: a single server-side fetch to /api/stories + /api/about.
        const [storiesRes, aboutRes] = await Promise.all([
          fetchWithTimeout(`${API_BASE}/api/stories`, 5000).catch(() => null),
          fetchWithTimeout(`${API_BASE}/api/about`, 5000).catch(() => null)
        ]);

        let serverStories: Story[] = [];
        if (storiesRes && storiesRes.ok) {
          const data = await storiesRes.json();
          serverStories = (data.stories || []) as Story[];
        }
        if (!cancelled) applyStories(serverStories);

        if (aboutRes && aboutRes.ok) {
          const aboutData = await aboutRes.json();
          if (!cancelled) {
            if (Array.isArray(aboutData.editors)) setEditors(aboutData.editors);
            if (Array.isArray(aboutData.writers)) setWriters(aboutData.writers);
            if (aboutData.description) {
              setAboutInfo({
                description: aboutData.description,
                officialWebsite: aboutData.officialWebsite || "https://theinkhome.live/"
              });
            }
          }
        }

        // Fallback for static hosts without a backend: a single rss2json fetch.
        if (serverStories.length === 0) {
          const rss2jsonUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent("https://medium.com/feed/the-ink-home")}`;
          const resp = await fetchWithTimeout(rss2jsonUrl, 6000);
          if (resp && resp.ok) {
            const payload = await resp.json();
            if (payload && Array.isArray(payload.items)) {
              const mapped = payload.items.map(mapRSS);
              if (!cancelled) applyStories(mapped);
            }
          }
        }
      } catch (err: any) {
        console.error("Failed to load initial data: ", err);
        if (!cancelled) setError(err.message || "Unknown error connecting to publication");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchInitialData();
    return () => { cancelled = true; };
  }, []);

  const enterWebsite = () => {
    setIsWelcomeHome(true);
    setEntered(true);
    setCinematicComplete(false);
    navigateTo("/" + (activeTab === "authors" ? "about" : activeTab));
    // Auto start the sound on entrance for premium cinematic audio feedback
    startAmbient();
  };

  const handleCinematicComplete = () => {
    setCinematicComplete(true);
    try { sessionStorage.setItem("the-ink-home:cinematic", "1"); } catch {}
  };

   return (
     <div 
       data-atmosphere={bgMode}
       className="relative min-h-screen bg-[#050505] text-white font-sans overflow-x-hidden selection:bg-[var(--atmo-text)]/30 selection:text-white"
     >
{!cinematicComplete && (
           <CinematicLoader onComplete={handleCinematicComplete} isWelcomeHome={isWelcomeHome} />
         )}
       
       <DataStreamBackground baseHue={bgMode === "stellar" ? 190 : bgMode === "ink" ? 235 : bgMode === "forest" ? 35 : bgMode === "constellation" ? 160 : 190} />

       {/* Cursor-reactive ambient glow — tints with the active atmosphere */}
       <CursorGlow />

       {/* Carbon & Noise Texture Overlays */}
       <div className="absolute inset-0 pointer-events-none opacity-[0.03] contrast-150 mix-blend-overlay carbon-texture z-[2]" />
       <div className="absolute inset-0 pointer-events-none opacity-[0.02] noise-overlay z-[2]" />
       
       {/* Floating Atmosphere Customizer Deck */}
      <div 
        className="fixed bottom-16 left-2 sm:bottom-6 sm:left-6 z-40 flex items-center gap-1 sm:gap-1.5 p-0.5 sm:p-1 bg-black/60 border border-white/10 rounded-full text-[8px] sm:text-[10px] font-mono uppercase tracking-wider backdrop-blur-xl shadow-2xl transition-all duration-300 hover:border-[var(--glow-text)]/40 scale-90 sm:scale-100 origin-bottom-left"
        id="atmosphere-deck"
      >
        <span className="hidden md:inline-block px-2 text-slate-500 font-bold select-none text-[9px] uppercase tracking-widest pl-2.5">Atmosphere:</span>
        <button
          onClick={() => setBgMode("stellar")}
        className={`px-2.5 py-1 rounded-full transition-all cursor-pointer flex items-center gap-1 ${
          bgMode === "stellar" 
            ? "bg-[var(--atmo-text)] text-black font-extrabold shadow-[0_0_12px_var(--atmo-glow)]" 
            : "text-slate-400 hover:text-[var(--atmo-text)]"
        }`}
        title="Stellar Universe Node"
      >
        <span className={`w-1 h-1 rounded-full ${bgMode === "stellar" ? "bg-black" : "bg-current opacity-70"}`} />
        Cosmic
      </button>
      <button
        onClick={() => setBgMode("ink")}
        className={`px-2.5 py-1 rounded-full transition-all cursor-pointer flex items-center gap-1 ${
          bgMode === "ink" 
            ? "bg-[var(--atmo-text)] text-black font-extrabold shadow-[0_0_12px_var(--atmo-glow)]" 
            : "text-slate-400 hover:text-[var(--atmo-text)]"
        }`}
        title="Flowing Writer's Ink"
      >
        <span className={`w-1 h-1 rounded-full ${bgMode === "ink" ? "bg-black" : "bg-current opacity-70"}`} />
        Ink
      </button>
      <button
        onClick={() => setBgMode("forest")}
        className={`px-2.5 py-1 rounded-full transition-all cursor-pointer flex items-center gap-1 ${
          bgMode === "forest" 
            ? "bg-[var(--atmo-text)] text-black font-extrabold shadow-[0_0_12px_var(--atmo-glow)]" 
            : "text-slate-400 hover:text-[var(--atmo-text)]"
        }`}
        title="Cozy Forest Cabin Embers"
      >
        <span className={`w-1 h-1 rounded-full ${bgMode === "forest" ? "bg-black" : "bg-current opacity-70"}`} />
        Cabin
      </button>
      <button
        onClick={() => setBgMode("constellation")}
        className={`px-2.5 py-1 rounded-full transition-all cursor-pointer flex items-center gap-1 ${
          bgMode === "constellation" 
            ? "bg-[var(--atmo-text)] text-black font-extrabold shadow-[0_0_12px_var(--atmo-glow)]" 
            : "text-slate-400 hover:text-[var(--atmo-text)]"
        }`}
        title="Thought Constellations Network"
      >
        <span className={`w-1 h-1 rounded-full ${bgMode === "constellation" ? "bg-black" : "bg-current opacity-70"}`} />
        Neural
        </button>

        {/* Divider + ambient sound toggle — consolidated into the single utility cluster */}
        <div className="w-px h-4 bg-white/10 mx-1 sm:mx-1.5" />
        <button
          onClick={toggleSound}
          className={`px-2.5 py-1 rounded-full transition-all cursor-pointer flex items-center gap-1 ${
            musicPlaying ? "text-[var(--atmo-text)] font-bold" : "text-slate-400 hover:text-[var(--atmo-text)]"
          }`}
          title={musicPlaying ? "Mute Cosmic Hum" : "Unmute Cosmic Hum"}
        >
          {musicPlaying ? (
            <Volume2 className="w-3 h-3" />
          ) : (
            <VolumeX className="w-3 h-3" />
          )}
        </button>
      </div>

      <AnimatePresence mode="wait">
        
        {/* VIEW 1: CINEMATIC PORTAL LANDING PAGE */}
        {!entered ? (
          <motion.div
            key="landing-page"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, y: -40 }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
            onMouseMove={handleMouseMove}
            className="relative min-h-screen flex flex-col justify-between z-10 px-6 py-8"
          >
            {/* Top Logotype Row */}
            <motion.header
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
              className="w-full flex items-center justify-between max-w-6xl mx-auto"
            >
              <div className="flex items-center gap-2.5">
                <Logo size={46} textColor="text-slate-200" />
              </div>
              <a 
                href="https://medium.com/the-ink-home" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-slate-400 hover:text-[var(--atmo-text)] hover:border-[var(--atmo-border)] transition-all border border-transparent px-3 py-1.5 rounded bg-white/5"
                id="landing-medium-link"
              >
                MEDIUM EDITION <ExternalLink className="w-3 h-3 text-[var(--atmo-text)]" />
              </a>
            </motion.header>

            {/* Core Cinematic Hero */}
            <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6 sm:space-y-8 max-w-4xl mx-auto my-8 sm:my-12">
              <motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 1.2, delay: 0.2 }}
                className="space-y-6"
              >
                {/* Visual Label Banner */}
                <div className="inline-block px-4 py-1.5 bg-[var(--atmo-surface)] border border-[var(--atmo-border)] rounded text-[10px] font-bold tracking-[0.2em] text-[var(--atmo-text)] uppercase">
                  Featured Edition — Vol. 082
                </div>
                {/* Main Heading title with custom gradient styling and 3D kinetic interaction */}
          <h1 
            style={{
              letterSpacing: `${-0.05 + Math.abs(coords.x) * 0.03}em`,
              transform: `perspective(1000px) rotateY(${coords.x * 12}deg) rotateX(${-coords.y * 12}deg) translateY(${scrollY * -0.1}px)`,
              textShadow: `${-coords.x * 12}px ${-coords.y * 12}px 24px var(--glow-color)`,
              transition: "transform 0.08s ease-out, letter-spacing 0.15s ease-out, text-shadow 0.15s ease-out"
            }}
            className="text-5xl sm:text-6xl md:text-8xl lg:text-[110px] leading-[0.85] font-black tracking-tighter mb-4 sm:mb-6 italic uppercase font-display bg-gradient-to-r from-white via-[var(--atmo-text)] to-[var(--atmo-text)] bg-clip-text text-transparent select-none"
          >
            The Ink<br />Home
          </h1>
          <p className="max-w-xl mx-auto text-xs sm:text-sm md:text-base text-slate-400 leading-relaxed font-light tracking-wide px-4 sm:px-0">
            Where spatial typography, code shaders, and cyber-philosophical stories merge into floating geometric objects in space.
          </p>
              </motion.div>
 
              {/* Enter CTA Trigger BUTTON */}
<motion.div
                   initial={{ opacity: 0, y: 15, scale: 0.95 }}
                   animate={{ opacity: 1, y: 0, scale: 1 }}
                   transition={{ duration: 0.8, delay: 0.6, ease: "easeOut" }}
                 >
                   <button
                     onClick={enterWebsite}
                     className="px-6 py-3 sm:px-8 sm:py-4 bg-white text-black font-extrabold uppercase tracking-[0.2em] text-[10px] sm:text-[11px] hover:bg-[var(--atmo-text)] hover:shadow-[0_0_35px_var(--atmo-glow)] transition-all duration-300 cursor-pointer flex items-center gap-2 z-20 mx-auto"
                     id="enter-portal-btn"
                   >
                     Enter The Ink Home
                     <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-black" />
                   </button>
                 </motion.div>
            </div>

            {/* Bottom Section: Auto-scrolling Featured Stories Cinematic strip */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="w-full max-w-6xl mx-auto"
            >
              {loading ? (
                <div className="flex justify-center py-4">
                  <div className="w-4 h-4 border border-[var(--atmo-text)] border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
                <div className="space-y-3">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.9 }}
                    className="flex items-center justify-between text-[9px] sm:text-[10px] font-mono tracking-widest uppercase text-slate-500 px-2 sm:px-0"
                  >
                    <span className="flex items-center gap-1.5 sm:gap-2">
                      <Radio className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[var(--atmo-text)]" />
                      SATELLITE MAGAZINE LOOP
                    </span>
                    <span className="hidden sm:inline">Scroll or Click items to read</span>
                  </motion.div>

                  {/* Horizontal Auto-Scroller ticker containing stories summaries */}
                  {/* Subscribe card (inline) */}
<motion.div
                     initial={{ opacity: 0, y: 20 }}
                     animate={{ opacity: 1, y: 0 }}
                     transition={{ duration: 0.6, delay: 1.0 }}
                     className="max-w-4xl mx-auto mb-3 sm:mb-4 px-4 sm:px-0"
                   >
                     <Subscribe />
                   </motion.div>
                   
                    {/* The Bento Archive */}
                   <motion.div
                     initial={{ opacity: 0, y: 30 }}
                     animate={{ opacity: 1, y: 0 }}
                     transition={{ duration: 0.8, delay: 1.2, ease: [0.16, 1, 0.3, 1] }}
                     className="mt-6 sm:mt-8"
                   >
                     <div className="flex items-center justify-between mb-4 px-2 sm:px-0">
                       <h3 className="text-[10px] font-mono uppercase tracking-[0.2em] text-white/70">
                         The Bento Archive
                       </h3>
                       <span className="text-[9px] text-slate-500">{stories.length} Stories</span>
                     </div>
                     <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4 sm:gap-6">
                       {stories.map((story, index) => (
                         <motion.div
                           layout
                           key={story.slug}
                           className="group cursor-pointer glass-card tactile-card ripple-host overflow-hidden flex flex-col justify-between min-h-[18rem] sm:min-h-[22rem]"
                           onClick={() => {
                             setSelectedStory(story);
                             setEntered(true);
                             navigateTo(`/story/${story.slug}`);
                           }}
                           initial={{ opacity: 0, y: 20 }}
                           animate={{ opacity: 1, y: 0 }}
                           transition={{ type: "spring", stiffness: 260, damping: 20, delay: index * 0.03 }}
                           id={`grid-card-${story.slug}`}
                           whileHover={{ y: -4, rotateX: 2, rotateY: -2, scale: 1.02 }}
                         >
                           {/* Media Section */}
                           <div className="relative w-full h-32 sm:h-44 overflow-hidden border-b border-white/5">
                              <img
                                src={story.cover || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80"}
                                alt={story.title}
                                referrerPolicy="no-referrer"
                                width="400"
                                height="300"
                                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                                decoding="async"
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                                loading="lazy"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.src = "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80";
                                }}
                             />
                             <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/10" />
                             
                             {/* Floating Date Badge */}
                             <span className="absolute top-3 left-3 px-2 py-0.5 rounded-none font-mono text-[9px] uppercase tracking-wider bg-black border border-white/5 text-slate-300">
                               {new Date(story.pubDate).toLocaleDateString("en-US", {
                                 month: "short",
                                 day: "numeric",
                               })}
                             </span>
                      
                             {/* Primary Tag */}
                             {story.categories[0] && (
                               <span className="absolute bottom-3 right-3 px-2.5 py-0.5 rounded-none font-mono text-[9px] uppercase tracking-wider bg-black/80 text-[var(--glow-text)] border border-[var(--glow-text)]/25">
                                 {story.categories[0]}
                               </span>
                             )}
                           </div>
                      
                           {/* Data Section */}
                           <div className="flex-1 p-3 sm:p-5 flex flex-col justify-between bg-black/20">
                             <div>
                               {/* Author Line */}
                               <div className="flex items-center gap-2 mb-1.5 sm:mb-2">
                                 <AvatarImage
                                   src={story.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde"}
                                   alt={story.author}
                                   className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-none object-cover border border-white/5"
                                 />
                                 <span className="text-[10px] sm:text-[11px] font-mono text-slate-400">
                                   {story.author}
                                 </span>
                               </div>
   
                               {/* Title */}
                               <h3 className="font-sans font-medium text-white text-sm sm:text-base group-hover:text-[var(--glow-text)] line-clamp-2 leading-snug transition-colors">
                                 {story.title}
                               </h3>
   
                               {/* Snippet Description */}
                               <p className="text-[11px] sm:text-xs mt-1.5 sm:mt-2.5 text-slate-400 line-clamp-2 leading-relaxed font-light hidden sm:block">
                                 {story.description}
                               </p>
                             </div>
   
                             <div className="flex items-center justify-between pt-2 sm:pt-3 border-t border-white/5 text-[10px] sm:text-[11px] font-mono mt-2 sm:mt-4">
                               <span className="text-slate-500">
                                 by {story.role || "Staff"}
                               </span>
                                
                               {/* Floating Like & Save quick controls */}
                               <div className="flex items-center gap-2 sm:gap-3">
                                 <button
                                   onClick={(e) => {
                                     e.stopPropagation();
                                     handleToggleLike(story.slug);
                                   }}
                                   className={`flex items-center gap-1 transition-colors p-1.5 sm:p-1 cursor-pointer hover:text-[var(--glow-text)] min-w-[28px] sm:min-w-[32px] min-h-[28px] sm:min-h-[32px] justify-center ${likedSlugs.includes(story.slug) ? "text-[var(--glow-text)] font-bold" : "text-slate-500"}`}
                                   title={likedSlugs.includes(story.slug) ? "Unlike" : "Like"}
                                 >
                                   <Heart className={`w-3.5 h-3.5 ${likedSlugs.includes(story.slug) ? "fill-current text-[var(--glow-text)]" : ""}`} />
                                   <span className="text-[10px] sm:text-[11px]">{getLikesCount(story.title, likedSlugs.includes(story.slug))}</span>
                                 </button>
                                 
                                 <button
                                   onClick={(e) => {
                                     e.stopPropagation();
                                     handleToggleSave(story.slug);
                                   }}
                                   className={`flex items-center gap-1 transition-colors p-1.5 sm:p-1 cursor-pointer hover:text-[var(--glow-text)] min-w-[28px] sm:min-w-[32px] min-h-[28px] sm:min-h-[32px] justify-center ${savedSlugs.includes(story.slug) ? "text-[var(--glow-text)]" : "text-slate-500"}`}
                                   title={savedSlugs.includes(story.slug) ? "Remove Bookmark" : "Bookmark Story"}
                                 >
                                   <Bookmark className={`w-3.5 h-3.5 ${savedSlugs.includes(story.slug) ? "fill-current" : ""}`} />
                                 </button>

                                 <span className="flex items-center gap-1 text-[var(--glow-text)] font-bold group-hover:text-white transition-colors ml-0.5 sm:ml-1 text-[10px] sm:text-[11px]">
                                   Read
                                   <ArrowUpRight className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                                 </span>
                               </div>
                             </div>
                           </div>
                         </motion.div>
                       ))}
                     </div>
                    </motion.div>
                 </div>
              )}
            </motion.div>
            
          </motion.div>
        ) : (
          
           /* VIEW 2: CORE INTERACTIVE SPATIAL DASHBOARD PLATFORM */
          <motion.div
            key="dashboard-app"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="relative z-10 flex flex-col min-h-screen bg-[#050505]"
          >
            {/* Left Workspace Sidebar */}
            <header className="hidden md:flex fixed left-0 top-0 bottom-0 z-30 w-16 flex-col items-center justify-between py-4 border-r border-white/10 bg-[#050505]/95 backdrop-blur-xl">
              <div className="flex flex-col items-center gap-1 w-full">
                <div 
                  onClick={() => {
                    setEntered(false);
                    navigateTo("/");
                  }} 
                  className="p-1.5 cursor-pointer group mb-2"
                  title="Home"
                >
                  <Logo size={28} />
                </div>

                <div className="w-8 h-px bg-white/10 my-1" />

                <nav className="flex flex-col items-center gap-1 w-full px-1.5" aria-label="Primary">
                  <button
                    onClick={() => handleTabChange("3d")}
                    className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 cursor-pointer relative ${
                      activeTab === "3d"
                        ? "bg-white text-black shadow-[0_8px_20px_rgba(255,255,255,0.18)]"
                        : "text-slate-400 hover:text-white hover:bg-white/[0.06]"
                    }`}
                    title="3D Universe"
                    aria-label="View 3D Universe carousel"
                    aria-pressed={activeTab === "3d"}
                  >
                    <Compass className="w-4 h-4" />
                    {activeTab === "3d" && (
                      <span className="absolute -right-1 top-1/2 -translate-y-1/2 w-1 h-5 rounded-full bg-[var(--glow-text)] shadow-[0_0_10px_var(--glow-color)]" />
                    )}
                  </button>
                  <button
                    onClick={() => handleTabChange("grid")}
                    className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 cursor-pointer relative ${
                      activeTab === "grid" 
                        ? "bg-white text-black shadow-[0_8px_20px_rgba(255,255,255,0.18)]" 
                        : "text-slate-400 hover:text-white hover:bg-white/[0.06]"
                    }`}
                    title="Bento Grid"
                    aria-label="View stories as grid"
                    aria-pressed={activeTab === "grid"}
                  >
                    <LayoutGrid className="w-4 h-4" />
                    {activeTab === "grid" && (
                      <span className="absolute -right-1 top-1/2 -translate-y-1/2 w-1 h-5 rounded-full bg-[var(--glow-text)] shadow-[0_0_10px_var(--glow-color)]" />
                    )}
                  </button>
                  <button
                    onClick={() => handleTabChange("list")}
                    className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 cursor-pointer relative ${
                      activeTab === "list" 
                        ? "bg-white text-black shadow-[0_8px_20px_rgba(255,255,255,0.18)]" 
                        : "text-slate-400 hover:text-white hover:bg-white/[0.06]"
                    }`}
                    title="Ledger List"
                    aria-label="View stories as list"
                    aria-pressed={activeTab === "list"}
                  >
                    <AlignLeft className="w-4 h-4" />
                    {activeTab === "list" && (
                      <span className="absolute -right-1 top-1/2 -translate-y-1/2 w-1 h-5 rounded-full bg-[var(--glow-text)] shadow-[0_0_10px_var(--glow-color)]" />
                    )}
                  </button>
                  <button
                    onClick={() => handleTabChange("guideline")}
                    className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 cursor-pointer relative ${
                      activeTab === "guideline" 
                        ? "bg-white text-black shadow-[0_8px_20px_rgba(255,255,255,0.18)]" 
                        : "text-slate-400 hover:text-white hover:bg-white/[0.06]"
                    }`}
                    title="Guidelines"
                    aria-label="View submission guidelines"
                    aria-pressed={activeTab === "guideline"}
                  >
                    <Feather className="w-4 h-4" />
                    {activeTab === "guideline" && (
                      <span className="absolute -right-1 top-1/2 -translate-y-1/2 w-1 h-5 rounded-full bg-[var(--glow-text)] shadow-[0_0_10px_var(--glow-color)]" />
                    )}
                  </button>
                  <button
                    onClick={() => handleTabChange("authors")}
                    className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 cursor-pointer relative ${
                      activeTab === "authors" 
                        ? "bg-white text-black shadow-[0_8px_20px_rgba(255,255,255,0.18)]" 
                        : "text-slate-400 hover:text-white hover:bg-white/[0.06]"
                    }`}
                    title="About Us"
                    aria-label="View about and authors"
                    aria-pressed={activeTab === "authors"}
                  >
                    <Users className="w-4 h-4" />
                    {activeTab === "authors" && (
                      <span className="absolute -right-1 top-1/2 -translate-y-1/2 w-1 h-5 rounded-full bg-[var(--glow-text)] shadow-[0_0_10px_var(--glow-color)]" />
                    )}
                  </button>
                  <button
                    onClick={() => handleTabChange("saved")}
                    className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 cursor-pointer relative ${
                      activeTab === "saved" 
                        ? "bg-white text-black shadow-[0_8px_20px_rgba(255,255,255,0.18)]" 
                        : "text-slate-400 hover:text-white hover:bg-white/[0.06]"
                    }`}
                    title="Saved"
                    aria-label="View saved stories"
                    aria-pressed={activeTab === "saved"}
                  >
                    <Bookmark className="w-4 h-4" />
                    {activeTab === "saved" && (
                      <span className="absolute -right-1 top-1/2 -translate-y-1/2 w-1 h-5 rounded-full bg-[var(--glow-text)] shadow-[0_0_10px_var(--glow-color)]" />
                    )}
                    {savedSlugs.length > 0 && (
                      <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[var(--glow-text)] text-[9px] font-bold text-black font-mono shadow-[0_0_8px_var(--glow-color)]">
                        {savedSlugs.length}
                      </span>
                    )}
                  </button>
                </nav>
              </div>

              <div className="flex flex-col items-center gap-1 w-full">
                <div className="w-8 h-px bg-white/10 my-1" />
                <a
                  href="https://medium.com/the-ink-home"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/[0.06] transition-all"
                  title="Medium"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </header>

             {/* Skip to content for accessibility */}
             <a href="#main-content" className="skip-link">Skip to content</a>

             {/* Mobile hamburger */}
             <button
               onClick={() => {
                 const sheet = document.getElementById('mobile-nav-sheet');
                 const overlay = document.getElementById('mobile-nav-overlay');
                 sheet?.classList.toggle('translate-y-full');
                 overlay?.classList.toggle('opacity-0');
                 overlay?.classList.toggle('pointer-events-none');
               }}
               className="md:hidden fixed top-4 left-4 z-40 w-11 h-11 rounded-xl bg-black/70 border border-white/10 backdrop-blur-xl flex items-center justify-center text-slate-200"
               aria-label="Open menu"
               id="mobile-hamburger-btn"
             >
               <Menu className="w-5 h-5" />
             </button>

             {/* Mobile nav overlay */}
             <div
               id="mobile-nav-overlay"
               onClick={() => {
                 document.getElementById('mobile-nav-sheet')?.classList.add('translate-y-full');
                 document.getElementById('mobile-nav-overlay')?.classList.add('opacity-0', 'pointer-events-none');
               }}
               className="md:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm opacity-0 pointer-events-none transition-opacity duration-300"
             />

             {/* Mobile nav sheet */}
             <div
               id="mobile-nav-sheet"
               className="md:hidden fixed inset-x-0 bottom-0 translate-y-full z-50 transition-transform duration-300 ease-out"
             >
               <div className="mx-4 mb-4 rounded-2xl border border-white/10 bg-black/90 backdrop-blur-xl p-4 shadow-2xl">
                 <div className="grid grid-cols-3 gap-3">
                   <button
                     onClick={() => { handleTabChange("3d"); document.getElementById('mobile-nav-sheet')?.classList.add('translate-y-full'); document.getElementById('mobile-nav-overlay')?.classList.add('opacity-0', 'pointer-events-none'); }}
                     className="flex flex-col items-center gap-2 p-3 rounded-xl border border-white/5 bg-white/[0.02] text-slate-200"
                   >
                     <Compass className="w-5 h-5 text-[var(--atmo-text)]" />
                     <span className="text-[10px] font-mono uppercase tracking-wider">3D</span>
                   </button>
                   <button
                     onClick={() => { handleTabChange("grid"); document.getElementById('mobile-nav-sheet')?.classList.add('translate-y-full'); document.getElementById('mobile-nav-overlay')?.classList.add('opacity-0', 'pointer-events-none'); }}
                     className="flex flex-col items-center gap-2 p-3 rounded-xl border border-white/5 bg-white/[0.02] text-slate-200"
                   >
                     <LayoutGrid className="w-5 h-5 text-[var(--atmo-text)]" />
                     <span className="text-[10px] font-mono uppercase tracking-wider">Grid</span>
                   </button>
                   <button
                     onClick={() => { handleTabChange("list"); document.getElementById('mobile-nav-sheet')?.classList.add('translate-y-full'); document.getElementById('mobile-nav-overlay')?.classList.add('opacity-0', 'pointer-events-none'); }}
                     className="flex flex-col items-center gap-2 p-3 rounded-xl border border-white/5 bg-white/[0.02] text-slate-200"
                   >
                     <AlignLeft className="w-5 h-5 text-[var(--atmo-text)]" />
                     <span className="text-[10px] font-mono uppercase tracking-wider">List</span>
                   </button>
                   <button
                     onClick={() => { handleTabChange("guideline"); document.getElementById('mobile-nav-sheet')?.classList.add('translate-y-full'); document.getElementById('mobile-nav-overlay')?.classList.add('opacity-0', 'pointer-events-none'); }}
                     className="flex flex-col items-center gap-2 p-3 rounded-xl border border-white/5 bg-white/[0.02] text-slate-200"
                   >
                     <Feather className="w-5 h-5 text-[var(--atmo-text)]" />
                     <span className="text-[10px] font-mono uppercase tracking-wider">Write</span>
                   </button>
                   <button
                     onClick={() => { handleTabChange("authors"); document.getElementById('mobile-nav-sheet')?.classList.add('translate-y-full'); document.getElementById('mobile-nav-overlay')?.classList.add('opacity-0', 'pointer-events-none'); }}
                     className="flex flex-col items-center gap-2 p-3 rounded-xl border border-white/5 bg-white/[0.02] text-slate-200"
                   >
                     <Users className="w-5 h-5 text-[var(--atmo-text)]" />
                     <span className="text-[10px] font-mono uppercase tracking-wider">About</span>
                   </button>
                   <button
                     onClick={() => { handleTabChange("saved"); document.getElementById('mobile-nav-sheet')?.classList.add('translate-y-full'); document.getElementById('mobile-nav-overlay')?.classList.add('opacity-0', 'pointer-events-none'); }}
                     className="flex flex-col items-center gap-2 p-3 rounded-xl border border-white/5 bg-white/[0.02] text-slate-200 relative"
                   >
                     <Bookmark className="w-5 h-5 text-[var(--atmo-text)]" />
                     <span className="text-[10px] font-mono uppercase tracking-wider">Saved</span>
                     {savedSlugs.length > 0 && (
                       <span className="absolute top-2 right-2 flex h-3 w-3 items-center justify-center rounded-full bg-[var(--atmo-text)] text-[8px] font-bold text-black font-mono">
                         {savedSlugs.length}
                       </span>
                     )}
                   </button>
                 </div>
               </div>
             </div>

            {/* Core View Dashboard Body Container */}
            <main className="flex-1 py-8 sm:py-12 md:pl-20 px-4 sm:px-6">
              
              {/* Fetching state feedback loops */}
              {loading ? (
                <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-6">
                  <div className="w-full max-w-4xl space-y-4 px-4">
                    <div className="flex items-center gap-3">
                      <div className="skeleton h-4 w-32 rounded-full" />
                      <div className="skeleton h-4 w-24 rounded-full" />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {[0,1,2,3,4,5].map((i) => (
                        <div key={i} className="space-y-3 p-4 border border-white/5 bg-black/20">
                          <div className="skeleton h-32 w-full rounded-none" />
                          <div className="space-y-2">
                            <div className="skeleton h-4 w-3/4 rounded-none" />
                            <div className="skeleton h-3 w-1/2 rounded-none" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="cinematic-progress w-full max-w-4xl" />
                </div>
              ) : error && stories.length === 0 ? (
                <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-3 p-8 border border-red-500/20 bg-red-950/10 rounded-none max-w-lg mx-auto">
                  <p className="text-sm font-semibold text-red-400 font-sans">Satellite link offline.</p>
                  <p className="text-xs text-slate-400 text-center leading-relaxed">
                    {error}. Reconnecting to fallback network coordinates.
                  </p>
                  <button
                    onClick={() => window.location.reload()}
                    className="mt-2 px-6 py-2.5 font-mono text-[10px] uppercase tracking-widest bg-[var(--atmo-text)] text-black font-extrabold"
                  >
                    Retry Portal Sync
                  </button>
                </div>
              ) : (
                <div className="space-y-16">
                  
                  {/* Dynamic Heading per tab */}
                  <div className="text-center md:pb-6 space-y-2">
                    {activeTab === "3d" && (
                      <>
                        <h2 className="font-sans font-bold text-3xl md:text-5xl text-white tracking-tight uppercase italic">The Volumetric <span className="text-[var(--atmo-text)]">Universe</span></h2>
                        <p className="text-xs text-slate-400 font-mono tracking-[0.25em] uppercase">ROUTING AND ALIGNING THE COGNITIVE MATRIX IN IMMERSIVE SPACE</p>
                      </>
                    )}
                    {activeTab === "grid" && (
                      <>
                        <h2 className="font-sans font-bold text-3xl md:text-5xl text-white tracking-tight uppercase italic">The Bento <span className="text-[var(--atmo-text)]">Archive</span></h2>
                        <p className="text-xs text-slate-400 font-mono tracking-[0.25em] uppercase">HIGH CAPACITY CELLS STRUCTURED FOR SPEED SENSORY CARDS</p>
                      </>
                    )}
                    {activeTab === "list" && (
                      <>
                        <h2 className="font-sans font-bold text-3xl md:text-5xl text-white tracking-tight uppercase italic">The Narrative <span className="text-[var(--atmo-text)]">Ledger</span></h2>
                        <p className="text-xs text-slate-400 font-mono tracking-[0.25em] uppercase">MINIMALIST CHRONOLOGICAL INDEX SHIFTED FOR METADATA SCANNING</p>
                      </>
                    )}
                    {activeTab === "guideline" && (
                      <>
                        <h2 className="font-sans font-bold text-3xl md:text-5xl text-white tracking-tight uppercase italic">Submission <span className="text-[var(--atmo-text)]">Guidelines</span></h2>
                        <p className="text-xs text-slate-400 font-mono tracking-[0.25em] uppercase">YOUR VOICE MATTERS HERE. READ BEFORE YOU SUBMIT YOUR STORIES</p>
                      </>
                    )}
                    {activeTab === "authors" && (
                      <>
                        {/* Title inside the authors component itself */}
                      </>
                    )}
                    {activeTab === "saved" && (
                      <>
                        <h2 className="font-sans font-bold text-3xl md:text-5xl text-white tracking-tight uppercase italic">The Saved <span className="text-[var(--atmo-text)]">Archive</span></h2>
                        <p className="text-xs text-slate-400 font-mono tracking-[0.25em] uppercase">YOUR PERSONALLY CURATED COGNITIVE MATRIX COLLECTED FROM THE SPATIAL NODE</p>
                      </>
                    )}
                  </div>

                  {/* Render Tab Views with state transitions */}
                  <div className="min-h-[55vh]" id="tab-viewport">
                    <AnimatePresence mode="wait">
                      {activeTab === "3d" && (
                        <motion.div
                          key="nav-3d"
                          initial={{ opacity: 0, scale: 0.98 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.4 }}
                        >
                          <Suspense fallback={
                            <div className="flex flex-col items-center justify-center min-h-[40vh] space-y-3">
                              <div className="w-8 h-8 border border-[var(--atmo-text)] border-t-transparent rounded-full animate-spin" />
                              <span className="text-[10px] font-mono tracking-wider text-slate-500 uppercase">Constructing 3D Space...</span>
                            </div>
                          }>
                            <Carousel3D 
                              stories={stories} 
                              onSelectStory={handleSelectStory} 
                              likedSlugs={likedSlugs}
                              savedSlugs={savedSlugs}
                              onToggleLike={handleToggleLike}
                              onToggleSave={handleToggleSave}
                            />
                          </Suspense>
                        </motion.div>
                      )}
                      
                       {activeTab === "grid" && (
                         <motion.div
                           key="nav-grid"
                           initial={{ opacity: 0 }}
                           animate={{ opacity: 1 }}
                           exit={{ opacity: 0 }}
                           transition={{ duration: 0.4 }}
                         >
                           <Suspense fallback={
                             <div className="flex flex-col items-center justify-center min-h-[40vh] space-y-3">
                               <div className="w-8 h-8 border border-[var(--atmo-text)] border-t-transparent rounded-full animate-spin" />
                               <span className="text-[10px] font-mono tracking-wider text-slate-500 uppercase">Loading Grid...</span>
                             </div>
                           }>
                             <StoryGrid 
                               stories={stories} 
                               onSelectStory={handleSelectStory} 
                               likedSlugs={likedSlugs}
                               savedSlugs={savedSlugs}
                               onToggleLike={handleToggleLike}
                               onToggleSave={handleToggleSave}
                             />
                           </Suspense>
                         </motion.div>
                       )}

                       {activeTab === "list" && (
                         <motion.div
                           key="nav-list"
                           initial={{ opacity: 0 }}
                           animate={{ opacity: 1 }}
                           exit={{ opacity: 0 }}
                           transition={{ duration: 0.4 }}
                         >
                           <Suspense fallback={
                             <div className="flex flex-col items-center justify-center min-h-[40vh] space-y-3">
                               <div className="w-8 h-8 border border-[var(--atmo-text)] border-t-transparent rounded-full animate-spin" />
                               <span className="text-[10px] font-mono tracking-wider text-slate-500 uppercase">Loading List...</span>
                             </div>
                           }>
                             <StoryList 
                               stories={stories} 
                               onSelectStory={handleSelectStory} 
                               likedSlugs={likedSlugs}
                               savedSlugs={savedSlugs}
                               onToggleLike={handleToggleLike}
                               onToggleSave={handleToggleSave}
                             />
                           </Suspense>
                         </motion.div>
                       )}

                       {activeTab === "guideline" && (
                         <motion.div
                           key="nav-guideline"
                           initial={{ opacity: 0 }}
                           animate={{ opacity: 1 }}
                           exit={{ opacity: 0 }}
                           transition={{ duration: 0.4 }}
                         >
                           <Suspense fallback={
                             <div className="flex flex-col items-center justify-center min-h-[40vh] space-y-3">
                               <div className="w-8 h-8 border border-[var(--atmo-text)] border-t-transparent rounded-full animate-spin" />
                               <span className="text-[10px] font-mono tracking-wider text-slate-500 uppercase">Loading Guidelines...</span>
                             </div>
                           }>
                             <SubmissionGuideline />
                           </Suspense>
                         </motion.div>
                       )}

                       {activeTab === "authors" && (
                         <motion.div
                           key="nav-authors"
                           initial={{ opacity: 0 }}
                           animate={{ opacity: 1 }}
                           exit={{ opacity: 0 }}
                           transition={{ duration: 0.4 }}
                         >
                           <Suspense fallback={
                             <div className="flex flex-col items-center justify-center min-h-[40vh] space-y-3">
                               <div className="w-8 h-8 border border-[var(--atmo-text)] border-t-transparent rounded-full animate-spin" />
                               <span className="text-[10px] font-mono tracking-wider text-slate-500 uppercase">Loading Authors...</span>
                             </div>
                           }>
                             <AuthorsSection stories={stories} onSelectStory={handleSelectStory} editors={editors} writers={writers} aboutInfo={aboutInfo} />
                           </Suspense>
                         </motion.div>
                       )}

                      {activeTab === "saved" && (
                        <motion.div
                          key="nav-saved"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.4 }}
                        >
                           {stories.filter(s => savedSlugs.includes(s.slug)).length === 0 ? (
                             <div className="flex flex-col items-center justify-center min-h-[300px] border border-white/10 bg-[#0c0c0c]/80 p-8 text-center max-w-xl mx-auto space-y-4">
                               <Bookmark className="w-8 h-8 text-slate-600" />
                               <p className="font-mono text-xs uppercase tracking-widest text-slate-400">Your Archive is Empty</p>
                               <p className="text-xs text-slate-500 leading-relaxed font-light">
                                 Connect to the 3D Universe or Bento Grid, find stories that challenge your cognitive horizons, and click their save trigger to register them here.
                               </p>
                               <button
                                 onClick={() => handleTabChange("3d")}
                                 className="px-5 py-2 border border-[var(--atmo-border)] text-[var(--atmo-text)] hover:bg-[var(--atmo-text)] hover:text-black font-mono text-[10px] uppercase tracking-widest transition-colors font-bold cursor-pointer"
                               >
                                 Explore Cosmos
                               </button>
                             </div>
                           ) : (
                             <Suspense fallback={
                               <div className="flex flex-col items-center justify-center min-h-[40vh] space-y-3">
                                 <div className="w-8 h-8 border border-[var(--atmo-text)] border-t-transparent rounded-full animate-spin" />
                                 <span className="text-[10px] font-mono tracking-wider text-slate-500 uppercase">Loading...</span>
                               </div>
                             }>
                               <StoryGrid 
                                 stories={stories.filter(s => savedSlugs.includes(s.slug))} 
                                 onSelectStory={handleSelectStory}
                                 likedSlugs={likedSlugs}
                                 savedSlugs={savedSlugs}
                                 onToggleLike={handleToggleLike}
                                 onToggleSave={handleToggleSave}
                               />
                             </Suspense>
                           )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Interactive Dynamic Footnote - Show stats in visual dashboard footer */}
                  {activeTab !== "authors" && activeTab !== "guideline" && (
                    <div className="w-full max-w-6xl mx-auto border-t border-white/10 pt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                      {/* Section 1 */}
                      <div className="space-y-2 border-l-2 border-[var(--atmo-border)] pl-4">
                        <h4 className="text-[11px] font-mono uppercase tracking-[0.2em] text-[var(--atmo-text)]">TELEMETRY SOURCES</h4>
                        <p className="text-xs text-slate-400 font-light">
                          Stories ingested automatically from `https://medium.com/the-ink-home` via background parsing array.
                        </p>
                      </div>
                      
                      {/* Section 2 */}
                      <div className="space-y-2 border-l-2 border-slate-700 pl-4">
                        <h4 className="text-[11px] font-mono uppercase tracking-[0.2em] text-white">NODE RECEPTOR</h4>
                        <p className="text-xs text-slate-400 flex items-center gap-1.5 font-light">
                          <span className="w-1.5 h-1.5 rounded-full bg-[var(--atmo-text)]" />
                          Online / Synced dynamically
                        </p>
                      </div>

                      {/* Section 3 */}
                      <div className="space-y-2 border-l-2 border-slate-700 pl-4">
                        <h4 className="text-[11px] font-mono uppercase tracking-[0.2em] text-white">CATALOG STATUS</h4>
                        <p className="text-xs text-slate-400 font-light">
                          {stories.length} interactive stories floating in coordinates. {new Set(stories.map(s => s.author)).size} accredited editors.
                        </p>
                      </div>

                      {/* Section 4 */}
                      <div className="space-y-2 border-l-2 border-slate-700 pl-4">
                        <h4 className="text-[11px] font-mono uppercase tracking-[0.2em] text-[var(--atmo-text)]">WebGL MATRIX</h4>
                        <p className="text-xs text-slate-400 font-light">
                          Designed with custom constellations for spatial immersion. Read full layouts via Medium native links.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Dynamic full-width Editorial Board view below standard carousel/grid/list layouts to enrich experience */}
                  {activeTab !== "authors" && activeTab !== "guideline" && (
                    <div className="pt-8 pb-12 border-t border-white/10">
                      <AuthorsSection stories={stories} onSelectStory={handleSelectStory} editors={editors} writers={writers} aboutInfo={aboutInfo} />
                    </div>
                  )}

                </div>
              )}

            </main>

            {/* General Site Footer */}
            <footer className="w-full border-t border-white/10 bg-[#070707] pt-12 sm:pt-16 pb-24 sm:pb-16 md:pb-16 flex flex-col items-center justify-center space-y-3 text-center text-[10px] text-slate-500 font-mono uppercase tracking-[0.2em] mt-8 sm:mt-12">
              <Logo size={48} iconOnly className="opacity-80 hover:opacity-100 transition-opacity" />
              <div className="space-y-1">
                <span className="block text-slate-400">The Ink Home © 2026</span>
                <span>Visualizing dynamic literature in multi-dimensional cosmos</span>
              </div>
            </footer>

          </motion.div>
        )}
      </AnimatePresence>

      {/* Volumetric Story Modal Popup */}
      <Suspense fallback={null}>
        <StoryModal
          story={selectedStory}
          stories={stories}
          onClose={() => handleSelectStory(null)}
          onSelectStory={handleSelectStory}
          onContribute={() => {
            handleTabChange("guideline");
            handleSelectStory(null);
          }}
          isLiked={selectedStory ? likedSlugs.includes(selectedStory.slug) : false}
          isSaved={selectedStory ? savedSlugs.includes(selectedStory.slug) : false}
          onToggleLike={handleToggleLike}
          onToggleSave={handleToggleSave}
        />
      </Suspense>

      <AIAssistant />
      <CommandPalette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        stories={stories}
        onSelectStory={handleSelectStory}
      />
      <AnimatePresence>
        {adminOpen && (
          <AdminDashboard onClose={() => setAdminOpen(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}
