import { ArrowUpRight, BookOpen, Quote, Sparkles } from "lucide-react";
import AuthorAvatar from "../components/AuthorAvatar";
import Reveal from "../components/ui/Reveal";
import { writerSlug } from "../components/home/WritersSection";
import type { AboutData } from "../lib/usePublication";
import { useNavigate } from "../router";

interface AboutPageProps {
  about: AboutData;
  storyCount: number;
  contributorCount: number;
}

const TOPICS = [
  "Essays",
  "Technology",
  "Culture",
  "Creativity",
  "Productivity",
  "Relationships",
  "Mental health",
  "Personal stories",
];

export default function AboutPage({ about, storyCount, contributorCount }: AboutPageProps) {
  const navigate = useNavigate();

  return (
    <section className="pb-28 pt-28 sm:pt-36">
      <div className="shell">
        <header className="border-b border-line pb-12">
          <p className="eyebrow">
            <BookOpen className="h-3.5 w-3.5" aria-hidden="true" /> About the publication
          </p>
          <div className="mt-4 grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-start">
            <div>
              <h1 className="max-w-[16ch] font-display text-[clamp(2.25rem,5.5vw,3.75rem)] font-semibold leading-[1] tracking-[-0.035em] text-ink">
                A home for writing that takes its time.
              </h1>
              <p className="mt-6 max-w-[56ch] text-[15.5px] leading-relaxed text-ink-soft">
                {about.description}
              </p>
              <blockquote className="mt-8 border-l-2 border-accent pl-6">
                <Quote className="h-4 w-4 text-accent-ink" aria-hidden="true" />
                <p className="mt-3 max-w-[40ch] font-serif text-[clamp(1.25rem,2.4vw,1.6rem)] italic leading-snug text-ink">
                  Good writing is a form of hospitality. We keep the light on, the chair warm, and the
                  page open.
                </p>
                <footer className="mt-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-faint">
                  The Ink Home editorial desk
                </footer>
              </blockquote>
              <div className="mt-8 flex flex-wrap gap-3">
                <a
                  href="https://medium.com/the-ink-home"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-solid"
                >
                  Visit us on Medium
                  <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                </a>
                <button type="button" onClick={() => navigate("/stories")} className="btn btn-outline">
                  Browse the archive
                </button>
                <button type="button" onClick={() => navigate("/desk")} className="btn btn-outline">
                  Open The Desk
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-line bg-line">
              {[
                [String(storyCount), "Stories on site"],
                [String(contributorCount), "Contributors"],
                ["Weekly", "Refresh cadence"],
                ["2026", "Volume 07"],
              ].map(([value, label]) => (
                <div key={label} className="bg-raised px-5 py-6">
                  <p className="font-display text-[1.75rem] font-semibold leading-none tabular-nums text-ink">
                    {value}
                  </p>
                  <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-faint">
                    {label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </header>

        <div className="mt-10 grid gap-6 lg:grid-cols-3">
          <div className="rounded-2xl border border-line bg-raised p-6 lg:col-span-2">
            <p className="eyebrow">
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" /> What we publish
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {TOPICS.map((topic) => (
                <span key={topic} className="chip">
                  {topic}
                </span>
              ))}
            </div>
            <p className="mt-5 text-[13.5px] leading-relaxed text-ink-soft">
              Have something honest to say? We read every submission. Write to us at{" "}
              <a
                href="mailto:hello@theinkhome.com"
                className="text-ink underline decoration-accent underline-offset-4"
              >
                hello@theinkhome.com
              </a>{" "}
              with a short introduction and a link to your writing.
            </p>
          </div>

          <div className="rounded-2xl border border-line bg-raised p-6">
            <p className="eyebrow">At a glance</p>
            <ul className="mt-4 space-y-3 text-[13.5px] leading-relaxed text-ink-soft">
              <li>Independent and ad-light.</li>
              <li>Essays sourced from the publication's own Medium feed.</li>
              <li>Saved stories and Desk drafts stay in your browser.</li>
              <li>Read at your own pace — no streaks, no scores.</li>
            </ul>
          </div>
        </div>

        <section className="mt-16">
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-faint">
            The editorial desk
          </h2>
          <ul className="mt-5 grid gap-6 border-t border-line pt-6 md:grid-cols-2">
            {about.editors.map((editor, index) => (
              <li key={editor.name}>
                <Reveal delay={index * 0.06}>
                  <article className="flex h-full flex-col rounded-2xl border border-line bg-raised p-6">
                    <div className="flex items-center gap-4">
                      <AuthorAvatar name={editor.name} src={editor.avatar} className="h-16 w-16 text-[16px]" />
                      <div className="min-w-0">
                        <h3 className="font-display text-[1.35rem] font-semibold leading-snug text-ink">
                          {editor.name}
                        </h3>
                        <p className="mt-1 text-[13px] text-accent-ink">{editor.role}</p>
                      </div>
                    </div>
                    {editor.bio && (
                      <p className="mt-5 text-[13.5px] leading-relaxed text-ink-soft">{editor.bio}</p>
                    )}
                    <div className="mt-auto flex items-center justify-between border-t border-line pt-4 text-[12px]">
                      {editor.mediumUrl ? (
                        <a
                          href={editor.mediumUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 text-ink-faint transition-colors hover:text-ink"
                        >
                          Medium profile <ArrowUpRight className="h-3 w-3" />
                        </a>
                      ) : (
                        <button
                          type="button"
                          onClick={() => navigate(`/writer/${writerSlug(editor.name)}`)}
                          className="text-ink-faint transition-colors hover:text-ink"
                        >
                          Stories by {editor.name.split(" ")[0]}
                        </button>
                      )}
                      <span className="text-ink-faint">Editorial desk</span>
                    </div>
                  </article>
                </Reveal>
              </li>
            ))}
          </ul>
        </section>

        <nav aria-label="Policies" className="mt-16 flex flex-wrap gap-3 border-t border-line pt-8">
          <button type="button" onClick={() => navigate("/privacy")} className="btn btn-outline">
            Privacy
          </button>
          <button type="button" onClick={() => navigate("/terms")} className="btn btn-outline">
            Terms
          </button>
          <button type="button" onClick={() => navigate("/editorial")} className="btn btn-outline">
            Editorial policy
          </button>
        </nav>
      </div>
    </section>
  );
}
