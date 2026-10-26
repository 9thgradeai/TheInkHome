import React, { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowUpRight, Menu, X } from "lucide-react";
import { Logo } from "./Logo";

interface SiteHeaderProps {
  onNavigate: (path: string) => void;
  onOpenStory?: () => void;
}

const links = [
  { label: "Stories", href: "/stories" },
  { label: "Writers", href: "/writers" },
  { label: "About", href: "/about" },
];

export default function SiteHeader({ onNavigate, onOpenStory }: SiteHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  const go = (path: string) => {
    setMenuOpen(false);
    onNavigate(path);
  };

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${
          scrolled ? "border-b border-white/10 bg-[#08080a]/85 backdrop-blur-xl" : "border-b border-transparent"
        }`}
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:h-[72px] sm:px-8">
          <button onClick={() => go("/")} className="flex items-center text-left" aria-label="The Ink Home — home">
            <Logo size={34} textColor="text-white" />
          </button>

          <nav className="hidden items-center gap-7 md:flex">
            {links.map((link) => (
              <button
                key={link.href}
                onClick={() => go(link.href)}
                className="text-[11px] font-medium uppercase tracking-[0.16em] text-white/55 transition-colors hover:text-white"
              >
                {link.label}
              </button>
            ))}
          </nav>

          <div className="hidden items-center gap-3 md:flex">
            <a
              href="https://medium.com/the-ink-home"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-2 rounded-full bg-white px-4 py-2.5 text-[10px] font-bold uppercase tracking-[0.16em] text-black transition-colors hover:bg-[#c8ff4d]"
            >
              Read on Medium
              <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </a>
          </div>

          <button
            onClick={() => setMenuOpen((open) => !open)}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 text-white md:hidden"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
          >
            {menuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </header>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            className="fixed inset-0 z-40 flex flex-col bg-[#08080a] px-6 pb-8 pt-24 md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="mt-4 flex flex-col divide-y divide-white/10 border-y border-white/10">
              {links.map((link) => (
                <button
                  key={link.href}
                  onClick={() => go(link.href)}
                  className="flex items-center justify-between py-5 text-left"
                >
                  <span className="font-display text-2xl font-semibold text-white">{link.label}</span>
                  <ArrowUpRight className="h-4 w-4 text-white/40" />
                </button>
              ))}
              <a
                href="https://medium.com/the-ink-home"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between py-5 text-left"
              >
                <span className="font-display text-2xl font-semibold text-white">Medium</span>
                <ArrowUpRight className="h-4 w-4 text-white/40" />
              </a>
            </div>
            <button
              onClick={() => {
                setMenuOpen(false);
                onOpenStory?.();
              }}
              className="mt-6 flex items-center justify-center gap-2 rounded-full bg-[#c8ff4d] px-4 py-3.5 text-[11px] font-bold uppercase tracking-[0.16em] text-black"
            >
              Start reading
              <ArrowUpRight className="h-4 w-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
