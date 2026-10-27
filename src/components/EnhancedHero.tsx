import { motion } from "motion/react";
import { ArrowDownRight, ArrowUpRight, Sparkles, BookOpen } from "lucide-react";
import { Suspense, lazy } from "react";

const Hero3DCanvas = lazy(() => import("./Hero3DCanvas"));

const EASE = [0.16, 1, 0.3, 1] as const;

interface EnhancedHeroProps {
  storyCount: number;
  contributorCount: number;
  loading: boolean;
  onNavigate: (path: string) => void;
}

export default function EnhancedHero({ storyCount, contributorCount, loading, onNavigate }: EnhancedHeroProps) {
  return (
    <section className="relative min-h-screen overflow-hidden flex items-center">
      {/* Animated background */}
      <div className="absolute inset-0">
        <div
          className="absolute inset-0"
          style={{
            background: `
              radial-gradient(ellipse 80% 60% at 20% 10%, rgba(200,255,77,0.12), transparent 70%),
              radial-gradient(ellipse 60% 80% at 80% 90%, rgba(167,139,250,0.12), transparent 70%),
              radial-gradient(ellipse 100% 100% at 50% 50%, transparent, rgba(8,8,10,0.8))
            `,
          }}
        />
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(200,255,77,0.3) 1px, transparent 1px),
              linear-gradient(90deg, rgba(200,255,77,0.3) 1px, transparent 1px)
            `,
            backgroundSize: "100px 100px",
            maskImage: "radial-gradient(ellipse at 50% 50%, black, transparent 80%)",
          }}
        />
      </div>

      {/* 3D Canvas */}
      <Suspense fallback={null}>
        <Hero3DCanvas />
      </Suspense>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-8 w-full z-10">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: EASE }}
              className="flex flex-wrap items-center gap-3 mb-8"
            >
              <div className="flex items-center gap-2 rounded-full border border-[#c8ff4d]/30 bg-[#c8ff4d]/10 px-4 py-2 backdrop-blur-sm">
                <Sparkles className="h-3.5 w-3.5 text-[#c8ff4d]" />
                <span className="font-mono text-[9px] uppercase tracking-[0.22em] text-[#c8ff4d]">
                  Medium Publication
                </span>
              </div>
              <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.02] px-4 py-2 backdrop-blur-sm">
                <div className="relative flex h-1.5 w-1.5">
                  <div className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#c8ff4d] opacity-60" />
                  <div className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#c8ff4d]" />
                </div>
                <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-white/60">
                  {loading ? "Syncing..." : `${storyCount} Stories`}
                </span>
              </div>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.1, ease: EASE }}
              className="font-display text-[clamp(3rem,8vw,6rem)] font-black leading-[0.88] tracking-[-0.06em] text-white mb-8"
            >
              Where words
              <br />
              <span className="relative">
                <span className="bg-gradient-to-r from-[#c8ff4d] via-white to-[#a78bfa] bg-clip-text text-transparent">
                  feel at home
                </span>
                <motion.svg
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 1.5, delay: 0.8, ease: "easeInOut" }}
                  className="absolute -bottom-2 left-0 w-full h-3"
                  viewBox="0 0 400 12"
                  fill="none"
                  preserveAspectRatio="none"
                >
                  <motion.path
                    d="M2 9C80 3 160 3 220 6C280 9 340 8 398 4"
                    stroke="url(#gradient)"
                    strokeWidth="3"
                    strokeLinecap="round"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 1.5, delay: 0.8 }}
                  />
                  <defs>
                    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#c8ff4d" />
                      <stop offset="50%" stopColor="#ffffff" />
                      <stop offset="100%" stopColor="#a78bfa" />
                    </linearGradient>
                  </defs>
                </motion.svg>
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 25 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 0.3, ease: EASE }}
              className="text-lg sm:text-xl leading-relaxed text-white/60 mb-10 max-w-lg"
            >
              An independent sanctuary for essays on technology, culture, creativity, and the 
              quiet moments that shape us. Where every story finds its place.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 25 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 0.5, ease: EASE }}
              className="flex flex-wrap gap-4 mb-12"
            >
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onNavigate("/#latest")}
                className="group relative overflow-hidden flex items-center gap-3 rounded-full bg-gradient-to-r from-[#c8ff4d] to-[#a8e63c] px-8 py-4 text-black font-bold uppercase tracking-[0.14em] text-[11px] shadow-[0_20px_60px_-20px_rgba(200,255,77,0.6)]"
              >
                <span className="relative z-10">Explore Stories</span>
                <ArrowDownRight className="h-4 w-4 relative z-10 transition-transform group-hover:translate-x-1 group-hover:translate-y-1" />
                <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onNavigate("/writers")}
                className="group flex items-center gap-3 rounded-full border border-white/20 bg-white/[0.02] backdrop-blur-sm px-8 py-4 text-white/90 font-bold uppercase tracking-[0.14em] text-[11px] hover:border-[#c8ff4d]/50 hover:bg-[#c8ff4d]/5 transition-all duration-300"
              >
                <span>Meet Writers</span>
                <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-1 group-hover:translate-x-1" />
              </motion.button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 0.7 }}
              className="grid grid-cols-3 gap-8 max-w-md"
            >
              {[
                { value: storyCount, label: "Stories" },
                { value: contributorCount, label: "Contributors" },
                { value: "∞", label: "Possibilities" },
              ].map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.8 + index * 0.1 }}
                  className="text-center lg:text-left"
                >
                  <div className="font-display text-3xl sm:text-4xl font-black text-white mb-2">
                    {typeof stat.value === 'number' ? stat.value.toString().padStart(2, '0') : stat.value}
                  </div>
                  <div className="font-mono text-[8px] uppercase tracking-[0.18em] text-white/40">
                    {stat.label}
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>

          <div className="hidden lg:block relative">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1.2, delay: 0.4, ease: EASE }}
              className="relative aspect-square"
            >
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#c8ff4d]/20 via-transparent to-[#a78bfa]/20 blur-3xl" />
              <div className="absolute inset-8 rounded-full border border-[#c8ff4d]/20" />
              <div className="absolute inset-16 rounded-full border border-white/10" />
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0"
              >
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-[#c8ff4d] shadow-[0_0_20px_rgba(200,255,77,0.8)]" />
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-2 h-2 rounded-full bg-[#a78bfa] shadow-[0_0_15px_rgba(167,139,250,0.8)]" />
                <div className="absolute left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-white shadow-[0_0_15px_rgba(255,255,255,0.6)]" />
              </motion.div>
              <div className="absolute inset-0 flex items-center justify-center">
                <BookOpen className="h-24 w-24 text-[#c8ff4d]/80" />
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 1.2 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/40"
      >
        <span className="font-mono text-[8px] uppercase tracking-[0.2em]">Scroll to explore</span>
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="w-px h-8 bg-gradient-to-b from-white/40 to-transparent"
        />
      </motion.div>
    </section>
  );
}
