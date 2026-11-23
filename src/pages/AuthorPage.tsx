import React from "react";
import { ArrowLeft, ArrowUpRight, BookOpen } from "lucide-react";
import { Story } from "../types";
import { formatDate, readingTime, stripHtml } from "../lib/format";
import { StoryCard } from "../components/StoryCard";
import { EmptyState } from "../components/ui/States";
import AuthorAvatar from "../components/AuthorAvatar";

interface Person {
  name: string;
  role?: string;
  bio?: string;
  avatar?: string;
  mediumUrl?: string;
  followers?: number;
}

interface AuthorPageProps {
  person: Person | null;
  stories: Story[];
  onBack: () => void;
  onOpen: (story: Story) => void;
}

export default function AuthorPage({ person, stories, onBack, onOpen }: AuthorPageProps) {
  const name = person?.name || "";

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

          {person ? (
            <div className="mb-16 flex flex-col gap-8 sm:flex-row sm:items-end sm:justify-between">
              <div className="flex items-center gap-5">
                <AuthorAvatar name={person.name} src={person.avatar} className="h-16 w-16 rounded-full text-[16px] sm:h-20 sm:w-20" />
                <div>
                  <div className="font-mono text-[9px] uppercase tracking-[0.24em] text-[#c8ff4d]">
                    {person.role ? `${person.role} · ` : ""}Author
                  </div>
                  <h1 className="mt-2 font-display text-4xl font-black tracking-[-0.03em] text-white sm:text-5xl">
                    {person.name}
                  </h1>
                  {typeof person.followers === "number" && (
                    <p className="mt-2 font-mono text-[9px] uppercase tracking-[0.16em] text-white/40">
                      {person.followers.toLocaleString()} followers on Medium
                    </p>
                  )}
                  {person.bio && <p className="mt-3 max-w-xl text-[14px] leading-relaxed text-white/55">{person.bio}</p>}
                </div>
              </div>
              {person.mediumUrl ? (
                <a
                  href={person.mediumUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-[11px] font-bold uppercase tracking-[0.16em] text-black transition-colors hover:bg-[#c8ff4d]"
                >
                  View on Medium <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                </a>
              ) : null}
            </div>
          ) : (
            <div className="mb-16">
              <div className="font-mono text-[10px] uppercase tracking-[0.24em] text-[#c8ff4d]">The Ink Home</div>
              <h1 className="mt-2 font-display text-4xl font-black tracking-[-0.03em] text-white sm:text-5xl">Author</h1>
            </div>
          )}

          {stories.length > 0 ? (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {stories.map((story, index) => (
                <div key={story.slug} className="h-full">
                  <StoryCard story={story} onOpen={onOpen} />
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="No stories yet" message="This writer has not published to The Ink Home yet." onAction={onBack} />
          )}
        </div>
      </div>
    </section>
  );
}
