export interface AIMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface AIAssistantOptions {
  onMessage?: (message: AIMessage) => void;
  onError?: (error: string) => void;
  temperature?: number;
  maxTokens?: number;
}

const AI_ENDPOINT = "/api/ai";

export async function askAI(
  messages: AIMessage[],
  options: AIAssistantOptions = {},
): Promise<string> {
  const { onError } = options;

  try {
    const response = await fetch(AI_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages,
        temperature: options.temperature ?? 0.5,
        max_tokens: options.maxTokens ?? 512,
      }),
      signal: AbortSignal.timeout(50000),
    });

    if (!response.ok) {
      const err = await response
        .json()
        .catch(() => ({ error: `HTTP ${response.status}` }));
      throw new Error(err.error || "AI request failed");
    }

    const data = (await response.json()) as { reply?: string };
    return data.reply || "";
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown AI error";
    onError?.(message);
    throw err;
  }
}

export const INK_HOME_KB = {
  name: "The Ink Home",
  tagline: "Where words feel at home.",
  description:
    "An independent Medium publication of essays on technology, culture, creativity, relationships, and mental health.",
  editors: [
    { name: "Farhan Kabir", role: "AI Engineer | Full-Stack Dev" },
    { name: "Dua Batool", role: "Published Book Author | Zoology Student" },
  ],
  contact: "hello@theinkhome.com",
  mediumLink: "https://medium.com/the-ink-home",
  siteLink: "https://theinkhome.live/",
  topics: [
    "Essays",
    "Technology",
    "Culture",
    "Creativity",
    "Productivity",
    "Relationships",
    "Mental Health",
    "Personal Stories",
  ],
  submissionSteps: [
    "Follow The Ink Home on Medium to stay in sync with the community.",
    "Clap for the submission guideline story on Medium to show support.",
    "Leave a comment under the guideline story; once editors reply, you are enrolled.",
    "Request to contribute via Medium platform tools to join the roster.",
    "Submit your unpublished draft directly to The Ink Home on Medium.",
    "Editors review quickly with minimal edits to enhance your voice.",
  ],
  writingSpecs: [
    "Write genuinely and human-first: honest, warm, real beats perfect and dry.",
    "100% original work: strictly your own words. No copy-pasted text or generative AI outputs permitted.",
    "Minimum 300 words; write as long as your narrative naturally demands.",
    "Clean formatting: short paragraphs, readable subheadings, moderate bold/italics.",
    "Add 1-2 images with proper copyright credits. AI images are okay if labeled.",
    "Read your story aloud to verify pacing and structural flow.",
  ],
  exclusions: [
    "Political stories are not published unless highly inspiring and focused on human lessons.",
    "No hate speech, discrimination, or noise.",
  ],
};
