import { motion } from "motion/react";
import type { ReactNode } from "react";

const EASE = [0.16, 1, 0.3, 1] as const;

interface RevealProps {
  children: ReactNode;
  delay?: number;
  className?: string;
  /** Distance in px the content travels on entry. */
  offset?: number;
  /** Render without animation (used for above-the-fold content). */
  instant?: boolean;
}

/** Fades content in once as it enters the viewport. */
export default function Reveal({ children, delay = 0, className = "", offset = 18, instant = false }: RevealProps) {
  if (instant) return <div className={className}>{children}</div>;

  return (
    <motion.div
      initial={{ opacity: 0, y: offset }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.6, delay, ease: EASE }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
