import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Bookmark, Menu, Moon, Sun, X } from "lucide-react";
import { Logo } from "./Logo";
import { useNavigate, usePath } from "../router";
import { getTheme, setTheme, type ThemeName } from "../lib/theme";

const LINKS = [
  { label: "Stories", href: "/stories" },
  { label: "Writers", href: "/writers" },
  { label: "The Desk", href: "/desk" },
  { label: "About", href: "/about" },
];

export default function SiteHeader() {
  const navigate = useNavigate();
  const path = usePath();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [theme, setThemeState] = useState<ThemeName>("paper");
  const menuRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setThemeState(getTheme());
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
        toggleRef.current?.focus();
      }
      if (event.key === "Tab") {
        const node = menuRef.current;
        if (!node) return;
        const focusables = Array.from(
          node.querySelectorAll<HTMLElement>('a[href], button:not([disabled])'),
        ).filter((el) => el.offsetParent !== null);
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  useEffect(() => {
    setMenuOpen(false);
  }, [path]);

  const toggleTheme = () => {
    const next: ThemeName = theme === "paper" ? "night" : "paper";
    setTheme(next);
    setThemeState(next);
  };

  const go = (to: string) => {
    setMenuOpen(false);
    navigate(to);
  };

  const isActive = (href: string) => path === href || (href !== "/" && path.startsWith(`${href}/`));

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-[background-color,border-color,backdrop-filter] duration-300 ${
          scrolled
            ? "border-b border-line bg-paper/90 backdrop-blur-xl"
            : "border-b border-transparent bg-transparent"
        }`}
      >
        <div className="shell flex h-16 items-center justify-between gap-4 sm:h-[72px]">
          <Logo />

          <nav aria-label="Primary" className="hidden items-center gap-1 md:flex">
            {LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={(event) => {
                  event.preventDefault();
                  go(link.href);
                }}
                aria-current={isActive(link.href) ? "page" : undefined}
                className={`relative rounded-full px-3.5 py-2 text-[13px] font-medium transition-colors ${
                  isActive(link.href)
                    ? "text-ink"
                    : "text-ink-soft hover:text-ink"
                }`}
              >
                {link.label}
                {isActive(link.href) && (
                  <span
                    aria-hidden="true"
                    className="absolute inset-x-3.5 -bottom-0.5 h-px bg-accent"
                  />
                )}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={theme === "paper" ? "Switch to night reading theme" : "Switch to paper reading theme"}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-transparent text-ink-soft transition-colors hover:border-line hover:text-ink"
            >
              {theme === "paper" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            </button>

            <a
              href="/saved"
              onClick={(event) => {
                event.preventDefault();
                go("/saved");
              }}
              aria-label="Reading list"
              className={`hidden h-10 w-10 items-center justify-center rounded-full border border-transparent transition-colors hover:border-line sm:flex ${
                path === "/saved" ? "text-ink" : "text-ink-soft"
              }`}
            >
              <Bookmark className="h-4 w-4" />
            </a>

            <a
              href="/stories"
              onClick={(event) => {
                event.preventDefault();
                go("/stories");
              }}
              className="btn btn-solid hidden whitespace-nowrap md:inline-flex"
              style={{ color: "var(--on-ink)" }}
            >
              Read the latest
            </a>

            <button
              ref={toggleRef}
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-line text-ink md:hidden"
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              aria-controls="site-menu"
              aria-expanded={menuOpen}
            >
              {menuOpen ? <X className="h-4.5 w-4.5" /> : <Menu className="h-4.5 w-4.5" />}
            </button>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            id="site-menu"
            ref={menuRef}
            className="fixed inset-0 z-40 flex flex-col bg-paper px-5 pb-8 pt-24 md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <nav aria-label="Mobile" className="flex flex-col border-t border-line">
              {LINKS.map((link) => (
                <button
                  key={link.href}
                  type="button"
                  onClick={() => go(link.href)}
                  aria-current={isActive(link.href) ? "page" : undefined}
                  className="flex items-center justify-between border-b border-line py-5 text-left"
                >
                  <span className="font-display text-2xl font-semibold text-ink">{link.label}</span>
                  <span aria-hidden="true" className="text-ink-faint">
                    →
                  </span>
                </button>
              ))}
              <button
                type="button"
                onClick={() => go("/saved")}
                className="flex items-center justify-between border-b border-line py-5 text-left"
              >
                <span className="font-display text-2xl font-semibold text-ink">Reading list</span>
                <span aria-hidden="true" className="text-ink-faint">
                  →
                </span>
              </button>
            </nav>

            <a
              href="https://medium.com/the-ink-home"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-outline mt-8 w-full"
            >
              Follow on Medium
            </a>
            <button type="button" onClick={() => go("/desk")} className="btn btn-accent mt-3 w-full">
              Start writing
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
