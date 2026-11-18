export interface AIMessage {
  role: "user" | "assistant";
  content: string;
}

export interface AIContext {
  story?: { title: string; author: string } | null;
  page?: "reading" | "browse" | "profile";
}

export interface AIAssistantOptions {
  onError?: (error: string) => void;
  temperature?: number;
  maxTokens?: number;
  signal?: AbortSignal;
}

const AI_ENDPOINT = "/api/ai";
const MAX_HISTORY = 10;

/**
 * Sends the conversation to The Ink Home assistant.
 * The system prompt and knowledge base live server-side (src/lib/knowledge.ts);
 * the client only supplies the user-visible conversation plus page/story context.
 */
export async function askAI(
  messages: AIMessage[],
  context: AIContext = {},
  options: AIAssistantOptions = {},
): Promise<string> {
  const { onError, temperature, maxTokens, signal } = options;

  try {
    const payload = {
      messages: messages.slice(-MAX_HISTORY),
      context: {
        ...(context.page ? { page: context.page } : {}),
        ...(context.story?.title ? { storyTitle: context.story.title } : {}),
        ...(context.story?.author ? { storyAuthor: context.story.author } : {}),
      },
      temperature: Math.max(0, Math.min(1, temperature ?? 0.5)),
      max_tokens: Math.max(1, Math.min(1024, maxTokens ?? 512)),
      stream: false,
    };

    const response = await fetch(AI_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: signal ?? AbortSignal.timeout(30000),
    });

    const data = (await response.json().catch(() => ({}))) as {
      reply?: string;
      error?: string;
    };

    if (!response.ok) {
      const errorMsg = data.error || `Assistant request failed (${response.status})`;
      onError?.(errorMsg);
      throw new Error(errorMsg);
    }

    if (!data.reply || typeof data.reply !== "string") {
      const errorMsg = "The assistant returned an empty reply. Please try again.";
      onError?.(errorMsg);
      throw new Error(errorMsg);
    }

    return data.reply;
  } catch (err) {
    if (err instanceof Error && (err.name === "TimeoutError" || err.name === "AbortError")) {
      const timeoutMsg = "Request timed out. Please try again.";
      onError?.(timeoutMsg);
      throw new Error(timeoutMsg);
    }
    const message = err instanceof Error ? err.message : "Unable to reach the assistant.";
    if (!message.includes("assistant")) onError?.(message);
    throw err;
  }
}
