import { useMemo, useState } from "react";
import { ArrowRight } from "lucide-react";
import type { Story } from "../../types";
import type { Person } from "../../lib/usePublication";
import { useNavigate } from "../../router";
import AuthorAvatar from "../AuthorAvatar";
import Reveal from "../ui/Reveal";

interface WritersSectionProps {
  editors: Person[];
  writers: (Person & { count: number })[];
  stories: Story[];
}

export function writerSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

const PREVIEW = 8;

/** Contributors presented as a masthead roll, not a grid of avatar cards. */
export default function WritersSection({ editors, writers, stories }: WritersSectionProps) {
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

  const visible = showAll ? writers : writers.slice(0, PREVIEW);

  return (
    <section id="writers" className="scroll-mt-24 border-t border-line py-16 sm:py-20">
      <div className="shell">
        <Reveal className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="eyebrow">The writers</p>
            <h2 className="mt-4 max-w-[18ch] font-display text-[clamp(2rem,4.5vw,3.25rem)] font-semibold leading-[1.02] tracking-[-0.03em] text-ink">
              Every voice in the room.
            </h2>
          </div>
          <button type="button" onClick={() => navigate("/writers")} className="btn btn-quiet group sm:pb-2">
            All {writers.length + editors.length} contributors
            <ArrowRight aria-hidden="true" className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </button>
        </Reveal>

        {editorRows.length > 0 && (
          <Reveal delay={0.04} className="mt-10">
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-faint">
              Editorial desk
            </h3>
            <ul className="mt-4 grid gap-x-10 border-t border-line sm:grid-cols-2">
              {editorRows.map((editor) => (
                <li key={editor.name} className="border-b border-line">
                  <button
                    type="button"
                    onClick={() => navigate(`/writer/${writerSlug(editor.name)}`)}
                    className="group flex w-full items-center gap-4 py-5 text-left"
                  >
                    <AuthorAvatar
                      name={editor.name}
                      src={editor.avatar}
                      className="h-12 w-12 text-[13px]"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block font-display text-[1.1rem] font-semibold leading-snug text-ink decoration-accent underline-offset-4 group-hover:underline">
                        {editor.name}
                      </span>
                      <span className="mt-0.5 block truncate text-[13px] text-ink-soft">
                        {editor.role}
                      </span>
                    </span>
                    <span className="shrink-0 text-[12px] tabular-nums text-ink-faint">
                      {editor.count} {editor.count === 1 ? "story" : "stories"}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </Reveal>
        )}

        <Reveal delay={0.08} className="mt-12">
          <h3 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-faint">
            Contributing writers
          </h3>
          <ul className="mt-4 grid gap-x-10 border-t border-line sm:grid-cols-2">
            {visible.map((person) => (
              <li key={person.name} className="border-b border-line">
                <button
                  type="button"
                  onClick={() => navigate(`/writer/${writerSlug(person.name)}`)}
                  className="group flex w-full items-center gap-4 py-4 text-left"
                >
                  <AuthorAvatar name={person.name} src={person.avatar} className="h-10 w-10 text-[11px]" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-display text-[1rem] font-semibold leading-snug text-ink decoration-accent underline-offset-4 group-hover:underline">
                      {person.name}
                    </span>
                    <span className="mt-0.5 block truncate text-[12.5px] text-ink-faint">
                      {person.role}
                      {person.count > 0 ? ` · ${person.count} ${person.count === 1 ? "story" : "stories"}` : ""}
                    </span>
                  </span>
                  <ArrowRight
                    aria-hidden="true"
                    className="h-4 w-4 shrink-0 text-ink-faint opacity-0 transition-opacity group-hover:opacity-100"
                  />
                </button>
              </li>
            ))}
          </ul>
        </Reveal>

        {writers.length > PREVIEW && (
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
