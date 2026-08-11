import React, { useEffect, useState } from "react";

interface CinematicLoaderProps {
  onComplete: () => void;
  isWelcomeHome?: boolean;
}

export default function CinematicLoader({ onComplete, isWelcomeHome = false }: CinematicLoaderProps) {
  const [phase, setPhase] = useState<"init" | "reveal" | "enter" | "done">("init");

  // Skip the loader early — respects the once-per-session gate in App.
  const handleSkip = () => onComplete();

  useEffect(() => {
    if (isWelcomeHome) {
      const t1 = setTimeout(() => setPhase("done"), 400);
      const t2 = setTimeout(() => onComplete(), 1100);
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
      };
    }

    const t1 = setTimeout(() => setPhase("reveal"), 60);
    const t2 = setTimeout(() => setPhase("enter"), 450);
    const t3 = setTimeout(() => onComplete(), 1000);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [onComplete, isWelcomeHome]);

  if (isWelcomeHome) {
    return (
      <div
        className={`fixed inset-0 z-[9999] flex items-center justify-center bg-black cursor-pointer ${
          phase === "done" ? "anim-exit-soft" : "anim-fade"
        }`}
        onClick={handleSkip}
        title="Click to skip"
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,0.6)_0%,rgba(0,0,0,0.95)_100%)]" />
        <div className="absolute inset-0 opacity-[0.03] mix-blend-overlay noise-overlay pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center justify-center px-6">
          <div className="anim-pop-blur text-center">
            <h1
              className="anim-tracking text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black italic uppercase leading-[0.85] tracking-tighter font-display bg-gradient-to-r from-white via-[var(--atmo-text)] to-[var(--atmo-text)] bg-clip-text text-transparent select-none"
              style={{ textShadow: "0 0 40px var(--atmo-glow)" }}
            >
              <span className="inline-block anim-rise-char" style={{ animationDelay: "0.1s" }}>
                Welcome
              </span>
              <br />
              <span className="inline-block anim-rise-char" style={{ animationDelay: "0.3s" }}>
                Home
              </span>
            </h1>
          </div>

          <p
            className="anim-fade-up-sm mt-6 text-[10px] sm:text-xs font-mono uppercase tracking-[0.2em] text-[var(--atmo-text)] text-center"
            style={{ animationDelay: "0.6s" }}
          >
            Entering the spatial narrative
          </p>

          <div className="anim-fade mt-8 w-48 sm:w-64 h-[1px] bg-white/10 rounded-full overflow-hidden" style={{ animationDelay: "0.8s" }}>
            <div
              className="anim-scale-x h-full bg-gradient-to-r from-transparent via-[var(--atmo-text)] to-transparent"
              style={{ boxShadow: "0 0 12px var(--atmo-glow)" }}
            />
          </div>

          <div className="anim-fade mt-8 flex items-center gap-2" style={{ animationDelay: "1.0s" }}>
            <span
              className="anim-dot w-1.5 h-1.5 rounded-full bg-[var(--atmo-text)] shadow-[0_0_8px_var(--atmo-glow)]"
              style={{ animationDelay: "1.1s" }}
            />
            <span className="text-[9px] font-mono uppercase tracking-widest text-white/40">
              Portal Active
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black cursor-pointer"
      onClick={handleSkip}
      title="Click to skip"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.9)_100%)]" />
      <div className="absolute inset-0 opacity-[0.04] mix-blend-overlay noise-overlay pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center justify-center px-6">
        <div
          className="w-24 h-px bg-white/20 mb-8 origin-left"
          style={{
            animation: "ink-fade 0.8s ease both, ink-scale-x 0.8s var(--ease-out-expo) both",
            animationDelay: "0.05s",
          }}
        />

        <div className="anim-blur text-center" style={{ animationDelay: "0.12s", animationDuration: "0.7s" }}>
          <h1
            className="text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-black italic uppercase leading-[0.85] tracking-tighter font-display bg-gradient-to-r from-white via-[var(--atmo-text)] to-[var(--atmo-text)] bg-clip-text text-transparent select-none"
            style={{ textShadow: "0 0 80px var(--atmo-glow)" }}
          >
            The Ink<br />Home
          </h1>
        </div>

        <p
          className="anim-fade mt-6 text-[10px] sm:text-xs font-mono uppercase tracking-[0.3em] text-white/50 text-center max-w-md"
          style={{ animationDelay: "0.7s" }}
        >
          Initializing spatial narrative matrix
        </p>

        <div
          className="anim-fade mt-10 w-64 sm:w-80 h-[2px] bg-white/5 rounded-full overflow-hidden"
          style={{ animationDelay: "0.75s" }}
        >
          <div
            className="h-full bg-gradient-to-r from-transparent via-[var(--atmo-text)] to-transparent origin-left"
            style={{
              animation: phase === "enter"
                ? "ink-scale-x 0.4s ease-in-out both"
                : "ink-scale-x 0.7s ease-in-out 0.75s both",
              boxShadow: "0 0 12px var(--atmo-glow)",
            }}
          />
        </div>

        <div className="anim-fade absolute bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-2 text-[9px] font-mono uppercase tracking-[0.25em] text-white/30" style={{ animationDelay: "0.85s" }}>
          <span className="relative flex h-1.5 w-1.5">
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[var(--atmo-text)]" />
          </span>
          <span>System Online</span>
        </div>

        <div className="anim-fade-dim absolute bottom-4 left-0 right-0 text-center text-[8px] font-mono uppercase tracking-[0.25em] text-white/25" style={{ animationDelay: "0.3s" }}>
          — click to skip —
        </div>

        <div className="anim-fade-dim absolute top-8 left-8 w-8 h-8 border-l border-t border-white/20" style={{ animationDelay: "0.5s" }} />
        <div className="anim-fade-dim absolute top-8 right-8 w-8 h-8 border-r border-t border-white/20" style={{ animationDelay: "0.5s" }} />
        <div className="anim-fade-dim absolute bottom-8 left-8 w-8 h-8 border-l border-b border-white/20" style={{ animationDelay: "0.5s" }} />
        <div className="anim-fade-dim absolute bottom-8 right-8 w-8 h-8 border-r border-b border-white/20" style={{ animationDelay: "0.5s" }} />
      </div>
    </div>
  );
}
