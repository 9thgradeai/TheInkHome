import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";

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

    const t1 = setTimeout(() => setPhase("reveal"), 150);
    const t2 = setTimeout(() => setPhase("enter"), 900);
    const t3 = setTimeout(() => onComplete(), 2000);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [onComplete, isWelcomeHome]);

  if (isWelcomeHome) {
    return (
      <AnimatePresence>
        {phase !== "done" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.95, filter: "blur(5px)" }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black cursor-pointer"
            onClick={handleSkip}
            title="Click to skip"
          >
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,0.6)_0%,rgba(0,0,0,0.95)_100%)]" />
            <div className="absolute inset-0 opacity-[0.03] mix-blend-overlay noise-overlay pointer-events-none" />
            
            <div className="relative z-10 flex flex-col items-center justify-center px-6">
              <motion.div
                initial={{ opacity: 0, scale: 0.7, filter: "blur(12px)" }}
                animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className="text-center"
              >
                <motion.h1
                  className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black italic uppercase leading-[0.85] tracking-tighter font-display bg-gradient-to-r from-white via-[var(--atmo-text)] to-[var(--atmo-text)] bg-clip-text text-transparent select-none"
                  style={{ textShadow: "0 0 40px var(--atmo-glow)" }}
                  initial={{ letterSpacing: "0.2em" }}
                  animate={{ letterSpacing: "0.05em" }}
                  transition={{ duration: 1, ease: "easeOut" }}
                >
                  <motion.span
                    initial={{ opacity: 0, y: 30, display: "inline-block" }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.1 }}
                  >
                    Welcome
                  </motion.span>
                  <br />
                  <motion.span
                    initial={{ opacity: 0, y: 30, display: "inline-block" }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                  >
                    Home
                  </motion.span>
                </motion.h1>
              </motion.div>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.6, ease: "easeOut" }}
                className="mt-6 text-[10px] sm:text-xs font-mono uppercase tracking-[0.2em] text-[var(--atmo-text)] text-center"
              >
                Entering the spatial narrative
              </motion.p>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="mt-8 w-48 sm:w-64 h-[1px] bg-white/10 rounded-full overflow-hidden"
              >
                <motion.div
                  initial={{ scaleX: 0, filter: "blur(2px)" }}
                  animate={{ scaleX: 1, filter: "blur(0px)" }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  className="h-full bg-gradient-to-r from-transparent via-[var(--atmo-text)] to-transparent origin-left"
                  style={{ boxShadow: "0 0 12px var(--atmo-glow)" }}
                />
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.0 }}
                className="mt-8 flex items-center gap-2"
              >
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.4, delay: 1.1, ease: "easeOut" }}
                  className="w-1.5 h-1.5 rounded-full bg-[var(--atmo-text)] shadow-[0_0_8px_var(--atmo-glow)]"
                />
                <span className="text-[9px] font-mono uppercase tracking-widest text-white/40">
                  Portal Active
                </span>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  }

  return (
    <AnimatePresence>
      {phase !== "done" && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.05 }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black cursor-pointer"
          onClick={handleSkip}
          title="Click to skip"
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.9)_100%)]" />
          <div className="absolute inset-0 opacity-[0.04] mix-blend-overlay noise-overlay pointer-events-none" />

          <div className="relative z-10 flex flex-col items-center justify-center px-6">
            <motion.div
              initial={{ opacity: 0, scaleX: 0 }}
              animate={{ opacity: 1, scaleX: 1 }}
              transition={{ duration: 0.8, delay: 0.1 }}
              className="w-24 h-px bg-white/20 mb-8 origin-left"
            />

            <motion.div
              initial={{ opacity: 0, y: 40, filter: "blur(12px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{ duration: 1, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="text-center"
            >
              <h1
                className="text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-black italic uppercase leading-[0.85] tracking-tighter font-display bg-gradient-to-r from-white via-[var(--atmo-text)] to-[var(--atmo-text)] bg-clip-text text-transparent select-none"
                style={{ textShadow: "0 0 80px var(--atmo-glow)" }}
              >
                The Ink<br />Home
              </h1>
            </motion.div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 1.1 }}
              className="mt-6 text-[10px] sm:text-xs font-mono uppercase tracking-[0.3em] text-white/50 text-center max-w-md"
            >
              Initializing spatial narrative matrix
            </motion.p>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.4 }}
              className="mt-10 w-64 sm:w-80 h-[2px] bg-white/5 rounded-full overflow-hidden"
            >
              <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: phase === "enter" ? 1 : 0.6 }}
                transition={{
                  duration: phase === "enter" ? 0.6 : 2.2,
                  ease: "easeInOut",
                }}
                className="h-full bg-gradient-to-r from-transparent via-[var(--atmo-text)] to-transparent origin-left"
                style={{ boxShadow: "0 0 12px var(--atmo-glow)" }}
              />
            </motion.div>

<motion.div
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               transition={{ delay: 1.6 }}
               className="absolute bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-2 text-[9px] font-mono uppercase tracking-[0.25em] text-white/30"
             >
               <span className="relative flex h-1.5 w-1.5">
                 <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[var(--atmo-text)]" />
               </span>
               <span>System Online</span>
             </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              transition={{ delay: 0.5, duration: 0.6 }}
              className="absolute bottom-4 left-0 right-0 text-center text-[8px] font-mono uppercase tracking-[0.25em] text-white/25"
            >
              — click to skip —
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              transition={{ delay: 0.8, duration: 1 }}
              className="absolute top-8 left-8 w-8 h-8 border-l border-t border-white/20"
            />
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              transition={{ delay: 0.8, duration: 1 }}
              className="absolute top-8 right-8 w-8 h-8 border-r border-t border-white/20"
            />
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              transition={{ delay: 0.8, duration: 1 }}
              className="absolute bottom-8 left-8 w-8 h-8 border-l border-b border-white/20"
            />
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              transition={{ delay: 0.8, duration: 1 }}
              className="absolute bottom-8 right-8 w-8 h-8 border-r border-b border-white/20"
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}