import { useEffect, useRef } from "react";

/**
 * A soft radial light that follows the cursor and tints itself with the active
 * atmosphere (`--atmo-text`). It updates two CSS custom properties on pointermove —
 * a single composited layer, no React re-renders — and is disabled for
 * reduced-motion and touch-only devices so it never fights the perf work.
 */
export default function CursorGlow() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (!window.matchMedia("(pointer: fine)").matches) return;

    const el = ref.current;
    if (!el) return;

    const move = (e: PointerEvent) => {
      el.style.setProperty("--glow-x", `${e.clientX}px`);
      el.style.setProperty("--glow-y", `${e.clientY}px`);
    };
    const up = () => {
      el.style.setProperty("--glow-x", "50%");
      el.style.setProperty("--glow-y", "50%");
    };

    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("pointerdown", up, { passive: true });
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerdown", up);
    };
  }, []);

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[1] transition-opacity duration-700"
      style={{
        background:
          "radial-gradient(620px circle at var(--glow-x, 50%) var(--glow-y, 50%), color-mix(in srgb, var(--atmo-text) 7%, transparent), transparent 62%)",
        willChange: "background",
      }}
    />
  );
}
