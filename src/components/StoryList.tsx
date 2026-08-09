import { motion } from "motion/react";
import { Story } from "../types";
import { ArrowUpRight, Heart, Bookmark } from "lucide-react";
import { getLikesCount } from "../lib/interaction";
import AvatarImage from "./AvatarImage";

interface StoryListProps {
  stories: Story[];
  onSelectStory: (story: Story) => void;
  likedSlugs: string[];
  savedSlugs: string[];
  onToggleLike: (slug: string) => void;
  onToggleSave: (slug: string) => void;
}

export default function StoryList({ 
  stories, 
  onSelectStory,
  likedSlugs,
  savedSlugs,
  onToggleLike,
  onToggleSave
}: StoryListProps) {
  if (stories.length === 0) {
    return (
      <div className="flex justify-center py-12 text-slate-500 font-mono text-xs uppercase" id="story-list-empty">
        Publication index is empty
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-4" id="story-list-root">
      <div className="border-t border-b border-white/5 divide-y divide-white/5 bg-[#0b0b0d]/20 backdrop-blur-sm">
        {stories.map((story, index) => (
          <motion.div
            key={story.slug}
            className="group cursor-pointer py-4 px-3 flex flex-col md:flex-row md:items-center justify-between gap-3 transition-all duration-300 border-l-2 border-transparent hover:border-[var(--atmo-text)] hover:bg-gradient-to-r hover:from-[var(--atmo-text)]/10 hover:to-transparent hover:pl-4 rounded-none [content-visibility:auto] [contain-intrinsic-size:auto_5rem]"
            onClick={() => onSelectStory(story)}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: index * 0.04 }}
            id={`list-item-${story.slug}`}
          >
            {/* Left Column: Date & Tech Metadata */}
            <div className="flex items-center gap-2 sm:gap-4 min-w-0">
              <span className="font-mono text-[10px] sm:text-xs text-slate-500 whitespace-nowrap">
                {new Date(story.pubDate).toLocaleDateString("en-US", {
                  month: "2-digit",
                  day: "2-digit",
                  year: "2-digit",
                })}
              </span>
              <span className="inline px-1.5 py-0.5 rounded-none font-mono text-[8px] sm:text-[9px] uppercase tracking-widest bg-black/80 text-[var(--atmo-text)] border border-[var(--atmo-border)]">
                {story.categories[0] || "INDEX"}
              </span>
            </div>

            {/* Middle Column: Title & Creator details */}
            <div className="flex-1 md:px-2 sm:md:px-4 min-w-0">
              <h4 className="font-sans font-medium text-white text-sm sm:text-base group-hover:text-[var(--atmo-text)] transition-all duration-300 line-clamp-1">
                {story.title}
              </h4>
              <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5 sm:mt-1 line-clamp-1 font-light">
                {story.description}
              </p>
            </div>

            {/* Right Column: Author Name & Interaction indicator */}
            <div className="flex items-center justify-between md:justify-end gap-3 sm:gap-4 md:gap-6 md:min-w-[180px] sm:md:min-w-[200px]">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <AvatarImage 
                  src={story.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde"} 
                  alt={story.author} 
                  className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-none object-cover border border-white/5" 
                />
                <span className="font-mono text-[10px] sm:text-[11px] text-slate-400 hidden sm:inline">
                  {story.author}
                </span>
              </div>
               
              {/* Quick toolbar toggles */}
              <div className="flex items-center gap-2 sm:gap-3 z-20">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleLike(story.slug);
                  }}
                  className={`flex items-center gap-1 transition-colors p-1.5 cursor-pointer hover:text-[var(--atmo-text)] min-w-[28px] min-h-[28px] justify-center ${
                    likedSlugs.includes(story.slug) ? "text-[var(--atmo-text)] font-bold" : "text-slate-500"
                  }`}
                  title={likedSlugs.includes(story.slug) ? "Unlike" : "Like"}
                >
                  <Heart className={`w-3.5 h-3.5 ${likedSlugs.includes(story.slug) ? "fill-current text-[var(--atmo-text)]" : ""}`} />
                  <span className="text-[10px] hidden sm:inline">{getLikesCount(story.title, likedSlugs.includes(story.slug))}</span>
                </button>
                
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleSave(story.slug);
                  }}
                  className={`flex items-center gap-1 transition-colors p-1.5 cursor-pointer hover:text-[var(--atmo-text)] min-w-[28px] min-h-[28px] justify-center ${
                    savedSlugs.includes(story.slug) ? "text-[var(--atmo-text)]" : "text-slate-500"
                  }`}
                  title={savedSlugs.includes(story.slug) ? "Remove Bookmark" : "Bookmark Story"}
                >
                  <Bookmark className={`w-3.5 h-3.5 ${savedSlugs.includes(story.slug) ? "fill-current" : ""}`} />
                </button>
              </div>

              <span className="flex items-center gap-1 font-mono text-[10px] sm:text-[11px] uppercase tracking-[0.15em] text-[var(--atmo-text)] group-hover:text-white transition-colors">
                Read
                <ArrowUpRight className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[var(--atmo-text)]" />
              </span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
