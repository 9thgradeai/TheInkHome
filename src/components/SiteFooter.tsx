import { Rss } from "lucide-react";
import { Logo } from "./Logo";
import { useNavigate } from "../router";

const COLUMNS = [
  {
    title: "Read",
    links: [
      { label: "Latest stories", path: "/stories" },
      { label: "Writers", path: "/writers" },
      { label: "Reading list", path: "/saved" },
      { label: "About", path: "/about" },
    ],
  },
  {
    title: "Write",
    links: [
      { label: "The Desk", path: "/desk" },
      { label: "Submission guidelines", path: "/about" },
      { label: "Editorial policy", path: "/editorial" },
      { label: "Pitch us", href: "mailto:hello@theinkhome.com" },
    ],
  },
  {
    title: "Elsewhere",
    links: [
      { label: "Medium", href: "https://medium.com/the-ink-home" },
      { label: "RSS feed", href: "/rss.xml" },
      { label: "Sitemap", href: "/sitemap.xml" },
      { label: "hello@theinkhome.com", href: "mailto:hello@theinkhome.com" },
    ],
  },
];

export default function SiteFooter() {
  const navigate = useNavigate();

  return (
    <footer className="border-t border-line bg-sunken">
      <div className="shell py-14 sm:py-16">
        <div className="grid gap-10 lg:grid-cols-[1.3fr_1fr]">
          <div>
            <Logo />
            <p className="mt-5 max-w-md text-[14.5px] leading-relaxed text-ink-soft">
              Where words feel at home. An independent publication of essays on technology, culture,
              creativity and the quiet parts of being human — published on Medium.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <a
                href="https://medium.com/the-ink-home"
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-outline"
                style={{ color: "var(--ink)" }}
              >
                Follow on Medium
              </a>
              <a href="/rss.xml" className="btn btn-quiet" target="_blank" rel="noopener noreferrer">
                <Rss className="h-4 w-4" aria-hidden="true" /> RSS
              </a>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
            {COLUMNS.map((column) => (
              <div key={column.title}>
                <h2 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-faint">
                  {column.title}
                </h2>
                <ul className="mt-4 space-y-2.5">
                  {column.links.map((link) => (
                    <li key={link.label}>
                      {"path" in link && link.path ? (
                        <button
                          type="button"
                          onClick={() => navigate(link.path)}
                          className="text-left text-[13.5px] text-ink-soft transition-colors hover:text-ink"
                        >
                          {link.label}
                        </button>
                      ) : (
                        <a
                          href={(link as { href: string }).href}
                          target={(link as { href: string }).href.startsWith("http") ? "_blank" : undefined}
                          rel={(link as { href: string }).href.startsWith("http") ? "noopener noreferrer" : undefined}
                          className="text-[13.5px] text-ink-soft transition-colors hover:text-ink"
                        >
                          {link.label}
                        </a>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div
          aria-hidden="true"
          className="mt-14 select-none overflow-hidden border-t border-line pt-8"
        >
          <p
            className="whitespace-nowrap text-center font-display text-[14vw] font-semibold uppercase leading-[0.85] tracking-[-0.04em] text-transparent sm:text-[12vw]"
            style={{ WebkitTextStroke: "1px var(--line-strong)" }}
          >
            The Ink Home
          </p>
        </div>

        <div className="mt-8 flex flex-col items-center justify-between gap-3 border-t border-line pt-6 text-center text-[12px] text-ink-faint sm:flex-row sm:text-left">
          <span>© 2026 The Ink Home. Words feel at home here.</span>
          <nav aria-label="Legal" className="flex flex-wrap justify-center gap-5">
            {[
              { label: "Privacy", path: "/privacy" },
              { label: "Terms", path: "/terms" },
              { label: "Editorial policy", path: "/editorial" },
            ].map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={() => navigate(item.path)}
                className="transition-colors hover:text-ink"
              >
                {item.label}
              </button>
            ))}
          </nav>
        </div>
      </div>
    </footer>
  );
}
