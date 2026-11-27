import React, { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Bot, Send, X, RotateCcw, ThumbsUp, ThumbsDown, Copy, Check } from "lucide-react";
import InkMark from "./ui/InkMark";
import { askAI, AIMessage } from "../lib/ai";
import { Story } from "../types";

const QUICK_BY_PAGE: Record<string, string[]> = {
  reading: ["Summarize this essay", "What's the main argument?", "Key takeaways", "Who is the author?"],
  profile: ["Tell me about this writer", "What do they write about?", "How do I submit?"],
  writing: ["Help me outline an essay", "Improve this paragraph", "Submission guidelines", "Tone tips"],
  browse: ["How do I become a writer?", "Submission guidelines", "What topics do you publish?", "How do I contact you?"],
};

interface Thread { id: string; title: string; messages: AIMessage[]; updatedAt: number }

const STORAGE_KEY = "the-ink-home:assistant:threads";

function loadThreads(): Thread[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch { return []; }
}
function saveThreads(threads: Thread[]) {
  try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(threads.slice(0, 20))); } catch { /* ignore */ }
}

function renderMarkdown(text: string): React.ReactNode[] {
  // Lightweight markdown: code blocks, inline code, bold, italic, links, lists
  const lines = text.split("\n");
  const out: React.ReactNode[] = [];
  let listBuffer: string[] = [];
  const flushList = () => {
    if (listBuffer.length) {
      out.push(
        <ul key={`ul-${out.length}`} className="my-2 list-disc space-y-1 pl-5">
          {listBuffer.map((li, i) => <li key={i}>{inline(li)}</li>)}
        </ul>,
      );
      listBuffer = [];
    }
  };
  const inline = (s: string): React.ReactNode[] => {
    const parts: React.ReactNode[] = [];
    const regex = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]+\]\([^)]+\))/g;
    let last = 0; let m: RegExpExecArray | null;
    while ((m = regex.exec(s)) !== null) {
      if (m.index > last) parts.push(s.slice(last, m.index));
      const tok = m[0];
      if (tok.startsWith("`")) parts.push(<code key={parts.length} className="rounded bg-ink/10 px-1.5 py-0.5 font-mono text-[0.85em]">{tok.slice(1, -1)}</code>);
      else if (tok.startsWith("**")) parts.push(<strong key={parts.length}>{tok.slice(2, -2)}</strong>);
      else if (tok.startsWith("*")) parts.push(<em key={parts.length}>{tok.slice(1, -1)}</em>);
      else {
        const mm = tok.match(/\[([^\]]+)\]\(([^)]+)\)/);
        if (mm) parts.push(<a key={parts.length} href={mm[2]} target="_blank" rel="noopener noreferrer" className="underline decoration-accent underline-offset-2 hover:text-accent-ink">{mm[1]}</a>);
      }
      last = m.index + tok.length;
    }
    if (last < s.length) parts.push(s.slice(last));
    return parts;
  };

  for (const line of lines) {
    if (/^```/.test(line)) { flushList(); continue; }
    if (/^[-*]\s+/.test(line)) { listBuffer.push(line.replace(/^[-*]\s+/, "")); continue; }
    flushList();
    if (line.trim() === "") { out.push(<div key={`br-${out.length}`} className="h-2" />); continue; }
    if (/^###\s/.test(line)) out.push(<h4 key={`h-${out.length}`} className="mt-2 font-display text-sm font-semibold text-ink">{inline(line.replace(/^###\s/, ""))}</h4>);
    else if (/^##\s/.test(line)) out.push(<h3 key={`h-${out.length}`} className="mt-2 font-display text-base font-semibold text-ink">{inline(line.replace(/^##\s/, ""))}</h3>);
    else out.push(<p key={`p-${out.length}`} className="leading-relaxed">{inline(line)}</p>);
  }
  flushList();
  return out;
}

interface AIAssistantProps {
  openByDefault?: boolean;
  storyContext?: Story | null;
  pageContext?: "reading" | "browse" | "profile" | "writing";
}

export default function AIAssistant({ openByDefault = false, storyContext = null, pageContext = "browse" }: AIAssistantProps) {
  const [open, setOpen] = useState(openByDefault);
  const [threads, setThreads] = useState<Thread[]>(() => loadThreads());
  const [activeId, setActiveId] = useState<string | null>(() => loadThreads()[0]?.id ?? null);
  const active = threads.find((t) => t.id === activeId) ?? null;
  const [messages, setMessages] = useState<AIMessage[]>(active?.messages ?? [{ role: "assistant", content: "Hi! I'm Ink Assistant. Ask me about The Ink Home — submission guidelines, how to become a writer, or anything about the publication." }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<Record<number, "up" | "down">>({});
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const launcherRef = useRef<HTMLButtonElement>(null);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => inputRef.current?.focus(), 100);
    return () => clearTimeout(t);
  }, [open]);

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); setOpen(true); }
      if (e.key === "Escape" && open) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  // Focus trap
  useEffect(() => {
    if (!open) return;
    const panel = panelRef.current;
    if (!panel) return;
    const focusables = () => Array.from(panel.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), input, textarea, [tabindex]:not([tabindex="-1"])')).filter((el) => el.offsetParent !== null);
    const handler = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      const els = focusables();
      if (els.length === 0) return;
      const first = els[0], last = els[els.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", handler);
    panel.focus();
    return () => document.removeEventListener("keydown", handler);
  }, [open]);

  // Persist thread
  useEffect(() => {
    if (!activeId) return;
    setThreads((prev) => {
      const idx = prev.findIndex((t) => t.id === activeId);
      const title = messages.find((m) => m.role === "user")?.content.slice(0, 40) || "New chat";
      const next = idx >= 0
        ? prev.map((t, i) => i === idx ? { ...t, messages, title, updatedAt: Date.now() } : t)
        : [{ id: activeId, title, messages, updatedAt: Date.now() }, ...prev];
      saveThreads(next);
      return next;
    });
  }, [messages, activeId]);

  const newThread = () => {
    const id = `t_${Date.now()}`;
    setActiveId(id);
    setMessages([{ role: "assistant", content: "Hi! I'm Ink Assistant. Ask me about The Ink Home." }]);
    setError(null);
  };

  const deleteThread = (id: string) => {
    setThreads((prev) => { const next = prev.filter((t) => t.id !== id); saveThreads(next); return next; });
    if (activeId === id) { setActiveId(null); setMessages([{ role: "assistant", content: "Hi! I'm Ink Assistant." }]); }
  };

  const send = useCallback(async (rawText: string) => {
    const text = rawText.trim();
    if (!text || loading) return;
    if (!activeId) { const id = `t_${Date.now()}`; setActiveId(id); }
    const history = [...messages, { role: "user" as const, content: text }];
    setMessages(history);
    setInput("");
    setError(null);
    setLoading(true);
    try {
      const reply = await askAI(history, { story: storyContext ? { title: storyContext.title, author: storyContext.author } : null, page: pageContext }, { onError: setError, temperature: 0.5, maxTokens: 512 });
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
    } catch { /* surfaced */ } finally { setLoading(false); }
  }, [loading, messages, storyContext, pageContext, activeId]);

  const regenerate = () => {
    const lastUser = [...messages].reverse().find((m) => m.role === "user");
    if (!lastUser) return;
    setMessages((prev) => prev.filter((_, i) => i !== prev.length - 1 || prev[prev.length-1].role !== "assistant"));
    void send(lastUser.content);
  };

  const copyMsg = async (idx: number, content: string) => {
    try { await navigator.clipboard.writeText(content); setCopiedId(idx); setTimeout(() => setCopiedId(null), 1500); } catch { /* ignore */ }
  };

  const quick = QUICK_BY_PAGE[pageContext] || QUICK_BY_PAGE.browse;

  return (
    <>
      {!open && (
        <button type="button" ref={launcherRef} onClick={() => setOpen(true)} aria-label="Open Ink Assistant (Ctrl+K)" className="group fixed bottom-4 right-4 z-[1000] flex h-14 w-14 items-center justify-center rounded-full bg-accent text-on-accent shadow-[var(--shadow-raise)] transition-transform duration-200 hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-paper active:scale-95 sm:bottom-6 sm:right-6">
          <Bot className="h-6 w-6" aria-hidden="true" />
          <span aria-hidden="true" className="absolute -right-0.5 -top-0.5 rounded-full border border-line bg-ink px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.08em] text-on-ink">AI</span>
        </button>
      )}

      <AnimatePresence>
        {open && (
          <>
            <motion.button type="button" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setOpen(false)} className="fixed inset-0 z-[999] bg-ink/40 backdrop-blur-sm" aria-label="Close assistant" />
            <motion.div ref={panelRef} tabIndex={-1} initial={{ opacity: 0, y: 40, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 40, scale: 0.96 }} transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }} className="fixed inset-x-0 bottom-0 z-[1000] flex h-[92vh] max-h-[92vh] flex-col overflow-hidden rounded-t-3xl border-t border-line bg-raised shadow-[var(--shadow-raise)] sm:inset-auto sm:bottom-6 sm:right-6 sm:h-[640px] sm:max-h-[85vh] sm:w-[420px] sm:rounded-3xl sm:border md:w-[460px]" role="dialog" aria-modal="true" aria-label="Ink Assistant">
              <div className="flex shrink-0 items-center justify-between border-b border-line bg-sunken/80 px-5 py-4 backdrop-blur">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent/15 text-accent-ink"><InkMark className="h-5 w-5" /></div>
                  <div>
                    <p className="font-display text-sm font-semibold tracking-tight text-ink">Ink Assistant</p>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-accent-ink">{storyContext ? `Reading: ${storyContext.title}` : "The Ink Home AI"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button type="button" onClick={newThread} className="flex h-9 w-9 items-center justify-center rounded-xl text-ink-faint transition-colors hover:bg-sunken hover:text-ink" aria-label="New chat"><RotateCcw className="h-4 w-4" aria-hidden="true" /></button>
                  <button type="button" onClick={() => setOpen(false)} className="flex h-10 w-10 items-center justify-center rounded-xl text-ink-faint transition-colors hover:bg-sunken hover:text-ink" aria-label="Close assistant"><X className="h-5 w-5" aria-hidden="true" /></button>
                </div>
              </div>

              {/* Thread list */}
              {threads.length > 1 && (
                <div className="flex shrink-0 gap-2 overflow-x-auto border-b border-line bg-paper/40 px-4 py-2">
                  {threads.slice(0, 8).map((t) => (
                    <button key={t.id} type="button" onClick={() => { setActiveId(t.id); setMessages(t.messages); }} className={`shrink-0 rounded-full border px-3 py-1 text-[11px] transition-colors ${t.id === activeId ? "border-accent bg-accent/10 text-accent-ink" : "border-line text-ink-soft hover:text-ink"}`}>
                      {t.title}
                    </button>
                  ))}
                </div>
              )}

              <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-5 sm:py-5" aria-live="polite" aria-busy={loading}>
                {error && <div role="alert" className="mb-4 rounded-xl border border-accent/50 bg-accent/10 p-3 text-[13px] leading-relaxed text-accent-ink">{error}</div>}

                {messages.length <= 1 && !loading && (
                  <div className="mb-5 flex flex-wrap gap-2">
                    {quick.map((q) => (
                      <button key={q} type="button" onClick={() => void send(q)} disabled={loading} className="rounded-full border border-line bg-sunken px-3 py-2 text-[12.5px] text-ink-soft transition-colors hover:border-line-strong hover:text-ink active:scale-95 disabled:opacity-50">{q}</button>
                    ))}
                  </div>
                )}

                <div className="space-y-4">
                  {messages.map((message, index) => (
                    <motion.div key={index} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[90%] ${message.role === "user" ? "text-right" : "text-left"}`}>
                        <div className={`inline-block whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-relaxed ${message.role === "user" ? "rounded-br-md bg-accent text-on-accent" : "rounded-bl-md border border-line bg-sunken text-ink"}`}>
                          {message.role === "assistant" ? renderMarkdown(message.content) : message.content}
                        </div>
                        {message.role === "assistant" && index > 0 && (
                          <div className="mt-1.5 flex items-center gap-2">
                            <button type="button" onClick={() => copyMsg(index, message.content)} className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-faint hover:text-ink" aria-label="Copy reply">
                              {copiedId === index ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />} {copiedId === index ? "Copied" : "Copy"}
                            </button>
                            <button type="button" onClick={() => setFeedback((f) => ({ ...f, [index]: "up" }))} className={`flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.14em] ${feedback[index] === "up" ? "text-accent-ink" : "text-ink-faint hover:text-ink"}`} aria-label="Helpful"><ThumbsUp className="h-3 w-3" /></button>
                            <button type="button" onClick={() => setFeedback((f) => ({ ...f, [index]: "down" }))} className={`flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.14em] ${feedback[index] === "down" ? "text-accent-ink" : "text-ink-faint hover:text-ink"}`} aria-label="Not helpful"><ThumbsDown className="h-3 w-3" /></button>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                  {loading && (
                    <div className="flex justify-start">
                      <div className="flex items-center gap-2 rounded-2xl border border-line bg-sunken px-4 py-3">
                        <div aria-hidden="true" className="h-4 w-4 animate-spin rounded-full border-2 border-ink/20 border-t-accent" />
                        <span className="text-[13px] text-ink-soft">Thinking…</span>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </div>

              <form onSubmit={(e) => { e.preventDefault(); void send(input); }} className="shrink-0 border-t border-line bg-sunken/80 px-4 py-3 backdrop-blur sm:px-5 sm:py-4">
                <div className="flex items-center gap-2 rounded-xl border border-line bg-paper px-3 py-2.5 transition-colors focus-within:border-accent/60 focus-within:ring-1 focus-within:ring-accent/40">
                  <input ref={inputRef} value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void send(input); } }} placeholder="Ask about The Ink Home…" aria-label="Message Ink Assistant" className="min-w-0 flex-1 bg-transparent text-sm text-ink placeholder:text-ink-faint focus:outline-none" disabled={loading} autoComplete="off" enterKeyHint="send" />
                  <button type="submit" disabled={!input.trim() || loading} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent text-on-accent transition-opacity hover:opacity-90 active:scale-95 disabled:opacity-40" aria-label="Send message"><Send className="h-4 w-4" aria-hidden="true" /></button>
                </div>
                <div className="mt-2 flex items-center justify-between text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-faint">
                  <span>Ctrl/⌘+K to open</span>
                  <div className="flex gap-2">
                    {messages.length > 2 && <button type="button" onClick={regenerate} className="hover:text-ink">Regenerate</button>}
                    <span>Powered by Groq</span>
                  </div>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
