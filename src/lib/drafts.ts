/**
 * The Desk — local-first draft storage.
 *
 * Drafts live in this browser only. There is no account system and nothing is
 * uploaded anywhere: the honest boundary is that writers export their work
 * (Markdown or clipboard) before they clear browser data.
 */

export interface Draft {
  id: string;
  title: string;
  body: string;
  createdAt: number;
  updatedAt: number;
}

const STORAGE_KEY = "the-ink-home:desk:v1";
const MAX_DRAFTS = 100;
const MAX_BODY = 200_000;

function safeRead(): Record<string, Draft> {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return {};
    const out: Record<string, Draft> = {};
    for (const [id, value] of Object.entries(parsed as Record<string, Draft>)) {
      if (value && typeof value.id === "string" && typeof value.body === "string") {
        out[id] = value;
      }
    }
    return out;
  } catch {
    return {};
  }
}

function safeWrite(records: Record<string, Draft>): boolean {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
    return true;
  } catch {
    return false;
  }
}

function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `d_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;
}

export function listDrafts(): Draft[] {
  return Object.values(safeRead()).sort((a, b) => b.updatedAt - a.updatedAt);
}

export function getDraft(id: string): Draft | null {
  return safeRead()[id] ?? null;
}

export function createDraft(partial: Partial<Draft> = {}): Draft {
  const now = Date.now();
  const draft: Draft = {
    id: newId(),
    title: partial.title ?? "",
    body: partial.body ?? "",
    createdAt: now,
    updatedAt: now,
  };
  const records = safeRead();
  records[draft.id] = draft;

  const ids = Object.keys(records);
  if (ids.length > MAX_DRAFTS) {
    const oldest = Object.values(records)
      .sort((a, b) => a.updatedAt - b.updatedAt)
      .slice(0, ids.length - MAX_DRAFTS);
    for (const item of oldest) delete records[item.id];
  }

  safeWrite(records);
  return draft;
}

export function saveDraft(id: string, patch: Partial<Pick<Draft, "title" | "body">>): Draft | null {
  const records = safeRead();
  const existing = records[id];
  if (!existing) return null;

  const next: Draft = {
    ...existing,
    title: (patch.title ?? existing.title).slice(0, 300),
    body: (patch.body ?? existing.body).slice(0, MAX_BODY),
    updatedAt: Date.now(),
  };
  records[id] = next;
  return safeWrite(records) ? next : null;
}

export function deleteDraft(id: string): boolean {
  const records = safeRead();
  if (!records[id]) return false;
  delete records[id];
  return safeWrite(records);
}

export function wordCount(text: string): number {
  const matches = text.trim().match(/[^\s]+/g);
  return matches ? matches.length : 0;
}

export function readingMinutes(text: string): number {
  return Math.max(1, Math.round(wordCount(text) / 220));
}

export function draftToMarkdown(draft: Draft): string {
  const title = draft.title.trim();
  const body = draft.body.trim();
  return `${title ? `# ${title}\n\n` : ""}${body}\n`;
}

/** Converts a plain-text draft to a shareable HTML snippet for the clipboard. */
export function draftToRichText(draft: Draft): string {
  const escape = (value: string) =>
    value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const paragraphs = draft.body
    .split(/\n{2,}/)
    .map((block) => `<p>${escape(block).replace(/\n/g, "<br />")}</p>`)
    .join("");
  const heading = draft.title.trim() ? `<h2>${escape(draft.title.trim())}</h2>` : "";
  return `${heading}${paragraphs}`;
}
