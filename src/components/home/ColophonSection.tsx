import { Quote } from "lucide-react";
import type { AboutData } from "../../lib/usePublication";
import { useNavigate } from "../../router";
import Reveal from "../ui/Reveal";

interface ColophonSectionProps {
  about: AboutData;
  storyCount: number;
  contributorCount: number;
}

/** The colophon: what this publication is, who makes it, and what it publishes. */
export default function ColophonSection({ about, storyCount, contributorCount }: ColophonSectionProps) {
  const navigate = useNavigate();

  return (
    <section id="about" className="scroll-mt-24 border-t border-line bg-sunken py-16 sm:py-20">
      <div className="shell grid gap-12 lg:grid-cols-[1.15fr_0.85fr]">
        <Reveal>
          <p className="eyebrow">About the publication</p>
          <h2 className="mt-4 max-w-[16ch] font-display text-[clamp(2rem,4.5vw,3.25rem)] font-semibold leading-[1.02] tracking-[-0.03em] text-ink">
            A home for writing that takes its time.
          </h2>
          <p className="mt-6 max-w-[56ch] text-[15.5px] leading-relaxed text-ink-soft">
            {about.description}
          </p>

          <blockquote className="mt-9 border-l-2 border-accent pl-6">
            <Quote className="h-4 w-4 text-accent-ink" aria-hidden="true" />
            <p className="mt-3 max-w-[40ch] font-serif text-[clamp(1.25rem,2.4vw,1.6rem)] italic leading-snug text-ink">
              Good writing is a form of hospitality. We keep the light on, the chair warm, and the page
              open.
            </p>
            <footer className="mt-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-faint">
              The Ink Home editorial desk
            </footer>
          </blockquote>

          <div className="mt-8 flex flex-wrap gap-3">
            <button type="button" onClick={() => navigate("/about")} className="btn btn-solid">
              Read the guidelines
            </button>
            <button type="button" onClick={() => navigate("/stories")} className="btn btn-outline">
              Browse the archive
            </button>
          </div>
        </Reveal>

        <Reveal delay={0.08}>
          <figure className="overflow-hidden rounded-2xl border border-line bg-raised">
            <img
              src="/assets/ink-home-plate.jpg"
              alt="The Ink Home — a house beneath an amber moon, the publication's mark"
              width={1000}
              height={1000}
              loading="lazy"
              decoding="async"
              className="aspect-square w-full object-cover"
            />
            <figcaption className="border-t border-line px-5 py-3.5 text-[12.5px] text-ink-faint">
              The house mark. Established for readers who leave the light on.
            </figcaption>
          </figure>

          <dl className="mt-4 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-line bg-line">
            {[
              [String(storyCount), "Stories on site"],
              [String(contributorCount), "Contributors"],
              ["Weekly", "Refresh cadence"],
              ["2026", "Volume 07"],
            ].map(([value, label]) => (
              <div key={label} className="bg-raised px-5 py-5">
                <dd className="font-display text-[1.6rem] font-semibold tabular-nums leading-none text-ink">
                  {value}
                </dd>
                <dt className="mt-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-faint">
                  {label}
                </dt>
              </div>
            ))}
          </dl>
        </Reveal>
      </div>
    </section>
  );
}
