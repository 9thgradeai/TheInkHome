import { ArrowLeft } from "lucide-react";
import { useNavigate } from "../router";

export type LegalKind = "privacy" | "terms" | "editorial";

const CONTENT: Record<
  LegalKind,
  { eyebrow: string; title: string; sections: Array<{ heading: string; body: string }> }
> = {
  privacy: {
    eyebrow: "Privacy",
    title: "Your reading stays yours.",
    sections: [
      {
        heading: "What we collect",
        body: "The Ink Home does not require an account and does not sell personal data. Stories you save or like, drafts you write at The Desk, and your theme preference are stored in this browser's local storage only. Server logs may retain standard request metadata for security and reliability.",
      },
      {
        heading: "Third parties",
        body: "Stories are published on Medium and rendered from Medium's public RSS feed. Following a link to Medium is governed by Medium's own privacy policy. When you ask the Ink Assistant a question, your message and the current page context are sent to our AI provider solely to generate a reply; drafts written at The Desk are never sent unless you explicitly press the feedback button.",
      },
      {
        heading: "Your choices",
        body: "Clearing your browser's site data removes saved stories, likes, drafts and preferences. For privacy questions, contact hello@theinkhome.com.",
      },
    ],
  },
  terms: {
    eyebrow: "Terms",
    title: "Read freely, credit fairly.",
    sections: [
      {
        heading: "Use of the site",
        body: "The Ink Home is an independent editorial publication. You may read, link to and share our stories for personal, non-commercial use. Republishing full essays without permission is not allowed.",
      },
      {
        heading: "Content ownership",
        body: "Each essay remains the property of its author. The site design, code and branding belong to The Ink Home. Story text is sourced from the publication's Medium feed and may change or disappear if the original does.",
      },
      {
        heading: "Drafts",
        body: "Drafts written at The Desk belong to you. They are stored locally in your browser and are not hosted by us, so we cannot recover them if you clear your browser data. Export your work before you do.",
      },
      {
        heading: "No warranty",
        body: "The site is provided as-is. We work to keep the archive accurate and available, but we do not guarantee uninterrupted access or that third-party feeds remain online.",
      },
    ],
  },
  editorial: {
    eyebrow: "Editorial policy",
    title: "How we choose what we publish.",
    sections: [
      {
        heading: "Independence",
        body: "The Ink Home is editorially independent. We publish essays on technology, culture, creativity, relationships, productivity and mental health, and we keep editorial decisions separate from any commercial relationship.",
      },
      {
        heading: "Submissions",
        body: "We read every submission. Send drafts or pitches to hello@theinkhome.com with a short introduction and a link to your writing. We respond to work we can publish; expect a reply within two weeks.",
      },
      {
        heading: "Edits",
        body: "We edit lightly. The goal is to protect your voice, not replace it. You will always see and approve substantive changes before anything is published.",
      },
      {
        heading: "Artificial intelligence",
        body: "Essays must be your own words. The Ink Assistant on this site is a tool for readers and writers — it never publishes, never rewrites your work without asking, and its suggestions are always optional. Any AI-assisted work must be disclosed to the editors before submission.",
      },
    ],
  },
};

export default function LegalPage({ kind }: { kind: LegalKind }) {
  const navigate = useNavigate();
  const { eyebrow, title, sections } = CONTENT[kind];

  return (
    <section className="pb-28 pt-28 sm:pt-36">
      <div className="shell measure-wide">
        <button
          type="button"
          onClick={() => navigate("/about")}
          className="group mb-10 flex items-center gap-2 text-[13px] text-ink-faint transition-colors hover:text-ink"
        >
          <ArrowLeft
            className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5"
            aria-hidden="true"
          />
          Back to the publication
        </button>

        <p className="eyebrow">{eyebrow}</p>
        <h1 className="mt-4 font-display text-[clamp(2.25rem,5vw,3.5rem)] font-semibold leading-[1.02] tracking-[-0.035em] text-ink">
          {title}
        </h1>

        <div className="mt-12 space-y-10 border-t border-line pt-10">
          {sections.map((section) => (
            <section key={section.heading}>
              <h2 className="font-display text-[1.3rem] font-semibold text-ink">{section.heading}</h2>
              <p className="mt-3 text-[15.5px] leading-relaxed text-ink-soft">{section.body}</p>
            </section>
          ))}
        </div>

        <p className="mt-14 border-t border-line pt-6 text-[13px] text-ink-faint">
          Last updated November 2026 ·{" "}
          <a
            href="mailto:hello@theinkhome.com"
            className="underline decoration-accent underline-offset-4 hover:text-ink"
          >
            hello@theinkhome.com
          </a>
        </p>
      </div>
    </section>
  );
}
