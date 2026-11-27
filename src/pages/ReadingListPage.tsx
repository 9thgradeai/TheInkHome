import { useState } from "react";
import { ArrowLeft, Bookmark, Heart } from "lucide-react";
import type { Story } from "../types";
import { StoryCard } from "../components/StoryCard";
import { EmptyState } from "../components/ui/States";
import { useNavigate } from "../router";

interface ReadingListPageProps {
  saved: Story[];
  liked: Story[];
}

type Tab = "saved" | "liked";

const TABS: { id: Tab; label: string; icon: typeof Bookmark }[] = [
  { id: "saved", label: "Saved for later", icon: Bookmark },
  { id: "liked", label: "Liked", icon: Heart },
];

/** The reader's own shelf: bookmarks and appreciations, kept on this device. */
export default function ReadingListPage({ saved, liked }: ReadingListPageProps) {
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("saved");
  const stories = tab === "saved" ? saved : liked;

  return (
    <section className="pb-24 pt-28 sm:pb-32 sm:pt-36">
      <div className="shell">
        <button
          type="button"
          onClick={() => navigate("/")}
          className="group mb-10 flex items-center gap-2 text-[13px] text-ink-faint transition-colors hover:text-ink"
        >
          <ArrowLeft
            aria-hidden="true"
            className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5"
          />
          Back to the publication
        </button>

        <header className="border-b border-line pb-6">
          <p className="eyebrow">
            <Bookmark className="h-3.5 w-3.5" aria-hidden="true" /> Your reading list
          </p>
          <h1 className="mt-4 max-w-[16ch] font-display text-[clamp(2.25rem,5.5vw,3.75rem)] font-semibold leading-[1] tracking-[-0.035em] text-ink">
            Kept on this device.
          </h1>
          <p className="mt-4 max-w-[52ch] text-[15.5px] leading-relaxed text-ink-soft">
            Bookmarks and appreciations live in your browser only — nothing is uploaded, and clearing
            site data removes them.
          </p>
        </header>

        <div role="tablist" aria-label="Reading list" className="flex gap-2 py-5">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={tab === id}
              onClick={() => setTab(id)}
              className="chip"
              aria-pressed={tab === id}
            >
              <Icon className="h-3.5 w-3.5" aria-hidden="true" />
              {label}
              <span className="tabular-nums opacity-70">{id === "saved" ? saved.length : liked.length}</span>
            </button>
          ))}
        </div>

        {stories.length > 0 ? (
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {stories.map((story) => (
              <div key={story.slug} className="h-full">
                <StoryCard story={story} />
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            title={tab === "saved" ? "Nothing saved yet" : "Nothing liked yet"}
            message={
              tab === "saved"
                ? "Open any story and press Save — it will wait for you here."
                : "Open any story and press Like to keep a record of what moved you."
            }
            actionLabel="Browse stories"
            onAction={() => navigate("/stories")}
          />
        )}
      </div>
    </section>
  );
}
