import React, { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Bot, Send, Sparkles, X } from "lucide-react";
import { askAI, AIMessage } from "../lib/ai";
import { Story } from "../types";

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
  storyContext?: Story | null;
  pageContext?: "reading" | "browse" | "profile" | "writing";
}

const WELCOME: AIMessage = {
  role: "assistant",
  content:
    "Hi! I'm Ink Assistant. Ask me about The Ink Home — submission guidelines, how to become a writer, or anything about the publication.",
};

export default function AIAssistant({
  openByDefault = false,
  storyContext = null,
  pageContext = "browse",
}: AIAssistantProps) {
  const [open, setOpen] = useState(openByDefault);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<AIMessage[]>([WELCOME]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const launcherRef = useRef<HTMLButtonElement>(null);

  const scrollBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollBottom();
  }, [messages, loading, scrollBottom]);

  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(() => inputRef.current?.focus(), 100);
    return () => clearTimeout(timer);
  }, [open]);

  // Only the full-screen mobile sheet needs to trap page scroll; the desktop
  // side panel should leave the article readable behind it.
  useEffect(() => {
    if (!open) return;
    if (!window.matchMedia("(max-width: 639px)").matches) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    panelRef.current?.focus();
    return () => {
      launcherRef.current?.focus();
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  const send = useCallback(
    async (rawText: string) => {
      const text = rawText.trim();
      if (!text || loading) return;

      const history = [...messages, { role: "user" as const, content: text }];
      setMessages(history);
      setInput("");
      setError(null);
      setLoading(true);

      try {
        const reply = await askAI(
          history,
          {
            story: storyContext ? { title: storyContext.title, author: storyContext.author } : null,
            page: pageContext,
          },
          { onError: setError, temperature: 0.5, maxTokens: 512 },
        );
        setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
      } catch {
        /* error surfaced through onError */
      } finally {
        setLoading(false);
      }
    },
    [loading, messages, storyContext, pageContext],
  );

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        void send(input);
      }
    },
    [input, send],
  );

  return (
    <>
      {!open && (
        <button
          type="button"
          ref={launcherRef}
          onClick={() => {
            setOpen(true);
            setError(null);
          }}
          aria-label="Open Ink Assistant"
          className="group fixed bottom-4 right-4 z-[1000] flex h-14 w-14 items-center justify-center rounded-full bg-accent text-on-accent shadow-[var(--shadow-raise)] transition-transform duration-200 hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-paper active:scale-95 sm:bottom-6 sm:right-6"
        >
          <Bot className="h-6 w-6" aria-hidden="true" />
          <span
            aria-hidden="true"
            className="absolute -right-0.5 -top-0.5 flex h-5 items-center rounded-full border border-line bg-ink px-1.5 text-[9px] font-bold uppercase tracking-[0.08em] text-on-ink"
          >
            AI
          </span>
        </button>
      )}

      <AnimatePresence>
        {open && (
          <>
            <motion.button
              type="button"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-[999] bg-ink/40 backdrop-blur-sm"
              aria-label="Close assistant"
            />
            <motion.div
              ref={panelRef}
              tabIndex={-1}
              initial={{ opacity: 0, y: 40, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 40, scale: 0.96 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="fixed inset-x-0 bottom-0 z-[1000] flex h-[92vh] max-h-[92vh] flex-col overflow-hidden rounded-t-3xl border-t border-line bg-raised shadow-[var(--shadow-raise)] sm:inset-auto sm:bottom-6 sm:right-6 sm:h-[600px] sm:max-h-[85vh] sm:w-[400px] sm:rounded-3xl sm:border md:h-[640px] md:w-[420px]"
              role="dialog"
              aria-modal="true"
              aria-label="Ink Assistant"
            >
              <div className="flex shrink-0 items-center justify-between border-b border-line bg-sunken/80 px-5 py-4 backdrop-blur">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent/15 text-accent-ink">
                    <Sparkles className="h-4 w-4" aria-hidden="true" />
                  </div>
                  <div>
                    <p className="font-display text-sm font-semibold tracking-tight text-ink">
                      Ink Assistant
                    </p>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-accent-ink">
                      The Ink Home AI
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="flex h-10 w-10 items-center justify-center rounded-xl text-ink-faint transition-colors hover:bg-sunken hover:text-ink active:scale-95"
                  aria-label="Close assistant"
                >
                  <X className="h-5 w-5" aria-hidden="true" />
                </button>
              </div>

              <div
                className="flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-5 sm:py-5"
                aria-live="polite"
                aria-busy={loading}
              >
                {error && (
                  <div
                    role="alert"
                    className="mb-4 rounded-xl border border-accent/50 bg-accent/10 p-3 text-[13px] leading-relaxed text-accent-ink"
                  >
                    {error}
                  </div>
                )}

                {messages.length <= 1 && !loading && (
                  <div className="mb-5 flex flex-wrap gap-2">
                    {QUICK_QUESTIONS.map((question) => (
                      <button
                        key={question}
                        type="button"
                        onClick={() => void send(question)}
                        disabled={loading}
                        className="rounded-full border border-line bg-sunken px-3 py-2 text-[12.5px] text-ink-soft transition-colors hover:border-line-strong hover:text-ink active:scale-95 disabled:opacity-50"
                      >
                        {question}
                      </button>
                    ))}
                  </div>
                )}

                <div className="space-y-3">
                  {messages.map((message, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2 }}
                      className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[85%] ${message.role === "user" ? "text-right" : "text-left"}`}
                      >
                        <div
                          className={`inline-block whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                            message.role === "user"
                              ? "rounded-br-md bg-accent text-on-accent"
                              : "rounded-bl-md border border-line bg-sunken text-ink"
                          }`}
                        >
                          {message.content}
                        </div>
                        <span className="mt-1 block text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-faint">
                          {message.role === "user" ? "You" : "Ink Assistant"}
                        </span>
                      </div>
                    </motion.div>
                  ))}

                  {loading && (
                    <div className="flex justify-start">
                      <div className="flex items-center gap-2 rounded-2xl border border-line bg-sunken px-4 py-3">
                        <div
                          aria-hidden="true"
                          className="h-4 w-4 animate-spin rounded-full border-2 border-ink/20 border-t-accent"
                        />
                        <span className="text-[13px] text-ink-soft">Thinking…</span>
                      </div>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>
              </div>

              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  void send(input);
                }}
                className="shrink-0 border-t border-line bg-sunken/80 px-4 py-3 backdrop-blur sm:px-5 sm:py-4"
              >
                <div className="flex items-center gap-2 rounded-xl border border-line bg-paper px-3 py-2.5 transition-colors focus-within:border-accent/60 focus-within:ring-1 focus-within:ring-accent/40">
                  <input
                    ref={inputRef}
                    value={input}
                    onChange={(event) => setInput(event.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask about The Ink Home…"
                    aria-label="Message Ink Assistant"
                    className="min-w-0 flex-1 bg-transparent text-sm text-ink placeholder:text-ink-faint focus:outline-none"
                    disabled={loading}
                    autoComplete="off"
                    enterKeyHint="send"
                  />
                  <button
                    type="submit"
                    disabled={!input.trim() || loading}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent text-on-accent transition-opacity hover:opacity-90 active:scale-95 disabled:opacity-40"
                    aria-label="Send message"
                  >
                    <Send className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
                <p className="mt-2 text-center text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-faint">
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
