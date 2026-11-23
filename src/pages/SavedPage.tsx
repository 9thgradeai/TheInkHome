import React from "react";
import { ArrowLeft, Bookmark } from "lucide-react";
import { Story } from "../types";
import { StoryCard } from "../components/StoryCard";
import { EmptyState } from "../components/ui/States";

interface SavedPageProps {
  stories: Story[];
  onBack: () => void;
  onOpen: (story: Story) => void;
}

export default function SavedPage({ stories, onBack, onOpen }: SavedPageProps) {
  return (
    <section className="min-h-screen bg-[#08080a] text-white">
      <div className="px-4 pb-32 pt-28 sm:px-8 sm:pt-36">
        <div className="mx-auto max-w-7xl">
          <button
            type="button"
            onClick={onBack}
            className="mb-10 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-white/40 transition-colors hover:text-white"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" /> Back to the publication
          </button>

          <div className="mb-14">
            <div className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.24em] text-[#c8ff4d]">
              <Bookmark className="h-3 w-3" aria-hidden="true" /> Your reading list
            </div>
            <h1 className="mt-4 max-w-2xl font-display text-4xl font-black tracking-[-0.03em] text-white sm:text-6xl">
              Saved stories.
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-white/65">
              Everything you marked for later, kept in sync with this device.
            </p>
          </div>

          {stories.length > 0 ? (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {stories.map((story) => (
                <div key={story.slug} className="h-full">
                  <StoryCard story={story} onOpen={onOpen} />
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              title="Nothing saved yet"
              message="Tap Save on any story and it will land here."
              actionLabel="Browse stories"
              onAction={onBack}
            />
          )}
        </div>
      </div>
    </section>
  );
}
