import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "../lib/motion";
import { Story, Author } from "../types";
import { User, Users, Feather, Info, BookOpen, ExternalLink, Globe } from "lucide-react";
import AvatarImage from "./AvatarImage";

export interface ScrapingScribe {
  name: string;
  username: string;
  role: string;
  bio: string;
  avatar: string;
  followers?: number;
  mediumUrl?: string;
}

interface AuthorsSectionProps {
  stories: Story[];
  onSelectStory: (story: Story) => void;
  editors?: ScrapingScribe[];
  writers?: ScrapingScribe[];
  aboutInfo?: {
    description: string;
    officialWebsite: string;
  };
}

export default function AuthorsSection({ 
  stories, 
  onSelectStory, 
  editors = [], 
  writers = [],
  aboutInfo
}: AuthorsSectionProps) {
  const [selectedAuthor, setSelectedAuthor] = useState<Author | null>(null);

  // Default fallback values if props are not yet loaded
  const pubDescription = aboutInfo?.description || "The Ink Home is a place where words feel at home. Here, we share stories that explore life, writing, technology, productivity, relationships and mental health. Every piece is a reflection, a lesson, or a moment meant to inspire, connect, and spark thought.";
  const pubWebsite = aboutInfo?.officialWebsite || "https://theinkhome.live/";

  // 1. Map Editors strictly from props list
  const finalEditors = useMemo(() => {
    return editors.map((scribe) => {
      const matchedStories = stories.filter(
        (story) => story.author && story.author.toLowerCase().trim() === scribe.name.toLowerCase().trim()
      );
      return {
        name: scribe.name,
        role: scribe.role || "Editor",
        avatar: scribe.avatar,
        storyCount: matchedStories.length,
        stories: matchedStories,
        username: scribe.username,
        bio: scribe.bio,
        followers: scribe.followers,
        mediumUrl: scribe.mediumUrl || `https://medium.com/@${scribe.username}`
      };
    });
  }, [stories, editors]);

  // 2. Map Writers strictly from props list
  const finalWriters = useMemo(() => {
    return writers.map((scribe) => {
      const matchedStories = stories.filter(
        (story) => story.author && story.author.toLowerCase().trim() === scribe.name.toLowerCase().trim()
      );
      return {
        name: scribe.name,
        role: scribe.role || "Contributing Writer",
        avatar: scribe.avatar,
        storyCount: matchedStories.length,
        stories: matchedStories,
        username: scribe.username,
        bio: scribe.bio,
        followers: scribe.followers,
        mediumUrl: scribe.mediumUrl || `https://medium.com/@${scribe.username}`
      };
    });
  }, [stories, writers]);

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-12 sm:space-y-16 lg:space-y-20 text-white" id="about-page-root">
      
      {/* 1. CINEMATIC LANDING HERO */}
      <section className="relative overflow-hidden border border-white/10 bg-black/60 backdrop-blur-md p-6 sm:p-8 md:p-12 lg:p-16 rounded-none space-y-6 sm:space-y-8 shadow-[0_0_50px_rgba(34,211,238,0.05)]">
        <div className="absolute top-0 left-0 w-1.5 h-full bg-[var(--atmo-text)]" />
        <div className="absolute top-0 right-0 p-4 font-mono text-[9px] text-[var(--atmo-text)]/40 uppercase tracking-[0.2em] hidden sm:block">
          MASTHEAD COORDINATES: 0x22D3EE
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-5 space-y-4">
            <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-[var(--atmo-text)] block">
              Digital Publication
            </span>
            <h1 className="font-sans font-black text-4xl sm:text-5xl md:text-6xl tracking-tighter uppercase italic leading-none text-white">
              The Ink <span className="text-[var(--atmo-text)]">Home</span>
            </h1>
            <p className="font-mono text-xs text-slate-500 uppercase tracking-widest leading-relaxed">
              Where words feel at home.
            </p>
          </div>

          <div className="lg:col-span-1 border-t lg:border-t-0 lg:border-l border-white/10 lg:h-32 my-2" />

          <div className="lg:col-span-6 space-y-6">
            <p className="text-base md:text-lg text-slate-300 font-light leading-relaxed tracking-wide italic">
              “{pubDescription}”
            </p>
            
            <div className="pt-2">
              <a 
                href={pubWebsite}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 border border-[var(--atmo-border)] text-[var(--atmo-text)] bg-[var(--atmo-surface)] hover:bg-[var(--atmo-text)] hover:text-black font-mono text-xs uppercase tracking-widest transition-all duration-300 font-extrabold"
              >
                <Globe className="w-4 h-4" />
                Official Website
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* 2. EDITORS SECTION */}
      <section className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-white/10 pb-4">
          <div className="space-y-1">
            <h2 className="font-sans font-bold text-2xl uppercase tracking-tight text-white flex items-center gap-3">
              <User className="w-6 h-6 text-[var(--atmo-text)]" />
              Editorial Board
            </h2>
            <p className="font-mono text-[10px] text-slate-400 uppercase tracking-widest">
              Reviewers overseeing curatorial coherence and standards of literature
            </p>
          </div>
          <span className="font-mono text-xs text-[var(--atmo-text)] uppercase tracking-wider mt-2 md:mt-0">
            {finalEditors.length} accredited editor{finalEditors.length === 1 ? "" : "s"}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {finalEditors.map((editor) => {
            const isSelected = selectedAuthor?.name === editor.name;
            return (
              <motion.div
                key={editor.name}
                layout
                whileHover={{ 
                  y: -6, 
                  scale: 1.02, 
                  borderColor: "rgba(34, 211, 238, 0.4)",
                  boxShadow: "0 20px 40px rgba(34, 211, 238, 0.12)"
                }}
                transition={{ duration: 0.3, ease: [0.25, 1, 0.5, 1] }}
                 className={`relative p-4 sm:p-6 md:p-8 border bg-black/80 backdrop-blur-md flex flex-col justify-between transition-colors duration-300 ${
                   isSelected 
                      ? "border-[var(--atmo-text)] shadow-[0_0_30px_var(--atmo-glow)]"
                     : "border-white/10 bg-black/80"
                 }`}
               >
                {/* Visual badge for dynamic loading synchronization */}
                <div className="absolute top-0 right-0 p-4 flex gap-2">
                  {editor.followers && (
                    <span className="px-2.5 py-0.5 font-mono text-[9px] bg-[var(--atmo-surface)] text-[var(--atmo-text)] border border-[var(--atmo-border)] uppercase tracking-widest">
                      {editor.followers} Followers
                    </span>
                  )}
                </div>

                <div className="space-y-6">
                  <div className="flex items-center gap-5">
                    <AvatarImage
                      src={editor.avatar}
                      alt={editor.name}
                      className="w-14 h-14 sm:w-20 sm:h-20 rounded-none object-cover border-2 border-[var(--atmo-border)]"
                   />
                    <div>
                      <h3 className="font-sans font-bold text-xl uppercase tracking-wide text-white">
                        {editor.name}
                      </h3>
                      <p className="text-xs font-mono text-[var(--atmo-text)] uppercase tracking-widest mt-1">
                        {editor.role}
                      </p>
                      
                      <div className="flex items-center gap-3 mt-2">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 font-mono text-[9px] bg-white/5 text-slate-300 border border-white/10">
                          <BookOpen className="w-2.5 h-2.5" />
                          {editor.storyCount} active coordination{editor.storyCount === 1 ? "" : "s"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <p className="text-sm text-slate-300 leading-relaxed font-light min-h-[3.5rem]">
                    {editor.bio || "Staff editor guiding multi-dimensional layouts and technical literature of The Ink Home."}
                  </p>
                </div>

                {/* Footer Controls with Interactive Catalog Drawer */}
                <div className="mt-8 pt-4 border-t border-white/10 flex flex-wrap gap-4 items-center justify-between">
                  {editor.mediumUrl ? (
                    <a
                      href={editor.mediumUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] font-mono text-slate-400 hover:text-[var(--atmo-text)] inline-flex items-center gap-1 uppercase tracking-widest transition-colors cursor-pointer"
                    >
                      Medium Profile
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  ) : (
                    <span className="text-[10px] font-mono text-slate-600 uppercase tracking-widest">
                      Medium Accredited
                    </span>
                  )}

                  {editor.storyCount > 0 && (
                    <button
                      onClick={() => setSelectedAuthor(isSelected ? null : editor)}
                      className="text-xs font-mono text-[var(--atmo-text)] hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Info className="w-3.5 h-3.5" />
                      {isSelected ? "Hide Catalog" : "Inspect Stories"}
                    </button>
                  )}
                </div>

                {/* Collapsible Story list */}
                <AnimatePresence>
                  {isSelected && editor.stories && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                      className="mt-6 pt-6 border-t border-white/10 space-y-3 overflow-hidden"
                    >
                      <h4 className="text-[10px] font-mono uppercase tracking-widest text-slate-400">
                        Published In The Ink Home:
                      </h4>
                       <div className="space-y-2 max-h-[120px] sm:max-h-[160px] overflow-y-auto pr-1">
                        {editor.stories.map((story) => (
                          <div
                            key={story.slug}
                            onClick={() => onSelectStory(story)}
                            className="p-3 bg-black border border-white/5 hover:border-[var(--atmo-border)] hover:bg-white/[0.01] transition-all cursor-pointer text-left flex justify-between items-center"
                          >
                            <div>
                              <h5 className="text-[11px] font-medium text-white line-clamp-1">
                                {story.title}
                              </h5>
                              <span className="text-[8px] font-mono text-slate-500 uppercase tracking-widest">
                                {new Date(story.pubDate).toLocaleDateString()}
                              </span>
                            </div>
                            <ExternalLink className="w-3 h-3 text-[var(--atmo-text)]/60" />
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* 3. WRITERS SECTION */}
      <section className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-white/10 pb-4">
          <div className="space-y-1">
            <h2 className="font-sans font-bold text-2xl uppercase tracking-tight text-white flex items-center gap-3">
              <Users className="w-6 h-6 text-[var(--atmo-text)]" />
              Contributing Scribes
            </h2>
            <p className="font-mono text-[10px] text-slate-400 uppercase tracking-widest">
              Digital columnists and creative engineers crafting raw thought vectors
            </p>
          </div>
          <span className="font-mono text-xs text-[var(--atmo-text)] uppercase tracking-wider mt-2 md:mt-0">
            {finalWriters.length} active writers
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {finalWriters.map((writer) => {
            const isSelected = selectedAuthor?.name === writer.name;
            return (
              <motion.div
                key={writer.name}
                layout
                whileHover={{ 
                  y: -6, 
                  scale: 1.02, 
                  borderColor: "rgba(34, 211, 238, 0.3)",
                  boxShadow: "0 15px 30px rgba(34, 211, 238, 0.08)"
                }}
                transition={{ duration: 0.3, ease: [0.25, 1, 0.5, 1] }}
                 className={`p-4 sm:p-5 md:p-6 border bg-black/60 backdrop-blur-md flex flex-col justify-between relative transition-colors duration-300 ${
                   isSelected 
                      ? "border-[var(--atmo-text)] shadow-[0_0_20px_var(--atmo-glow)]"
                     : "border-white/10 bg-black/60"
                 }`}
               >
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                     <AvatarImage
                       src={writer.avatar}
                       alt={writer.name}
                       fallbackSrc=""
                       className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-none object-cover border border-white/10"
                     />
                    <div>
                      <h3 className="font-sans font-semibold text-sm uppercase tracking-wide text-white">
                        {writer.name}
                      </h3>
                      <p className="text-[10px] font-mono text-[var(--atmo-text)] uppercase tracking-widest mt-0.5">
                        {writer.role}
                      </p>
                      <span className="inline-flex items-center gap-1 mt-1 px-1.5 py-0.5 font-mono text-[8px] bg-white/5 text-slate-400 border border-white/10">
                        <Feather className="w-2.5 h-2.5 text-[var(--atmo-text)]" />
                        {writer.storyCount} active piece{writer.storyCount === 1 ? "" : "s"}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-400 leading-relaxed font-light min-h-[4rem]">
                    {writer.bio || "Contributor of original perspective articles on productivity, health and cybernetic culture."}
                  </p>
                </div>

                <div className="mt-5 pt-3 border-t border-white/10 flex items-center justify-between">
                  <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">
                    THE INK CONTRIBUTOR
                  </span>

                  {writer.storyCount > 0 && (
                    <button
                      onClick={() => setSelectedAuthor(isSelected ? null : writer)}
                      className="text-[10px] font-mono text-[var(--atmo-text)] hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Info className="w-3.5 h-3.5" />
                      {isSelected ? "Hide Catalog" : "Inspect Stories"}
                    </button>
                  )}
                </div>

                <AnimatePresence>
                  {isSelected && writer.stories && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                      className="mt-4 pt-4 border-t border-white/10 space-y-2 overflow-hidden"
                    >
                       <div className="space-y-1.5 max-h-[100px] sm:max-h-[120px] overflow-y-auto pr-1">
                        {writer.stories.map((story) => (
                          <div
                            key={story.slug}
                            onClick={() => onSelectStory(story)}
                            className="p-2 bg-black border border-white/5 hover:border-[var(--atmo-border)] hover:bg-white/[0.01] transition-all cursor-pointer text-left flex justify-between items-center"
                          >
                            <span className="text-[10px] font-medium text-slate-300 line-clamp-1">
                              {story.title}
                            </span>
                            <ExternalLink className="w-2.5 h-2.5 text-[var(--atmo-text)]/55" />
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </section>
      
    </div>
  );
}
