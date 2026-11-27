import { useMemo, useState } from "react";
import { Users } from "lucide-react";
import AuthorAvatar from "../components/AuthorAvatar";
import { writerSlug } from "../components/home/WritersSection";
import Reveal from "../components/ui/Reveal";
import type { Story } from "../types";
import type { Person } from "../lib/usePublication";
import { useNavigate } from "../router";

interface WritersPageProps {
  editors: Person[];
  writers: (Person & { count: number })[];
  stories: Story[];
}

export default function WritersPage({ editors, writers, stories }: WritersPageProps) {
  const navigate = useNavigate();
  const [showAll, setShowAll] = useState(false);

  const editorRows = useMemo(
    () =>
      editors.map((editor) => ({
        ...editor,
        count: stories.filter(
          (story) => story.author.toLowerCase() === editor.name.toLowerCase(),
        ).length,
      })),
    [editors, stories],
  );

  const visible = showAll ? writers : writers.slice(0, 24);

  return (
    <section className="pb-24 pt-28 sm:pb-32 sm:pt-36">
      <div className="shell">
        <header className="border-b border-line pb-8">
          <p className="eyebrow">
            <Users className="h-3.5 w-3.5" aria-hidden="true" /> The writers
          </p>
          <div className="mt-4 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="max-w-[16ch] font-display text-[clamp(2.25rem,5.5vw,3.75rem)] font-semibold leading-[1] tracking-[-0.035em] text-ink">
                Every voice in the room.
              </h1>
              <p className="mt-4 max-w-[52ch] text-[15.5px] leading-relaxed text-ink-soft">
                Essayists, researchers, engineers and storytellers who keep the archive alive. Select a
                writer to see everything they have published here.
              </p>
            </div>
            <p aria-live="polite" className="shrink-0 text-[13px] text-ink-faint">
              {editors.length + writers.length} contributors
            </p>
          </div>
        </header>

        {editorRows.length > 0 && (
          <div className="mt-10">
            <h2 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-faint">
              Editorial desk
            </h2>
            <ul className="mt-4 grid gap-x-10 border-t border-line md:grid-cols-2">
              {editorRows.map((editor, index) => (
                <li key={editor.name} className="border-b border-line">
                  <Reveal delay={index * 0.04}>
                    <button
                      type="button"
                      onClick={() => navigate(`/writer/${writerSlug(editor.name)}`)}
                      className="group flex w-full items-start gap-4 py-6 text-left"
                    >
                      <AuthorAvatar
                        name={editor.name}
                        src={editor.avatar}
                        className="h-14 w-14 text-[15px]"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block font-display text-[1.25rem] font-semibold leading-snug text-ink decoration-accent underline-offset-4 group-hover:underline">
                          {editor.name}
                        </span>
                        <span className="mt-1 block text-[13px] text-accent-ink">{editor.role}</span>
                        {editor.bio && (
                          <span className="mt-2 block text-[13.5px] leading-relaxed text-ink-soft line-clamp-3">
                            {editor.bio}
                          </span>
                        )}
                        <span className="mt-2.5 block text-[12px] text-ink-faint">
                          {editor.count} {editor.count === 1 ? "story" : "stories"}
                          {typeof editor.followers === "number"
                            ? ` · ${editor.followers.toLocaleString()} followers on Medium`
                            : ""}
                        </span>
                      </span>
                    </button>
                  </Reveal>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-14">
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-faint">
            Contributing writers
          </h2>
          <ul className="mt-4 grid gap-x-10 border-t border-line sm:grid-cols-2">
            {visible.map((person) => (
              <li key={person.name} className="border-b border-line">
                <button
                  type="button"
                  onClick={() => navigate(`/writer/${writerSlug(person.name)}`)}
                  className="group flex w-full items-center gap-4 py-5 text-left"
                >
                  <AuthorAvatar name={person.name} src={person.avatar} className="h-11 w-11 text-[12px]" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-display text-[1.05rem] font-semibold leading-snug text-ink decoration-accent underline-offset-4 group-hover:underline">
                      {person.name}
                    </span>
                    <span className="mt-0.5 block truncate text-[12.5px] text-ink-faint">
                      {person.role}
                      {person.count > 0
                        ? ` · ${person.count} ${person.count === 1 ? "story" : "stories"}`
                        : ""}
                    </span>
                    {person.bio && (
                      <span className="mt-1.5 block text-[13px] leading-relaxed text-ink-soft line-clamp-2">
                        {person.bio}
                      </span>
                    )}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>

        {writers.length > 24 && (
          <div className="mt-8 flex justify-center">
            <button type="button" onClick={() => setShowAll((value) => !value)} className="btn btn-outline">
              {showAll ? "Show fewer writers" : `Show all ${writers.length} writers`}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
