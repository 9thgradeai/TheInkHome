import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  Check,
  Copy,
  Download,
  FileText,
  PenLine,
  Plus,
  Trash2,
} from "lucide-react";
import Reveal from "../components/ui/Reveal";
import {
  createDraft,
  deleteDraft,
  draftToMarkdown,
  draftToRichText,
  getDraft,
  listDrafts,
  readingMinutes,
  saveDraft,
  wordCount,
  type Draft,
} from "../lib/drafts";
import { useNavigate } from "../router";

function formatUpdated(timestamp: number): string {
  const delta = Date.now() - timestamp;
  if (delta < 60_000) return "just now";
  if (delta < 3_600_000) return `${Math.floor(delta / 60_000)} min ago`;
  if (delta < 86_400_000) return `${Math.floor(delta / 3_600_000)} hr ago`;
  return new Date(timestamp).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/** The Desk — a local-first writing surface for preparing work before it goes out. */
export default function DeskPage() {
  const navigate = useNavigate();
  const [drafts, setDrafts] = useState<Draft[]>(() => listDrafts());
  const [activeId, setActiveId] = useState<string | null>(() => listDrafts()[0]?.id ?? null);
  const [title, setTitle] = useState(() => getDraft(listDrafts()[0]?.id ?? "")?.title ?? "");
  const [body, setBody] = useState(() => getDraft(listDrafts()[0]?.id ?? "")?.body ?? "");
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [copied, setCopied] = useState(false);
  const titleRef = useRef<HTMLInputElement>(null);

  const active = useMemo(
    () => drafts.find((draft) => draft.id === activeId) ?? null,
    [drafts, activeId],
  );

  const words = wordCount(body);
  const minutes = readingMinutes(body);

  // Debounced autosave so typing never blocks and nothing is lost on tab close.
  const pending = useRef<{ title: string; body: string } | null>(null);
  useEffect(() => {
    if (!activeId) return;
    pending.current = { title, body };
    setStatus("saving");
    const timer = window.setTimeout(() => {
      const patch = pending.current;
      pending.current = null;
      if (!patch) return;
      const saved = saveDraft(activeId, patch);
      if (saved) {
        setDrafts(listDrafts());
        setStatus("saved");
      } else {
        setStatus("error");
      }
    }, 600);
    return () => window.clearTimeout(timer);
  }, [activeId, title, body]);

  // Warn before the browser discards unsaved work.
  useEffect(() => {
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (status === "saving") {
        event.preventDefault();
        event.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [status]);

  const selectDraft = useCallback((id: string) => {
    const draft = getDraft(id);
    if (!draft) return;
    setActiveId(id);
    setTitle(draft.title);
    setBody(draft.body);
    setStatus("idle");
  }, []);

  const startNew = useCallback(() => {
    const draft = createDraft({ title: "", body: "" });
    setDrafts(listDrafts());
    setActiveId(draft.id);
    setTitle("");
    setBody("");
    setStatus("idle");
    window.setTimeout(() => titleRef.current?.focus(), 40);
  }, []);

  const removeActive = useCallback(() => {
    if (!activeId) return;
    if (!window.confirm("Delete this draft? This cannot be undone.")) return;
    deleteDraft(activeId);
    const remaining = listDrafts();
    setDrafts(remaining);
    const next = remaining[0];
    if (next) selectDraft(next.id);
    else {
      setActiveId(null);
      setTitle("");
      setBody("");
    }
  }, [activeId, selectDraft]);

  const downloadMarkdown = useCallback(() => {
    if (!active) return;
    const name =
      (active.title.trim() || "untitled-draft")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "") || "untitled-draft";
    const blob = new Blob([draftToMarkdown(active)], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${name}.md`;
    anchor.click();
    URL.revokeObjectURL(url);
  }, [active]);

  const copyRichText = useCallback(async () => {
    if (!active) return;
    try {
      await navigator.clipboard.writeText(draftToRichText(active));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }, [active]);

  const statusLabel =
    status === "saving"
      ? "Saving…"
      : status === "saved"
        ? "Saved locally"
        : status === "error"
          ? "Could not save"
          : activeId
            ? "All changes stored in this browser"
            : "";

  return (
    <section className="pb-24 pt-28 sm:pb-32 sm:pt-36">
      <div className="shell">
        <button
          type="button"
          onClick={() => navigate("/")}
          className="group mb-8 flex items-center gap-2 text-[13px] text-ink-faint transition-colors hover:text-ink"
        >
          <ArrowLeft
            className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5"
            aria-hidden="true"
          />
          Back to the publication
        </button>

        <header className="border-b border-line pb-7">
          <p className="eyebrow">
            <PenLine className="h-3.5 w-3.5" aria-hidden="true" /> The Desk
          </p>
          <div className="mt-4 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="max-w-[18ch] font-display text-[clamp(2.25rem,5.5vw,3.75rem)] font-semibold leading-[1] tracking-[-0.035em] text-ink">
                Write it before you send it.
              </h1>
              <p className="mt-4 max-w-[56ch] text-[15.5px] leading-relaxed text-ink-soft">
                A quiet, local workspace for drafting essays and pitches. Drafts stay in this browser —
                export them before you clear site data. Nothing is uploaded, and nothing is published
                from here.
              </p>
            </div>
            <button type="button" onClick={startNew} className="btn btn-solid shrink-0">
              <Plus className="h-4 w-4" aria-hidden="true" /> New draft
            </button>
          </div>
        </header>

        <div className="mt-8 grid gap-8 lg:grid-cols-[280px_1fr]">
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="flex items-center justify-between">
              <h2 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-faint">
                Your drafts
              </h2>
              <span className="text-[12px] tabular-nums text-ink-faint">{drafts.length}</span>
            </div>

            {drafts.length === 0 ? (
              <div className="mt-4 rounded-2xl border border-dashed border-line-strong px-4 py-8 text-center">
                <FileText className="mx-auto h-5 w-5 text-ink-faint" aria-hidden="true" />
                <p className="mt-3 text-[13px] leading-relaxed text-ink-soft">
                  No drafts yet. Start one and it will be saved as you type.
                </p>
                <button type="button" onClick={startNew} className="btn btn-outline mt-4">
                  <Plus className="h-4 w-4" aria-hidden="true" /> New draft
                </button>
              </div>
            ) : (
              <ul className="mt-3 space-y-1.5">
                {drafts.map((draft) => (
                  <li key={draft.id}>
                    <button
                      type="button"
                      onClick={() => selectDraft(draft.id)}
                      aria-current={draft.id === activeId ? "true" : undefined}
                      className={`w-full rounded-xl border px-3.5 py-3 text-left transition-colors ${
                        draft.id === activeId
                          ? "border-accent bg-accent/10"
                          : "border-line bg-raised hover:border-line-strong"
                      }`}
                    >
                      <span className="block truncate font-display text-[14.5px] font-semibold text-ink">
                        {draft.title.trim() || "Untitled draft"}
                      </span>
                      <span className="mt-1 flex items-center gap-2 text-[11.5px] text-ink-faint">
                        <span>{wordCount(draft.body)} words</span>
                        <span aria-hidden="true">·</span>
                        <span>{formatUpdated(draft.updatedAt)}</span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </aside>

          <div className="min-w-0">
            {active ? (
              <Reveal>
                <div className="overflow-hidden rounded-2xl border border-line bg-raised">
                  <div className="flex flex-wrap items-center gap-3 border-b border-line px-5 py-3.5">
                    <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-faint">
                      Draft
                    </span>
                    <span aria-live="polite" className="text-[12.5px] text-ink-soft">
                      {statusLabel}
                    </span>
                    <div className="ml-auto flex flex-wrap items-center gap-2">
                      <button type="button" onClick={copyRichText} className="btn btn-outline">
                        {copied ? <Check className="h-4 w-4 text-accent-ink" /> : <Copy className="h-4 w-4" />}
                        {copied ? "Copied" : "Copy"}
                      </button>
                      <button type="button" onClick={downloadMarkdown} className="btn btn-outline">
                        <Download className="h-4 w-4" aria-hidden="true" /> Markdown
                      </button>
                      <button
                        type="button"
                        onClick={removeActive}
                        className="btn btn-outline"
                        aria-label="Delete this draft"
                      >
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                      </button>
                    </div>
                  </div>

                  <div className="px-5 py-6 sm:px-8 sm:py-8">
                    <label className="sr-only" htmlFor="desk-title">
                      Draft title
                    </label>
                    <input
                      id="desk-title"
                      ref={titleRef}
                      value={title}
                      onChange={(event) => setTitle(event.target.value)}
                      placeholder="Untitled draft"
                      className="w-full border-0 bg-transparent p-0 font-display text-[clamp(1.5rem,3vw,2.25rem)] font-semibold leading-tight tracking-[-0.03em] text-ink outline-none placeholder:text-ink-faint"
                    />

                    <div className="my-5 h-px bg-line" />

                    <label className="sr-only" htmlFor="desk-body">
                      Draft body
                    </label>
                    <textarea
                      id="desk-body"
                      value={body}
                      onChange={(event) => setBody(event.target.value)}
                      placeholder="Begin anywhere. A first sentence, a note to your future self, a paragraph you already know you want to keep…"
                      rows={22}
                      className="w-full resize-y border-0 bg-transparent p-0 font-serif text-[17px] leading-[1.75] text-ink outline-none placeholder:text-ink-faint"
                    />
                  </div>

                  <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-line px-5 py-3.5 text-[12.5px] text-ink-faint">
                    <span className="tabular-nums">{words} words</span>
                    <span className="tabular-nums">{minutes} min read</span>
                    <span className="tabular-nums">{body.length} characters</span>
                    <span className="ml-auto">Stored in this browser only</span>
                  </div>
                </div>
              </Reveal>
            ) : (
              <div className="flex min-h-[420px] flex-col items-center justify-center rounded-2xl border border-dashed border-line-strong px-6 text-center">
                <PenLine className="h-6 w-6 text-ink-faint" aria-hidden="true" />
                <p className="mt-4 max-w-sm font-display text-xl font-semibold text-ink">
                  The page is clean and waiting.
                </p>
                <p className="mt-2 max-w-md text-[14.5px] leading-relaxed text-ink-soft">
                  Drafts are private to this device. When something is ready, export it as Markdown and
                  send it to the editors.
                </p>
                <button type="button" onClick={startNew} className="btn btn-solid mt-5">
                  <Plus className="h-4 w-4" aria-hidden="true" /> Start a draft
                </button>
              </div>
            )}

            <div className="mt-6 rounded-2xl border border-line bg-sunken p-5 text-[13.5px] leading-relaxed text-ink-soft">
              <strong className="font-semibold text-ink">How to submit.</strong> Export your draft as
              Markdown, then email it with a short introduction to{" "}
              <a
                href="mailto:hello@theinkhome.com"
                className="text-ink underline decoration-accent underline-offset-4"
              >
                hello@theinkhome.com
              </a>
              . We read every submission and reply within two weeks. The full process is on the{" "}
              <button
                type="button"
                onClick={() => navigate("/editorial")}
                className="text-ink underline decoration-accent underline-offset-4"
              >
                editorial policy
              </button>
              .
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
