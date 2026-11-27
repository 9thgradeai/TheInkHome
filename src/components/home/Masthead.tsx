import { motion } from "motion/react";
import { useNavigate } from "../../router";
import StoryConstellation from "./StoryConstellation";
import type { Story } from "../../types";

const EASE = [0.16, 1, 0.3, 1] as const;

interface MastheadProps {
  storyCount: number;
  contributorCount: number;
  loading: boolean;
  stories?: Story[];
}

/**
 * The publication masthead: nameplate, statement and a meta rule.
 * Typography carries this band — no decorative canvas, no gradient headline.
 */
export default function Masthead({ storyCount, contributorCount, loading, stories = [] }: MastheadProps) {
  const navigate = useNavigate();

  return (
    <section className="relative overflow-hidden border-b border-line pb-10 pt-28 sm:pt-36">
      <div className="hero-atmosphere" aria-hidden="true">
        <StoryConstellation stories={stories} />
      </div>
      <div className="shell relative z-10">
        <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr] lg:items-end">
        <div>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: EASE }}
            className="eyebrow"
          >
            A MEDIUM PUBLICATION
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.06, ease: EASE }}
            className="mt-5 max-w-[16ch] font-display text-[clamp(2.75rem,7.5vw,5.25rem)] font-semibold leading-[0.95] tracking-[-0.035em] text-ink"
          >
            Where words feel at home.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.14, ease: EASE }}
            className="mt-6 max-w-[52ch] text-[17px] leading-relaxed text-ink-soft sm:text-lg"
          >
            A home for stories that explore life, writing, technology, relationships, mental health, and
            the moments that shape us. Thoughtful reflections, creative insights, and ideas that inspire
            connection — where words truly feel at home.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.22, ease: EASE }}
            className="mt-8 flex flex-wrap gap-3"
          >
            <button type="button" onClick={() => navigate("/#latest")} className="btn btn-solid">
              Read the latest
            </button>
            <button type="button" onClick={() => navigate("/about")} className="btn btn-outline">
              Submission guidelines
            </button>
          </motion.div>
        </div>

        <motion.dl
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3, ease: EASE }}
          className="grid grid-cols-3 gap-4 border-t border-line pt-6 lg:border-t-0 lg:pt-0"
        >
          {[
            { value: loading ? "—" : "500+", label: "Stories" },
            { value: loading ? "—" : "50+", label: "Writers" },
            { value: "Weekly", label: "Cadence" },
          ].map((stat) => (
            <div key={stat.label}>
              <dt className="order-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-faint">
                {stat.label}
              </dt>
              <dd className="order-1 font-display text-[1.75rem] font-semibold tabular-nums leading-none text-ink sm:text-[2.25rem]">
                {stat.value}
              </dd>
            </div>
          ))}
        </motion.dl>
      </div>
      </div>
    </section>
  );
}
