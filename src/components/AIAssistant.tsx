import React, { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  ArrowRight,
  Bot,
  Copy,
  MessageCircle,
  Send,
  Sparkles,
  X,
} from "lucide-react";
import { askAI, INK_HOME_KB } from "../lib/ai";

const QUICK_QUESTIONS = [
  "How do I become a writer here?",
  "What are the submission guidelines?",
  "What topics do you publish?",
  "Who are the editors?",
  "How do I submit my draft?",
  "How do I contact the publication?",
];

interface AIAssistantProps {
  openByDefault?: boolean;
}

export default function AIAssistant({ openByDefault = false }: AIAssistantProps) {
  const [open, setOpen] = useState(openByDefault);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<{ role: "user" | "assistant"; content: string }[]>([
    {
      role: "assistant",
      content:
        "Hi! I'm Ink Assistant. Ask me about The Ink Home — submission guidelines, how to become a writer, or anything about the publication.",
    },
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const scrollBottom = useCallback(() => {
    if (panelRef.current) {
      panelRef.current.scrollTop = panelRef.current.scrollHeight;
    }
  }, []);

  useEffect(() => {
    scrollBottom();
  }, [messages, scrollBottom]);

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMessage = { role: "user" as const, content: text };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setError(null);
    setLoading(true);

    try {
      const reply = await askAI(
        [
          {
            role: "system",
            content: `You are Ink Assistant for The Ink Home. ${JSON.stringify(INK_HOME_KB)}`,
          },
          ...messages,
          userMessage,
        ],
        { onError: setError },
      );
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
    } catch {
      // error already set by askAI via onError
    } finally {
      setLoading(false);
    }
  }, [input, loading, messages]);

  const handleQuick = useCallback((question: string) => {
    setInput(question);
    handleSend();
  }, [handleSend]);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        handleSend();
      }
    },
    [handleSend],
  );

  return (
    <>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-8 right-8 z-[100] flex h-14 w-14 items-center justify-center rounded-full bg-[#c8ff4d] text-black shadow-[0_10px_30px_-10px_rgba(200,255,77,0.35)] transition-all duration-300 hover:scale-105 hover:shadow-[0_15px_40px_-10px_rgba(200,255,77,0.45)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c8ff4d] focus-visible:ring-offset-2"
          aria-label="Open AI Assistant"
        >
          <Bot className="h-6 w-6" />
          <span className="absolute -right-3 -top-3 flex h-5 w-5 items-center justify-center rounded-full bg-[#08080a] px-1 text-[10px] font-bold text-[#c8ff4d] border border-[#c8ff4d]/30">
            AI
          </span>
        </button>
      )}

      <AnimatePresence>
        {open && (
          <>
            <button
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm transition-opacity"
              aria-label="Close assistant"
            />
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              transition={{ duration: 0.25 }}
              className="fixed bottom-8 right-8 z-[100] w-full max-w-[420px] h-[560px] md:h-[640px] flex flex-col rounded-3xl border border-white/10 bg-[#0b0c0f] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.7)] overflow-hidden flex-shrink-0"
            >
              <div className="flex items-center justify-between border-b border-white/10 bg-[#0a0b0d]/60 backdrop-blur p-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/10 text-[#c8ff4d]">
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="font-display text-sm font-bold text-white tracking-tight">
                      Ink Assistant
                    </div>
                    <div className="text-[9px] text-[#c8ff4d]/70 uppercase tracking-[0.16em]">
                      The Ink Home AI
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  className="h-8 w-8 flex items-center justify-center rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors"
                  aria-label="Close assistant"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-5 custom-scrollbar" ref={panelRef}>
                {error && (
                  <div className="mb-4 rounded-lg border border-amber-500/30 bg-amber-900/20 p-3 text-[11px] text-amber-300">
                    {error}
                  </div>
                )}

                <div className="mb-6 flex flex-col gap-2 text-[10px] font-mono uppercase tracking-[0.2em] text-white/25">
                  {QUICK_QUESTIONS.map((q) => (
                    <button
                      key={q}
                      onClick={() => handleQuick(q)}
                      className="flex items-center gap-2 rounded-full border border-white/10 px-3 py-1.5 text-[10px] text-white/60 transition-colors hover:border-white/30 hover:text-white"
                    >
                      <MessageCircle className="h-3 w-3" /> {q}
                    </button>
                  ))}
                </div>

                <div className="space-y-4">
                  {messages.map((m, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`max-w-[88%] ${
                        m.role === "user"
                          ? "ml-auto text-right"
                          : "mr-auto text-left"
                      }`}
                    >
                      <div
                        className={`inline-block rounded-2xl p-4 text-sm leading-relaxed ${
                          m.role === "user"
                            ? "bg-[#c8ff4d] text-black"
                            : "border border-white/10 bg-[#0a0b0d]/60 text-white/90"
                        }`}
                      >
                        {m.content}
                      </div>
                      <span className="mt-1 block text-[9px] font-mono">
                        {m.role === "user" ? "You" : "Ink Assistant"}
                      </span>
                    </motion.div>
                  ))}
                  {loading && (
                    <div className="max-w-[70%] mr-auto flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full border border-white/10 border-t-[#c8ff4d] animate-spin" />
                      <span className="text-[11px] text-white/40 uppercase tracking-[0.14em] font-mono">
                        typing
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  handleSend();
                }}
                className="border-t border-white/10 bg-[#0a0b0d]/60 backdrop-blur p-4"
              >
                <div className="flex items-center gap-2 rounded-xl border border-white/15 bg-white/[0.02] px-3 py-2.5 focus-within:border-[#c8ff4d]/60 focus-within:ring-1 focus-within:ring-[#c8ff4d]/40">
                  <input
                    ref={inputRef}
                    value={input}
                    onChange={(event) => setInput(event.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask about submissions, writers, or the publication…"
                    className="flex-1 bg-transparent text-sm text-white placeholder:text-white/25 focus:outline-none"
                    disabled={loading}
                  />
                  {input.trim() && !loading && (
                    <button
                      type="button"
                      onClick={handleSend}
                      className="flex h-8 w-8 items-center justify-center rounded-full bg-[#c8ff4d] text-black transition-transform hover:-translate-y-0.5"
                      aria-label="Send message"
                    >
                      <Send className="h-4 w-4" />
                    </button>
                  )}
                  {!input.trim() && !loading && (
                    <Copy className="h-4 w-4 text-white/30" />
                  )}
                </div>
                <p className="mt-2 text-[9px] font-mono text-white/25">
                  Powered by Groq &bull; The Ink Home
                </p>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
