import React from "react";
import { ArrowLeft } from "lucide-react";

export type LegalKind = "privacy" | "terms" | "editorial";

const CONTENT: Record<LegalKind, { eyebrow: string; title: string; sections: Array<{ heading: string; body: string }> }> = {
  privacy: {
    eyebrow: "Privacy",
    title: "Your reading stays yours.",
    sections: [
      {
        heading: "What we collect",
        body: "The Ink Home does not require an account and does not sell personal data. We store your liked and saved stories in your browser's local storage only. Server logs may retain standard request metadata for security and reliability.",
      },
      {
        heading: "Third parties",
        body: "Stories are published on Medium and rendered from Medium's public RSS feed. Following a link to Medium is governed by Medium's own privacy policy. The Ink Assistant sends your message to our AI provider solely to answer your question.",
      },
      {
        heading: "Your choices",
        body: "Clearing your browser storage removes any locally saved likes, bookmarks and preferences. For privacy questions, contact hello@theinkhome.com.",
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
        heading: "Corrections",
        body: "If you spot an error, email hello@theinkhome.com with the story title and a description of the issue. Corrections are applied on Medium, the canonical home of every essay, and reflected here on the next sync.",
      },
    ],
  },
};

export default function LegalPage({ kind, onBack }: { kind: LegalKind; onBack: () => void }) {
  const { eyebrow, title, sections } = CONTENT[kind];
  return (
    <section className="min-h-screen bg-[#08080a] text-white">
      <div className="mx-auto max-w-3xl px-4 pb-28 pt-28 sm:px-8 sm:pt-36">
        <button
          type="button"
          onClick={onBack}
          className="group mb-10 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-white/40 transition-colors hover:text-white"
        >
          <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" aria-hidden="true" />
          Back to the publication
        </button>
        <div className="font-mono text-[10px] uppercase tracking-[0.24em] text-[#c8ff4d]">{eyebrow}</div>
        <h1 className="mt-4 font-display text-4xl font-black tracking-[-0.03em] text-white sm:text-5xl">{title}</h1>
        <div className="mt-12 space-y-10">
          {sections.map((section) => (
            <div key={section.heading}>
              <h2 className="font-display text-xl font-bold text-white">{section.heading}</h2>
              <p className="mt-3 text-[15px] leading-relaxed text-white/55">{section.body}</p>
            </div>
          ))}
        </div>
        <p className="mt-14 border-t border-white/10 pt-6 font-mono text-[10px] uppercase tracking-[0.16em] text-white/30">
          Last updated November 2026 · hello@theinkhome.com
        </p>
      </div>
    </section>
  );
}
