import React, { useState } from "react";
import { ArrowRight, Check, ExternalLink, Github, Instagram, Twitter } from "lucide-react";
import { Logo } from "./Logo";

interface SiteFooterProps {
  onNavigate: (path: string) => void;
}

export default function SiteFooter({ onNavigate }: SiteFooterProps) {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const subscribe = (event: React.FormEvent) => {
    event.preventDefault();
    if (!email.trim()) return;
    setSubscribed(true);
    setEmail("");
    window.setTimeout(() => setSubscribed(false), 2600);
  };

  return (
    <footer className="relative overflow-hidden border-t border-white/10 bg-[#060608]">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-64 opacity-40"
        style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(200,255,77,0.12), transparent 70%)" }}
      />

      <div className="relative mx-auto max-w-7xl px-4 pb-8 pt-16 sm:px-8 sm:pt-20">
        <div className="grid gap-12 lg:grid-cols-[1.2fr_1fr]">
          <div>
            <Logo size={38} textColor="text-white" />
            <p className="mt-6 max-w-md text-sm leading-relaxed text-white/45">
              Where words feel at home. An independent publication of essays on technology, culture, creativity
              and the quiet parts of being human — published on Medium.
            </p>

            <form onSubmit={subscribe} className="mt-8 max-w-sm">
              <label htmlFor="footer-email" className="font-mono text-[9px] uppercase tracking-[0.22em] text-white/40">
                The Sunday dispatch
              </label>
              <div className="mt-2 flex items-center gap-2 border-b border-white/15 pb-2 focus-within:border-white/40">
                <input
                  id="footer-email"
                  type="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@studio.com"
                  className="w-full bg-transparent text-sm text-white placeholder:text-white/25 focus:outline-none"
                />
                <button
                  type="submit"
                  aria-label="Subscribe"
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-black transition-colors hover:bg-[#c8ff4d]"
                >
                  {subscribed ? <Check className="h-4 w-4" /> : <ArrowRight className="h-4 w-4" />}
                </button>
              </div>
              <p className="mt-2 h-4 font-mono text-[9px] uppercase tracking-[0.16em] text-[#c8ff4d]">
                {subscribed ? "You're on the list." : ""}
              </p>
            </form>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
            <div>
              <h3 className="font-mono text-[9px] uppercase tracking-[0.22em] text-white/35">Read</h3>
              <ul className="mt-4 space-y-2.5">
                <li>
                  <button onClick={() => onNavigate("/stories")} className="text-[13px] text-white/55 hover:text-white">
                    Latest stories
                  </button>
                </li>
                <li>
                  <button onClick={() => onNavigate("/writers")} className="text-[13px] text-white/55 hover:text-white">
                    Editors
                  </button>
                </li>
                <li>
                  <button onClick={() => onNavigate("/writers")} className="text-[13px] text-white/55 hover:text-white">
                    Contributors
                  </button>
                </li>
                <li>
                  <a
                    href="https://medium.com/the-ink-home"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[13px] text-white/55 hover:text-white"
                  >
                    Medium archive
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-mono text-[9px] uppercase tracking-[0.22em] text-white/35">Publication</h3>
              <ul className="mt-4 space-y-2.5">
                <li>
                  <button onClick={() => onNavigate("/about")} className="text-[13px] text-white/55 hover:text-white">
                    About us
                  </button>
                </li>
                <li>
                  <button onClick={() => onNavigate("/about")} className="text-[13px] text-white/55 hover:text-white">
                    Submit a story
                  </button>
                </li>
                <li>
                  <a href="mailto:hello@theinkhome.com" className="text-[13px] text-white/55 hover:text-white">
                    Contact
                  </a>
                </li>
                <li>
                  <a href="https://theinkhome.live/" className="text-[13px] text-white/55 hover:text-white">
                    theinkhome.live
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-mono text-[9px] uppercase tracking-[0.22em] text-white/35">Elsewhere</h3>
              <ul className="mt-4 space-y-2.5">
                <li>
                  <a
                    href="https://medium.com/the-ink-home"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-[13px] text-white/55 hover:text-white"
                  >
                    Medium <ExternalLink className="h-3 w-3" />
                  </a>
                </li>
                <li>
                  <a href="#" className="text-[13px] text-white/55 hover:text-white">
                    Instagram
                  </a>
                </li>
                <li>
                  <a href="#" className="text-[13px] text-white/55 hover:text-white">
                    X / Twitter
                  </a>
                </li>
              </ul>
              <div className="mt-5 flex gap-2">
                {[Twitter, Instagram, Github].map((Icon, i) => (
                  <a
                    key={i}
                    href="#"
                    aria-label="Social link"
                    className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 text-white/45 transition-colors hover:border-white/30 hover:text-white"
                  >
                    <Icon className="h-3.5 w-3.5" />
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-16 select-none overflow-hidden">
          <p
            className="whitespace-nowrap text-center font-display text-[15vw] font-black uppercase leading-[0.8] tracking-tighter text-transparent sm:text-[13vw]"
            style={{ WebkitTextStroke: "1px rgba(255,255,255,0.14)" }}
          >
            The Ink Home
          </p>
        </div>

        <div className="mt-8 flex flex-col items-center justify-between gap-3 border-t border-white/10 pt-6 text-center font-mono text-[9px] uppercase tracking-[0.18em] text-white/30 sm:flex-row sm:text-left">
          <span>© 2026 The Ink Home. Words feel at home here.</span>
          <div className="flex gap-5">
            <a href="#" className="transition-colors hover:text-white/70">
              Privacy
            </a>
            <a href="#" className="transition-colors hover:text-white/70">
              Terms
            </a>
            <a href="#" className="transition-colors hover:text-white/70">
              Editorial policy
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
