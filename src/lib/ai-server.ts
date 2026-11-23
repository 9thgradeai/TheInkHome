import { AIRequestSchema, type AIRequest } from "./validation.js";
import { buildSystemPrompt, type AIContext } from "./knowledge.js";

/**
 * Shared Ink Assistant backend used by both the Express server (`server.ts`)
 * and the Vercel function (`api/ai.ts`) so the two deployments behave
 * identically. Relative imports carry explicit `.ts` extensions for the
 * Vercel ESM runtime.
 */

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const DEFAULT_MODEL = process.env.AI_MODEL || "openai/gpt-oss-20b";
const REQUEST_TIMEOUT_MS = 30000;

const RATE_WINDOW_MS = 60 * 1000;
const RATE_MAX_PER_WINDOW = 10;

type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

/** Fixed-window per-IP limiter. In-memory: correct per instance, best-effort across instances. */
export function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const bucket = buckets.get(ip);

  if (!bucket || bucket.resetAt <= now) {
    buckets.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    if (buckets.size > 5000) {
      for (const [key, value] of buckets) {
        if (value.resetAt <= now) buckets.delete(key);
      }
    }
    return true;
  }

  bucket.count += 1;
  return bucket.count <= RATE_MAX_PER_WINDOW;
}

export function getClientIp(headers: Record<string, string | string[] | undefined>, fallback = "unknown"): string {
  const forwarded = headers["x-forwarded-for"];
  const raw = Array.isArray(forwarded) ? forwarded[0] : forwarded;
  if (raw) return raw.split(",")[0].trim() || fallback;
  return fallback;
}

export type AiResult =
  | { status: number; body: { reply: string } }
  | { status: number; body: { error: string } };

function sanitizeHistory(messages: AIRequest["messages"]): AIRequest["messages"] {
  return messages
    .filter((m) => m.role === "user" || m.role === "assistant")
    .slice(-10);
}

export async function runInkAssistant(params: {
  body: unknown;
  ip: string;
}): Promise<AiResult> {
  if (!checkRateLimit(params.ip)) {
    return { status: 429, body: { error: "Too many requests. Please try again in a minute." } };
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    console.error("GROQ_API_KEY is not configured – Ink Assistant is disabled.");
    return { status: 503, body: { error: "The assistant is not configured yet." } };
  }

  const parsed = AIRequestSchema.safeParse(params.body);
  if (!parsed.success) {
    return { status: 400, body: { error: "Invalid request format." } };
  }

  const { messages, temperature = 0.5, max_tokens = 512, context } = parsed.data;
  const systemPrompt = buildSystemPrompt(context as AIContext | undefined);

  let groqResponse: Response;
  try {
    groqResponse = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: DEFAULT_MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          ...sanitizeHistory(messages),
        ],
        temperature,
        max_tokens: Math.min(max_tokens, 512),
        stream: false,
      }),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch (error) {
    console.error("Ink Assistant upstream request failed", error instanceof Error ? error.message : error);
    return { status: 504, body: { error: "The assistant timed out. Please try again." } };
  }

  if (!groqResponse.ok) {
    if (groqResponse.status === 429) {
      return { status: 429, body: { error: "The AI service is rate limited right now. Try again shortly." } };
    }
    console.error("Groq API error", groqResponse.status);
    return { status: 503, body: { error: "The assistant is temporarily unavailable." } };
  }

  const data = (await groqResponse.json().catch(() => null)) as {
    choices?: { message?: { content?: string } }[];
  } | null;

  const reply = data?.choices?.[0]?.message?.content?.trim() || "";
  if (!reply) {
    return { status: 502, body: { error: "The assistant returned an empty reply. Please try again." } };
  }

  return { status: 200, body: { reply } };
}
