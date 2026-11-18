import React from "react";
import { ArrowUpRight, ExternalLink } from "lucide-react";
import { Logo } from "./Logo";

interface SiteFooterProps {
  onNavigate: (path: string) => void;
}

const FOOTER_LINKS = {
  read: [
    { label: "Latest stories", path: "/stories" },
    { label: "Writers", path: "/writers" },
    { label: "About", path: "/about" },
  ],
  publication: [
    { label: "About us", path: "/about" },
    { label: "Submit a story", path: "/about" },
    { label: "Contact", href: "mailto:hello@theinkhome.com" },
  ],
  elsewhere: [
    { label: "Medium", href: "https://medium.com/the-ink-home", external: true },
    { label: "Email", href: "mailto:hello@theinkhome.com", external: false },
  ],
};

export default function SiteFooter({ onNavigate }: SiteFooterProps) {
  const read = (label: string, path: string) => (
    <button key={`${label}-${path}`} onClick={() => onNavigate(path)} className="text-[13px] text-white/60 hover:text-white">
      {label}
    </button>
  );

  return (
    <footer className="relative overflow-hidden border-t border-white/10 bg-[#060608]">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-64 opacity-40"
        style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(200,255,77,0.12), transparent 70%)" }}
      />

      <div className="relative mx-auto max-w-7xl px-4 pb-8 pt-16 sm:px-8 sm:pt-20">
        <div className="grid gap-12 lg:grid-cols-[1.2fr_1fr]">
          <div>
            <Logo size={38} textColor="text-white" />
            <p className="mt-6 max-w-md text-sm leading-relaxed text-white/60">
              Where words feel at home. An independent publication of essays on technology, culture, creativity and
              the quiet parts of being human — published on Medium.
            </p>
            <div className="mt-8">
              <a
                href="https://medium.com/the-ink-home"
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center gap-2 rounded-full border border-white/20 px-5 py-3 text-[11px] font-bold uppercase tracking-[0.16em] text-white/85 transition-colors hover:border-white/50 hover:text-white"
              >
                Follow on Medium <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </a>
              <p className="mt-3 font-mono text-[9px] uppercase tracking-[0.16em] text-white/40">
                <a href="mailto:hello@theinkhome.com" className="hover:text-white">
                  hello@theinkhome.com
                </a>
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
            <div>
              <h3 className="font-mono text-[9px] uppercase tracking-[0.22em] text-white/40">Read</h3>
              <ul className="mt-4 space-y-2.5">
                {FOOTER_LINKS.read.map((link) => (
                  <li key={link.label}>
                    <button onClick={() => onNavigate(link.path)} className="text-[13px] text-white/60 hover:text-white">
                      {link.label}
                    </button>
                  </li>
                ))}
                <li>
                  <a
                    href="https://medium.com/the-ink-home"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[13px] text-white/60 hover:text-white"
                  >
                    Medium archive
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-mono text-[9px] uppercase tracking-[0.22em] text-white/40">Publication</h3>
              <ul className="mt-4 space-y-2.5">
                {FOOTER_LINKS.publication.map((link) =>
                  link.href ? (
                    <li key={link.label}>
                      <a href={link.href} className="text-[13px] text-white/60 hover:text-white">
                        {link.label}
                      </a>
                    </li>
                  ) : (
                    <li key={link.label}>
                      <button onClick={() => onNavigate("/about")} className="text-[13px] text-white/60 hover:text-white">
                        {link.label}
                      </button>
                    </li>
                  ),
                )}
              </ul>
            </div>
            <div>
              <h3 className="font-mono text-[9px] uppercase tracking-[0.22em] text-white/40">Elsewhere</h3>
              <ul className="mt-4 space-y-2.5">
                {FOOTER_LINKS.elsewhere.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      target={link.external ? "_blank" : undefined}
                      rel={link.external ? "noopener noreferrer" : undefined}
                      className="text-[13px] text-white/60 hover:text-white"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
              <div className="mt-5 flex gap-2">
                <a
                  href="https://medium.com/the-ink-home"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="The Ink Home on Medium"
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 text-white/45 transition-colors hover:border-white/30 hover:text-white"
                >
                  <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-16 select-none overflow-hidden">
          <p
            aria-hidden="true"
            className="whitespace-nowrap text-center font-display text-[15vw] font-black uppercase leading-[0.8] tracking-tighter text-transparent sm:text-[13vw]"
            style={{ WebkitTextStroke: "1px rgba(255,255,255,0.14)" }}
          >
            The Ink Home
          </p>
        </div>

        <div className="mt-8 flex flex-col items-center justify-between gap-3 border-t border-white/10 pt-6 text-center font-mono text-[9px] uppercase tracking-[0.18em] text-white/30 sm:flex-row sm:text-left">
          <span>© 2026 The Ink Home. Words feel at home here.</span>
          <div className="flex gap-5">
            {["Privacy", "Terms", "Editorial policy"].map((label) => (
              <a key={label} href="#" className="transition-colors hover:text-white/70">
                {label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
