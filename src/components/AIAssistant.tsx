import React, { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  Bot,
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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const scrollBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollBottom();
  }, [messages, scrollBottom]);

  useEffect(() => {
    if (open) {
      const timer = setTimeout(() => inputRef.current?.focus(), 100);
      return () => clearTimeout(timer);
    }
  }, [open]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) setOpen(false);
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [open]);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

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
    setTimeout(() => handleSend(), 0);
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
          className="fixed bottom-4 right-4 z-[1000] flex h-14 w-14 items-center justify-center rounded-full bg-[#c8ff4d] text-black shadow-[0_8px_24px_-4px_rgba(200,255,77,0.4)] transition-all duration-200 hover:scale-105 hover:shadow-[0_12px_32px_-4px_rgba(200,255,77,0.5)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c8ff4d] focus-visible:ring-offset-2 focus-visible:ring-offset-[#08080a] active:scale-95 sm:bottom-6 sm:right-6"
          aria-label="Open AI Assistant"
        >
          <Bot className="h-6 w-6" />
          <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#08080a] text-[10px] font-bold text-[#c8ff4d] border border-[#c8ff4d]/40">
            AI
          </span>
        </button>
      )}

      <AnimatePresence>
        {open && (
          <>
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-[999] bg-black/70 backdrop-blur-sm"
              aria-label="Close assistant"
            />
            <motion.div
              initial={{ opacity: 0, y: 40, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 40, scale: 0.96 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="fixed inset-x-0 bottom-0 z-[1000] flex h-[92vh] max-h-[92vh] flex-col overflow-hidden rounded-t-3xl border-t border-white/10 bg-[#0b0c0f] shadow-[0_-8px_40px_-8px_rgba(0,0,0,0.8)] sm:inset-auto sm:bottom-6 sm:right-6 sm:h-[600px] sm:max-h-[85vh] sm:w-[400px] sm:rounded-3xl sm:border sm:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.7)] md:h-[640px] md:w-[420px]"
              role="dialog"
              aria-modal="true"
              aria-label="Ink Assistant"
            >
              {/* Header */}
              <div className="flex shrink-0 items-center justify-between border-b border-white/10 bg-[#0a0b0d]/80 backdrop-blur px-5 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#c8ff4d]/10 text-[#c8ff4d]">
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
                  className="flex h-10 w-10 items-center justify-center rounded-xl text-white/40 transition-colors hover:bg-white/10 hover:text-white active:scale-95"
                  aria-label="Close assistant"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Messages */}
              <div
                className="flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-5 sm:py-5"
                ref={panelRef}
              >
                {error && (
                  <div className="mb-4 rounded-lg border border-amber-500/30 bg-amber-900/20 p-3 text-xs text-amber-300">
                    {error}
                  </div>
                )}

                {/* Quick questions */}
                {messages.length <= 1 && (
                  <div className="mb-5 flex flex-wrap gap-2">
                    {QUICK_QUESTIONS.map((q) => (
                      <button
                        key={q}
                        onClick={() => handleQuick(q)}
                        disabled={loading}
                        className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-white/60 transition-colors hover:border-white/25 hover:bg-white/[0.06] hover:text-white active:scale-95 disabled:opacity-50"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                )}

                <div className="space-y-3">
                  {messages.map((m, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2 }}
                      className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div className={`max-w-[85%] ${m.role === "user" ? "text-right" : "text-left"}`}>
                        <div
                          className={`inline-block rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                            m.role === "user"
                              ? "bg-[#c8ff4d] text-black rounded-br-md"
                              : "border border-white/10 bg-white/[0.04] text-white/90 rounded-bl-md"
                          }`}
                        >
                          {m.content}
                        </div>
                        <span className="mt-1 block text-[9px] font-mono text-white/30">
                          {m.role === "user" ? "You" : "Ink Assistant"}
                        </span>
                      </div>
                    </motion.div>
                  ))}
                  {loading && (
                    <div className="flex justify-start">
                      <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
                        <div className="h-4 w-4 rounded-full border-2 border-white/20 border-t-[#c8ff4d] animate-spin" />
                        <span className="text-xs text-white/40">Thinking…</span>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </div>

              {/* Input */}
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  handleSend();
                }}
                className="shrink-0 border-t border-white/10 bg-[#0a0b0d]/80 backdrop-blur px-4 py-3 sm:px-5 sm:py-4"
              >
                <div className="flex items-center gap-2 rounded-xl border border-white/15 bg-white/[0.03] px-3 py-2.5 transition-colors focus-within:border-[#c8ff4d]/50 focus-within:ring-1 focus-within:ring-[#c8ff4d]/30">
                  <input
                    ref={inputRef}
                    value={input}
                    onChange={(event) => setInput(event.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask about The Ink Home…"
                    className="min-w-0 flex-1 bg-transparent text-sm text-white placeholder:text-white/30 focus:outline-none"
                    disabled={loading}
                    autoComplete="off"
                    enterKeyHint="send"
                  />
                  <button
                    type="submit"
                    disabled={!input.trim() || loading}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#c8ff4d] text-black transition-all hover:bg-[#d4ff6a] active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                    aria-label="Send message"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </div>
                <p className="mt-2 text-center text-[9px] font-mono text-white/20">
                  Powered by Groq · The Ink Home
                </p>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
