import { ArrowUpRight, Rss } from "lucide-react";
import { useNavigate } from "../../router";
import Reveal from "../ui/Reveal";

/**
 * Honest subscription surface.
 *
 * There is no mailing-list backend in this deployment, so the previous form
 * that claimed "you're on the list" was a lie. The two ways to actually
 * follow the publication — Medium and RSS — are presented plainly instead.
 */
export default function FollowSection() {
  const navigate = useNavigate();

  return (
    <section id="follow" className="scroll-mt-24 border-t border-line py-16 sm:py-20">
      <div className="shell">
        <Reveal className="grid gap-10 lg:grid-cols-[1.2fr_1fr] lg:items-end">
          <div>
            <p className="eyebrow">Stay close</p>
            <h2 className="mt-4 max-w-[16ch] font-display text-[clamp(2rem,4.5vw,3.25rem)] font-semibold leading-[1.02] tracking-[-0.03em] text-ink">
              New stories land here first.
            </h2>
            <p className="mt-5 max-w-[52ch] text-[15.5px] leading-relaxed text-ink-soft">
              Follow The Ink Home on Medium and every new essay arrives in your reading feed — no
              inbox, no algorithm tax. Prefer your own reader? The RSS feed carries the same thing.
            </p>
            <p className="mt-4 text-[13px] text-ink-faint">
              We do not run a newsletter yet. When we do, it will be here — and it will be real.
            </p>
          </div>

          <div className="rounded-2xl border border-line bg-raised p-6 sm:p-7">
            <h3 className="font-display text-[1.35rem] font-semibold leading-snug text-ink">
              Two ways to follow
            </h3>
            <div className="mt-5 flex flex-col gap-3">
              <a
                href="https://medium.com/the-ink-home"
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-solid w-full justify-between"
                style={{ color: "var(--on-ink)" }}
              >
                Follow on Medium
                <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
              </a>
              <a href="/rss.xml" target="_blank" rel="noopener noreferrer" className="btn btn-outline w-full justify-between">
                Subscribe via RSS
                <Rss className="h-4 w-4" aria-hidden="true" />
              </a>
            </div>
            <p className="mt-5 border-t border-line pt-4 text-[13px] leading-relaxed text-ink-faint">
              Prefer to write with us? Read the{" "}
              <button
                type="button"
                onClick={() => navigate("/about")}
                className="text-ink underline decoration-accent underline-offset-4"
              >
                submission guidelines
              </button>
              , or open{" "}
              <button
                type="button"
                onClick={() => navigate("/desk")}
                className="text-ink underline decoration-accent underline-offset-4"
              >
                The Desk
              </button>{" "}
              to draft something first.
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
