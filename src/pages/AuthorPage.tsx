import { ArrowLeft, ArrowUpRight } from "lucide-react";
import type { Story } from "../types";
import { StoryCard } from "../components/StoryCard";
import { EmptyState } from "../components/ui/States";
import AuthorAvatar from "../components/AuthorAvatar";
import type { Person } from "../lib/usePublication";
import { useNavigate } from "../router";

interface AuthorPageProps {
  person: Person | null;
  stories: Story[];
}

export default function AuthorPage({ person, stories }: AuthorPageProps) {
  const navigate = useNavigate();

  return (
    <section className="pb-24 pt-28 sm:pb-32 sm:pt-36">
      <div className="shell">
        <button
          type="button"
          onClick={() => navigate("/writers")}
          className="group mb-10 flex items-center gap-2 text-[13px] text-ink-faint transition-colors hover:text-ink"
        >
          <ArrowLeft
            aria-hidden="true"
            className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5"
          />
          Back to the writers
        </button>

        <header className="border-b border-line pb-10">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-5">
              <AuthorAvatar
                name={person?.name || "Author"}
                src={person?.avatar}
                className="h-20 w-20 text-[20px] sm:h-24 sm:w-24"
              />
              <div className="min-w-0">
                <p className="eyebrow">{person?.role || "Contributor"}</p>
                <h1 className="mt-3 font-display text-[clamp(2rem,5vw,3.25rem)] font-semibold leading-[1.02] tracking-[-0.03em] text-ink">
                  {person?.name || "Author"}
                </h1>
                {typeof person?.followers === "number" && (
                  <p className="mt-2 text-[13px] text-ink-faint">
                    {person.followers.toLocaleString()} followers on Medium
                  </p>
                )}
                {person?.bio && (
                  <p className="mt-4 max-w-[56ch] text-[15px] leading-relaxed text-ink-soft">
                    {person.bio}
                  </p>
                )}
              </div>
            </div>

            {person?.mediumUrl && (
              <a href={person.mediumUrl} target="_blank" rel="noopener noreferrer" className="btn btn-outline shrink-0">
                View on Medium
                <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
              </a>
            )}
          </div>

          <p aria-live="polite" className="mt-6 text-[13px] text-ink-faint">
            {stories.length} {stories.length === 1 ? "story" : "stories"} published in The Ink Home
          </p>
        </header>

        {stories.length > 0 ? (
          <div className="mt-10 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {stories.map((story) => (
              <div key={story.slug} className="h-full">
                <StoryCard story={story} />
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            title="No stories yet"
            message="This writer has not published to The Ink Home yet."
            actionLabel="Back to the writers"
            onAction={() => navigate("/writers")}
          />
        )}
      </div>
    </section>
  );
}
