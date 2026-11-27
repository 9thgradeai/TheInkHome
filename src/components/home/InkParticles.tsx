import { useEffect, useRef } from "react";

/**
 * Lightweight floating ink particles.
 *
 * ~40 small dots animated on a single canvas via requestAnimationFrame.
 * Pauses when offscreen (IntersectionObserver) and respects reduced motion.
 * No three.js, no extra bundle cost.
 */
export default function InkParticles({ className = "" }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;

    let rafId = 0;
    let running = true;
    let width = 0;
    let height = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    type Particle = { x: number; y: number; vx: number; vy: number; r: number; a: number; phase: number };
    const particles: Particle[] = [];

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      width = Math.max(1, Math.floor(rect.width));
      height = Math.max(1, Math.floor(rect.height));
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const seed = () => {
      particles.length = 0;
      const count = Math.min(48, Math.max(24, Math.round((width * height) / 28000)));
      for (let i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 0.22,
          vy: (Math.random() - 0.5) * 0.22 - 0.06,
          r: 1 + Math.random() * 2.2,
          a: 0.18 + Math.random() * 0.32,
          phase: Math.random() * Math.PI * 2,
        });
      }
    };

    resize();
    seed();

    const ro = new ResizeObserver(() => {
      resize();
      seed();
    });
    ro.observe(canvas);

    const io = new IntersectionObserver(
      (entries) => {
        running = entries.some((entry) => entry.isIntersecting);
        if (running && !rafId) rafId = requestAnimationFrame(tick);
      },
      { threshold: 0.05 },
    );
    io.observe(canvas);

    const start = performance.now();
    function tick(now: number) {
      if (!running) {
        rafId = 0;
        return;
      }
      const t = (now - start) / 1000;
      context.clearRect(0, 0, width, height);
      const accent = getComputedStyle(canvas).getPropertyValue("--accent").trim() || "#d8a13c";

      for (const particle of particles) {
        particle.x += particle.vx + Math.sin(t * 0.6 + particle.phase) * 0.05;
        particle.y += particle.vy + Math.cos(t * 0.5 + particle.phase) * 0.04;

        if (particle.x < -8) particle.x = width + 8;
        if (particle.x > width + 8) particle.x = -8;
        if (particle.y < -8) particle.y = height + 8;
        if (particle.y > height + 8) particle.y = -8;

        context.beginPath();
        context.arc(particle.x, particle.y, particle.r, 0, Math.PI * 2);
        context.fillStyle = accent;
        context.globalAlpha = particle.a * (0.7 + 0.3 * Math.sin(t + particle.phase));
        context.fill();
      }
      context.globalAlpha = 1;
      rafId = requestAnimationFrame(tick);
    }
    rafId = requestAnimationFrame(tick);

    return () => {
      running = false;
      if (rafId) cancelAnimationFrame(rafId);
      ro.disconnect();
      io.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 h-full w-full ${className}`}
    />
  );
}
