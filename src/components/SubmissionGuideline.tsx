import { useState } from "react";
import { motion, AnimatePresence } from "../lib/motion";
import { 
  BookOpen, 
  ExternalLink, 
  Heart, 
  Sparkles, 
  Cpu, 
  Brain, 
  Feather, 
  CheckCircle2, 
  ArrowRight, 
  MessageSquare,
  Bookmark,
  Users,
  Compass,
  FileText,
  AlertTriangle
} from "lucide-react";

export default function SubmissionGuideline() {
  // Checklist State for user interaction
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({
    genuine: false,
    original: false,
    length: false,
    format: false,
    credits: false,
    proofread: false,
  });

  const [claps, setClaps] = useState(0);

  const toggleCheck = (id: string) => {
    setCheckedItems(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const checklistProgress = Object.values(checkedItems).filter(Boolean).length;
  const checklistTotal = Object.keys(checkedItems).length;
  const isReady = checklistProgress === checklistTotal;

  const topics = [
    {
      title: "Personal Growth & Life",
      desc: "Vulnerable, honest stories on growth, identity, life, love, loss, and life's small moments.",
      icon: Heart,
      color: "from-pink-500/20 to-rose-500/20"
    },
    {
      title: "Creative Nonfiction & Experience",
      desc: "Real-life events told with narrative craftsmanship and raw, authentic emotion.",
      icon: Sparkles,
      color: "from-purple-500/20 to-indigo-500/20"
    },
    {
      title: "Mental Health & Healing",
      desc: "Reflections on self-recovery, mental wellness, and navigating life's challenges.",
      icon: Brain,
      color: "from-teal-500/20 to-emerald-500/20"
    },
    {
      title: "Technology, AI & Innovation",
      desc: "Fresh perspectives on how emerging digital matrices alter our creative and human realities.",
      icon: Cpu,
      color: "from-[var(--atmo-text)]/20 to-blue-500/20"
    },
    {
      title: "Writing & Creative Journey",
      desc: "Tips, reflections, lessons, and insights gained from your own creative endeavors.",
      icon: Feather,
      color: "from-amber-500/20 to-orange-500/20"
    },
    {
      title: "Faith, Philosophy & Purpose",
      desc: "Thoughtful explorations of meaning, belief, morality, and deep existential questions.",
      icon: Compass,
      color: "from-indigo-500/20 to-violet-500/20"
    }
  ];

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-12 sm:space-y-16 lg:space-y-20 text-white" id="guidelines-page-root">
      
      {/* 1. CINEMATIC HERO */}
      <section className="relative overflow-hidden border border-white/10 bg-black/60 backdrop-blur-md p-6 sm:p-8 md:p-12 lg:p-16 rounded-none space-y-6 sm:space-y-8 shadow-[0_0_50px_rgba(6,182,212,0.05)]">
        <div className="absolute top-0 left-0 w-1.5 h-full bg-[var(--atmo-text)]" />
        <div className="absolute top-0 right-0 p-4 font-mono text-[9px] text-[var(--atmo-text)]/40 uppercase tracking-[0.2em] hidden sm:block">
          PROTOCOL: SUBMISSION_GUIDELINES
        </div>

        <div className="max-w-3xl space-y-6">
          <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-[var(--atmo-text)] block">
            Official Guidelines
          </span>
          <h1 className="font-sans font-black text-4xl sm:text-5xl md:text-6xl tracking-tighter uppercase italic leading-none text-white">
            Your Voice <span className="text-[var(--atmo-text)]">Matters</span> Here
          </h1>
          <p className="text-base md:text-lg text-slate-300 font-light leading-relaxed tracking-wide italic">
            “The Ink Home is a reflective space where raw honesty meets thoughtful storytelling. Whether you are an experienced scribe or just starting, we welcome you to share the words that linger in your heart.”
          </p>
          <div className="flex flex-wrap items-center gap-3 pt-2 text-[10px] font-mono text-slate-400 uppercase tracking-widest">
            <span className="flex items-center gap-1.5 px-2.5 py-1 bg-white/5 border border-white/10">
              <span className="w-1.5 h-1.5 bg-green-400 rounded-full" />
              Latest Update: Dec 3, 2025
            </span>
            <span className="flex items-center gap-1.5 px-2.5 py-1 bg-white/5 border border-white/10">
              Reading Time: ~4 min
            </span>
          </div>
        </div>
      </section>

      {/* 2. NOTE FROM THE EDITOR */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-stretch">
        <div className="lg:col-span-7 p-5 sm:p-6 md:p-8 border border-white/10 bg-black/80 backdrop-blur-md flex flex-col justify-center space-y-4 sm:space-y-6">
          <h2 className="font-sans font-bold text-xl sm:text-2xl uppercase tracking-tight text-white flex items-center gap-2 sm:gap-3">
            <Feather className="w-5 h-5 sm:w-6 sm:h-6 text-[var(--atmo-text)]" />
            A Note from the Editor
          </h2>
          <div className="space-y-3 sm:space-y-4 text-xs sm:text-sm text-slate-300 leading-relaxed font-light">
            <p>
              I created <span className="text-white font-semibold">The Ink Home</span> as a simple idea that is quickly turning into something beautiful. I have already welcomed many wonderful writers to join this home. Now, it's time to share official guidelines on how you can contribute your voice to our growing ecosystem.
            </p>
            <p>
              This publication was built with one core intention: <span className="text-[var(--atmo-text)] italic">to give writers a home for their thoughts</span> — a safe, reflective space where vulnerable sincerity beats perfect polish every time.
            </p>
          </div>
        </div>
        
        <div className="lg:col-span-5 p-5 sm:p-6 md:p-8 border border-white/10 bg-white/[0.01] backdrop-blur-md flex flex-col justify-between space-y-4 sm:space-y-6">
          <div className="space-y-2">
            <span className="font-mono text-[9px] uppercase tracking-widest text-slate-500">Editorial Board</span>
            <h3 className="font-sans font-bold text-xl uppercase tracking-wide text-white">Curating team</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              We read every submission thoroughly. Our goal is always to amplify and honor your unique perspective.
            </p>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="flex -space-x-4">
              <img 
                src="https://miro.medium.com/v2/resize:fit:2400/1*OonAmXM0uBzGf_KYL3s85w.png" 
                alt="Farhan Kabir" 
                className="w-12 h-12 rounded-none object-cover border-2 border-[var(--atmo-border)]"
              />
              <img 
                src="https://miro.medium.com/v2/resize:fit:2400/1*4o35ax2_LSaOtP-3Lfi0Eg.jpeg" 
                alt="Dua Batool" 
                className="w-12 h-12 rounded-none object-cover border-2 border-purple-500/40"
              />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-white">Farhan Kabir & Dua Batool</p>
              <p className="text-[10px] font-mono text-[var(--atmo-text)] uppercase tracking-widest">Co-Editors-in-Chief</p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. WHAT WE PUBLISH */}
      <section className="space-y-8">
        <div className="border-b border-white/10 pb-4">
          <h2 className="font-sans font-bold text-2xl uppercase tracking-tight text-white flex items-center gap-3">
            <BookOpen className="w-6 h-6 text-[var(--atmo-text)]" />
            What We Publish
          </h2>
          <p className="font-mono text-[10px] text-slate-400 uppercase tracking-widest mt-1">
            We welcome stories that touch hearts — honest, real, and heartfelt.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {topics.map((topic, index) => {
            const Icon = topic.icon;
            return (
              <motion.div
                key={index}
                whileHover={{ y: -4, borderColor: "rgba(34, 211, 238, 0.3)" }}
                className="p-4 sm:p-6 border border-white/10 bg-black/60 backdrop-blur-md space-y-3 sm:space-y-4 transition-colors flex flex-col justify-between"
              >
                <div className="space-y-2 sm:space-y-3">
                  <div className={`w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center bg-gradient-to-br ${topic.color} border border-white/10`}>
                    <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                  </div>
                  <h3 className="font-sans font-bold text-sm sm:text-base uppercase tracking-wide text-white">
                    {topic.title}
                  </h3>
                  <p className="text-[11px] sm:text-xs text-slate-400 leading-relaxed font-light">
                    {topic.desc}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Warning Callout */}
        <div className="p-5 border border-amber-500/20 bg-amber-950/5 flex items-start gap-4">
          <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-sans font-bold text-xs uppercase tracking-wider text-amber-500">Content Note</h4>
            <p className="text-xs text-slate-400 leading-relaxed font-light">
              We do not publish political stories unless they are highly inspiring and focus directly on lessons derived from human experiences. We want to be a place to breathe, not a place for noise.
            </p>
          </div>
        </div>
      </section>

      {/* 4. WRITING GUIDELINES - INTERACTIVE CHECKS */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-stretch">
        <div className="lg:col-span-5 border border-white/10 bg-black/80 backdrop-blur-md p-5 sm:p-6 md:p-8 flex flex-col justify-between space-y-6 sm:space-y-8">
          <div className="space-y-3 sm:space-y-4">
            <span className="font-mono text-[8px] sm:text-[9px] uppercase tracking-widest text-slate-500">Draft Audit</span>
            <h2 className="font-sans font-bold text-xl sm:text-2xl uppercase tracking-tight text-white leading-none">
              Is Your Story Ready?
            </h2>
            <p className="text-[11px] sm:text-xs text-slate-400 leading-relaxed font-light">
              Check off the guidelines below to test if your draft meets the curatorial expectations of The Ink Home.
            </p>
          </div>

          {/* Dynamic Progress indicator */}
          <div className="space-y-3">
            <div className="flex justify-between text-[10px] font-mono uppercase tracking-widest text-slate-400">
              <span>Audit Progress</span>
              <span>{checklistProgress} / {checklistTotal} Checked</span>
            </div>
            
            <div className="w-full h-1.5 bg-white/5 border border-white/10 rounded-full overflow-hidden">
              <div 
                className="h-full bg-[var(--atmo-text)] transition-all duration-300 shadow-[0_0_8px_var(--atmo-glow)]" 
                style={{ width: `${(checklistProgress / checklistTotal) * 100}%` }}
              />
            </div>

            <AnimatePresence mode="wait">
              {isReady ? (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="p-3 bg-[var(--atmo-surface)] border border-[var(--atmo-border)] text-[var(--atmo-text)] text-[10px] font-mono uppercase tracking-wider text-center"
                >
                  🎉 Ready for Submission!
                </motion.div>
              ) : (
                <div className="h-9" /> // spacer
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="lg:col-span-7 border border-white/10 bg-black/60 backdrop-blur-md p-5 sm:p-6 md:p-8 space-y-3 sm:space-y-4">
          <h3 className="font-sans font-bold text-base sm:text-lg uppercase tracking-wide text-white border-b border-white/5 pb-2">
            Writing Specifications
          </h3>

          <div className="space-y-2 sm:space-y-3 custom-scrollbar overflow-y-auto max-h-[280px] sm:max-h-[350px] pr-1 sm:pr-2">
            {/* Spec 1 */}
            <div 
              onClick={() => toggleCheck("genuine")}
              className={`p-2.5 sm:p-3 border transition-all cursor-pointer flex items-start gap-2 sm:gap-3 select-none ${
                checkedItems.genuine 
                  ? "border-[var(--atmo-border)] bg-[var(--atmo-surface)]" 
                  : "border-white/5 bg-white/[0.01] hover:border-white/20"
              }`}
            >
              <div className="mt-0.5">
                <div className={`w-3.5 h-3.5 sm:w-4 sm:h-4 border flex items-center justify-center transition-colors ${
                  checkedItems.genuine ? "border-[var(--atmo-text)] bg-[var(--atmo-text)] text-black" : "border-slate-600"
                }`}>
                  {checkedItems.genuine && <CheckCircle2 className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-black stroke-[3px]" />}
                </div>
              </div>
              <div>
                <h4 className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-white">Be Genuine & Human-First</h4>
                <p className="text-[10px] sm:text-[11px] text-slate-400 font-light mt-0.5">
                  Write from the heart. Honest, warm, and real beats perfect and dry every single time.
                </p>
              </div>
            </div>

            {/* Spec 2 */}
            <div 
              onClick={() => toggleCheck("original")}
              className={`p-3 border transition-all cursor-pointer flex items-start gap-3 select-none ${
                checkedItems.original 
                  ? "border-[var(--atmo-border)] bg-[var(--atmo-surface)]" 
                  : "border-white/5 bg-white/[0.01] hover:border-white/20"
              }`}
            >
              <div className="mt-0.5">
                <div className={`w-4 h-4 border flex items-center justify-center transition-colors ${
                  checkedItems.original ? "border-[var(--atmo-text)] bg-[var(--atmo-text)] text-black" : "border-slate-600"
                }`}>
                  {checkedItems.original && <CheckCircle2 className="w-3 h-3 text-black stroke-[3px]" />}
                </div>
              </div>
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-white">100% Original Work</h4>
                <p className="text-[11px] text-slate-400 font-light mt-0.5">
                  Strictly your own words. No copy-pasted text or generative AI outputs are permitted.
                </p>
              </div>
            </div>

            {/* Spec 3 */}
            <div 
              onClick={() => toggleCheck("original")}
              className={`p-2.5 sm:p-3 border transition-all cursor-pointer flex items-start gap-2 sm:gap-3 select-none ${
                checkedItems.original 
                  ? "border-[var(--atmo-border)] bg-[var(--atmo-surface)]" 
                  : "border-white/5 bg-white/[0.01] hover:border-white/20"
              }`}
            >
              <div className="mt-0.5">
                <div className={`w-3.5 h-3.5 sm:w-4 sm:h-4 border flex items-center justify-center transition-colors ${
                  checkedItems.original ? "border-[var(--atmo-text)] bg-[var(--atmo-text)] text-black" : "border-slate-600"
                }`}>
                  {checkedItems.original && <CheckCircle2 className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-black stroke-[3px]" />}
                </div>
              </div>
              <div>
                <h4 className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-white">100% Original Work</h4>
                <p className="text-[10px] sm:text-[11px] text-slate-400 font-light mt-0.5">
                  Strictly your own words. No copy-pasted text or generative AI outputs are permitted.
                </p>
              </div>
            </div>

            <div 
              onClick={() => toggleCheck("length")}
              className={`p-2.5 sm:p-3 border transition-all cursor-pointer flex items-start gap-2 sm:gap-3 select-none ${
                checkedItems.length 
                  ? "border-[var(--atmo-border)] bg-[var(--atmo-surface)]" 
                  : "border-white/5 bg-white/[0.01] hover:border-white/20"
              }`}
            >
              <div className="mt-0.5">
                <div className={`w-3.5 h-3.5 sm:w-4 sm:h-4 border flex items-center justify-center transition-colors ${
                  checkedItems.length ? "border-[var(--atmo-text)] bg-[var(--atmo-text)] text-black" : "border-slate-600"
                }`}>
                  {checkedItems.length && <CheckCircle2 className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-black stroke-[3px]" />}
                </div>
              </div>
              <div>
                <h4 className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-white">Minimum Length</h4>
                <p className="text-[10px] sm:text-[11px] text-slate-400 font-light mt-0.5">
                  Stories must contain at least 300 words. Write as long as your narrative naturally demands.
                </p>
              </div>
            </div>

            <div 
              onClick={() => toggleCheck("format")}
              className={`p-2.5 sm:p-3 border transition-all cursor-pointer flex items-start gap-2 sm:gap-3 select-none ${
                checkedItems.format 
                  ? "border-[var(--atmo-border)] bg-[var(--atmo-surface)]" 
                  : "border-white/5 bg-white/[0.01] hover:border-white/20"
              }`}
            >
              <div className="mt-0.5">
                <div className={`w-3.5 h-3.5 sm:w-4 sm:h-4 border flex items-center justify-center transition-colors ${
                  checkedItems.format ? "border-[var(--atmo-text)] bg-[var(--atmo-text)] text-black" : "border-slate-600"
                }`}>
                  {checkedItems.format && <CheckCircle2 className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-black stroke-[3px]" />}
                </div>
              </div>
              <div>
                <h4 className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-white">Clean Formatting</h4>
                <p className="text-[10px] sm:text-[11px] text-slate-400 font-light mt-0.5">
                  Use short paragraphs, readable subheadings, and clear formatting (moderate bold/italics).
                </p>
              </div>
            </div>

            <div 
              onClick={() => toggleCheck("credits")}
              className={`p-2.5 sm:p-3 border transition-all cursor-pointer flex items-start gap-2 sm:gap-3 select-none ${
                checkedItems.credits 
                  ? "border-[var(--atmo-border)] bg-[var(--atmo-surface)]" 
                  : "border-white/5 bg-white/[0.01] hover:border-white/20"
              }`}
            >
              <div className="mt-0.5">
                <div className={`w-3.5 h-3.5 sm:w-4 sm:h-4 border flex items-center justify-center transition-colors ${
                  checkedItems.credits ? "border-[var(--atmo-text)] bg-[var(--atmo-text)] text-black" : "border-slate-600"
                }`}>
                  {checkedItems.credits && <CheckCircle2 className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-black stroke-[3px]" />}
                </div>
              </div>
              <div>
                <h4 className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-white">Image Captions & AI Credits</h4>
                <p className="text-[10px] sm:text-[11px] text-slate-400 font-light mt-0.5">
                  Add 1-2 images with proper copyright credits. AI images are okay, but they must be labeled.
                </p>
              </div>
            </div>

            <div 
              onClick={() => toggleCheck("proofread")}
              className={`p-2.5 sm:p-3 border transition-all cursor-pointer flex items-start gap-2 sm:gap-3 select-none ${
                checkedItems.proofread 
                  ? "border-[var(--atmo-border)] bg-[var(--atmo-surface)]" 
                  : "border-white/5 bg-white/[0.01] hover:border-white/20"
              }`}
            >
              <div className="mt-0.5">
                <div className={`w-3.5 h-3.5 sm:w-4 sm:h-4 border flex items-center justify-center transition-colors ${
                  checkedItems.proofread ? "border-[var(--atmo-text)] bg-[var(--atmo-text)] text-black" : "border-slate-600"
                }`}>
                  {checkedItems.proofread && <CheckCircle2 className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-black stroke-[3px]" />}
                </div>
              </div>
              <div>
                <h4 className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-white">Read Aloud & Proofread</h4>
                <p className="text-[10px] sm:text-[11px] text-slate-400 font-light mt-0.5">
                  Take a moment to read your story aloud to verify smooth pacing and structural flow.
                </p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 5. HOW TO JOIN & SUBMIT */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
        
        {/* How to Join */}
        <div className="space-y-8">
          <div className="border-b border-white/10 pb-4">
            <h2 className="font-sans font-bold text-2xl uppercase tracking-tight text-white flex items-center gap-3">
              <Users className="w-6 h-6 text-[var(--atmo-text)]" />
              How to Join as a Writer
            </h2>
            <p className="font-mono text-[10px] text-slate-400 uppercase tracking-widest mt-1">
              Becoming a writer here is interactive and connection-first.
            </p>
          </div>

          <div className="space-y-6">
            {/* Step 1 */}
            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-none border border-[var(--atmo-text)] flex items-center justify-center font-mono text-xs text-[var(--atmo-text)] font-bold bg-[var(--atmo-surface)] flex-shrink-0">
                01
              </div>
              <div className="space-y-1.5">
                <h4 className="text-sm font-bold uppercase tracking-wider text-white">Follow the Publication</h4>
                <p className="text-xs text-slate-400 leading-relaxed font-light">
                  Follow <a href="https://medium.com/the-ink-home" target="_blank" rel="noopener noreferrer" className="text-[var(--atmo-text)] hover:underline inline-flex items-center gap-0.5">The Ink Home on Medium<ExternalLink className="w-2.5 h-2.5" /></a> so you stay in sync with the community nodes.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-none border border-[var(--atmo-text)] flex items-center justify-center font-mono text-xs text-[var(--atmo-text)] font-bold bg-[var(--atmo-surface)] flex-shrink-0">
                02
              </div>
              <div className="space-y-1.5">
                <h4 className="text-sm font-bold uppercase tracking-wider text-white">Show Your Support (Clap!)</h4>
                <p className="text-xs text-slate-400 leading-relaxed font-light">
                  Clap for the submission guideline story on Medium. You can click here to warm up your claps:
                </p>
                <div className="flex items-center gap-3 pt-1">
                  <button 
                    onClick={() => setClaps(prev => Math.min(prev + 1, 50))}
                    className="px-4 py-1.5 border border-[var(--atmo-border)] text-[var(--atmo-text)] hover:bg-[var(--atmo-text)] hover:text-black font-mono text-[9px] uppercase tracking-wider transition-colors cursor-pointer"
                  >
                    👏 Clap ({claps})
                  </button>
                  {claps > 0 && (
                    <span className="text-[10px] font-mono text-slate-500 italic">
                      {claps === 50 ? "Maxed! You're awesome!" : "Keep going, up to 50!"}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-none border border-[var(--atmo-text)] flex items-center justify-center font-mono text-xs text-[var(--atmo-text)] font-bold bg-[var(--atmo-surface)] flex-shrink-0">
                03
              </div>
              <div className="space-y-1.5">
                <h4 className="text-sm font-bold uppercase tracking-wider text-white">Leave a Comment</h4>
                <p className="text-xs text-slate-400 leading-relaxed font-light flex items-center gap-1">
                  Leave a comment under the guideline story. Once we reply, you'll be officially enrolled!
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* How to Submit */}
        <div className="space-y-8">
          <div className="border-b border-white/10 pb-4">
            <h2 className="font-sans font-bold text-2xl uppercase tracking-tight text-white flex items-center gap-3">
              <FileText className="w-6 h-6 text-[var(--atmo-text)]" />
              How to Submit
            </h2>
            <p className="font-mono text-[10px] text-slate-400 uppercase tracking-widest mt-1">
              The workflow once you are registered as a writer.
            </p>
          </div>

          <div className="relative border-l border-white/10 pl-6 ml-4 space-y-8">
            {/* Submission step A */}
            <div className="relative">
              <div className="absolute -left-9 top-0 w-6 h-6 rounded-none border border-white/10 bg-[#050505] flex items-center justify-center text-[10px] font-mono text-slate-400">
                A
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold uppercase tracking-wider text-white">Request to Contribute</h4>
                <p className="text-xs text-slate-400 leading-relaxed font-light">
                  Request to write for The Ink Home via Medium platform tools.
                </p>
              </div>
            </div>

            {/* Submission step B */}
            <div className="relative">
              <div className="absolute -left-9 top-0 w-6 h-6 rounded-none border border-white/10 bg-[#050505] flex items-center justify-center text-[10px] font-mono text-slate-400">
                B
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold uppercase tracking-wider text-white">Submit Your Draft</h4>
                <p className="text-xs text-slate-400 leading-relaxed font-light">
                  Once added to the publication roster, submit your unpublished draft directly to The Ink Home on Medium.
                </p>
              </div>
            </div>

            {/* Submission step C */}
            <div className="relative">
              <div className="absolute -left-9 top-0 w-6 h-6 rounded-none border border-white/10 bg-[#050505] flex items-center justify-center text-[10px] font-mono text-slate-400">
                C
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold uppercase tracking-wider text-white">Editorial Review</h4>
                <p className="text-xs text-slate-400 leading-relaxed font-light">
                  Our editors will review your piece quickly. If any edits are suggested, they will be minimal to enhance your voice, not alter it.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. COMMUNITY VALUES */}
      <section className="p-8 border border-white/10 bg-black/80 backdrop-blur-md space-y-6">
        <h2 className="font-sans font-bold text-xl uppercase tracking-tight text-white flex items-center gap-2">
          <Bookmark className="w-5 h-5 text-[var(--atmo-text)]" />
          Our Community Values
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
          <div className="p-4 border border-white/5 bg-white/[0.01]">
            <h4 className="font-sans font-bold text-xs uppercase tracking-wider text-white">We Chase Truth, Not Trends</h4>
            <p className="text-xs text-slate-400 leading-relaxed font-light mt-1">
              We focus on write-ups that explore real emotions, authentic reflections, and genuine experiences rather than clickbait trends.
            </p>
          </div>

          <div className="p-4 border border-white/5 bg-white/[0.01]">
            <h4 className="font-sans font-bold text-xs uppercase tracking-wider text-white">Empathy & Respect</h4>
            <p className="text-xs text-slate-400 leading-relaxed font-light mt-1">
              Every narrative should reflect kindness and concern, even when introducing challenges or philosophical questions.
            </p>
          </div>

          <div className="p-4 border border-white/5 bg-white/[0.01]">
            <h4 className="font-sans font-bold text-xs uppercase tracking-wider text-white">A Reflective Sanctuary</h4>
            <p className="text-xs text-slate-400 leading-relaxed font-light mt-1">
              We stand firm against hate speech, discrimination, and noise. We aim to protect this space as a comforting home for all.
            </p>
          </div>
        </div>
      </section>

      {/* 7. HERO CTA */}
      <section className="text-center py-12 space-y-6 max-w-xl mx-auto border-t border-white/10">
        <h3 className="font-sans font-bold text-2xl uppercase tracking-wider text-white">
          Ready to submit?
        </h3>
        <p className="text-xs text-slate-400 leading-relaxed font-light">
          "Writing is a quiet act of courage — and The Ink Home is here to honor that bravery. Your words don't have to be perfect, they just have to be yours."
        </p>
        <div className="pt-2 flex justify-center gap-4 flex-wrap">
          <a
            href="https://medium.com/the-ink-home/submission-guidelines-the-ink-home-5a5bfc59eefd"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 bg-white text-black font-sans font-bold text-xs uppercase tracking-widest transition-all duration-300 hover:bg-[var(--atmo-text)] hover:text-black hover:shadow-[0_0_15px_var(--atmo-glow)]"
          >
            Read Story on Medium
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </section>

    </div>
  );
}
