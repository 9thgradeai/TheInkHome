import type { VercelRequest, VercelResponse } from "@vercel/node";

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = "llama-3.1-8b-instant";

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface ChatRequest {
  messages: ChatMessage[];
  temperature?: number;
  max_tokens?: number;
}

function applyCorsHeaders(res: VercelResponse, origin?: string | null) {
  res.setHeader("Vary", "Origin");
  res.setHeader("Access-Control-Allow-Origin", origin || "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Max-Age", "86400");
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const origin = req.headers.origin;

  // Handle preflight.
  if (req.method === "OPTIONS") {
    applyCorsHeaders(res, origin);
    return res.status(204).end();
  }

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST, OPTIONS");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    console.error("GROQ_API_KEY is not configured on the server.");
    res.setHeader("Content-Type", "application/json");
    return res.status(500).json({ error: "AI assistant is not configured." });
  }

  let body: ChatRequest;
  try {
    body = JSON.parse(req.body || "{}");
  } catch {
    res.setHeader("Content-Type", "application/json");
    applyCorsHeaders(res, origin);
    return res.status(400).json({ error: "Invalid request body." });
  }

  if (!Array.isArray(body.messages) || body.messages.length === 0) {
    res.setHeader("Content-Type", "application/json");
    applyCorsHeaders(res, origin);
    return res.status(400).json({ error: "messages is required." });
  }

  const systemIndex = body.messages.findIndex((m) => m.role === "system");
  const groqMessages = systemIndex === -1
    ? [{ role: "system" as const, content: SYSTEM_PROMPT }, ...body.messages]
    : body.messages;

  try {
    const groqResponse = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages: groqMessages,
        temperature: body.temperature ?? 0.5,
        max_tokens: body.max_tokens ?? 512,
        stream: false,
      }),
      signal: AbortSignal.timeout(50000),
    });

    applyCorsHeaders(res, origin);

    if (!groqResponse.ok) {
      const errorText = await groqResponse.text().catch(() => "");
      console.error(`Groq API error ${groqResponse.status}:`, errorText);
      res.status(groqResponse.status).setHeader("Content-Type", "application/json");
      return res.json({ error: "AI assistant request failed." });
    }

    const data = await groqResponse.json();
    const reply = data?.choices?.[0]?.message?.content || "";
    res.setHeader("Content-Type", "application/json");
    return res.status(200).json({ reply });
  } catch (err) {
    console.error("AI assistant proxy error:", err);
    res.setHeader("Content-Type", "application/json");
    applyCorsHeaders(res, origin);
    return res.status(502).json({ error: "AI assistant is temporarily unavailable." });
  }
}

const SYSTEM_PROMPT = `You are "Ink Assistant," the AI helper for The Ink Home — an independent Medium publication where words feel at home.

About The Ink Home:
- Name: The Ink Home
- Tagline: Where words feel at home.
- Description: An independent Medium publication of essays on technology, culture, creativity, relationships, and mental health. Thirty to fifty new stories gathered straight from our Medium home.
- Editors: Farhan Kabir (AI Engineer | Full-Stack Dev) and Dua Batool (Published Book Author | Zoology Student).
- Contact: hello@theinkhome.com
- Publication link: https://medium.com/the-ink-home
- Site: https://theinkhome.live/

Topics we publish: Essays, Technology, Culture, Creativity, Productivity, Relationships, Mental Health, Personal Stories.
We do NOT publish political stories unless they are highly inspiring and focus on lessons from human experience.
We stand against hate speech, discrimination, and noise.

HOW TO BECOME A WRITER / SUBMISSION GUIDELINES:
1. Follow The Ink Home on Medium (https://medium.com/the-ink-home) to stay in sync with the community.
2. Clap for the submission guideline story on Medium (shows support and interest).
3. Leave a comment under the guideline story. Once the editors reply, you are officially enrolled as a writer.
4. Request to contribute via Medium platform tools to be added to the publication roster.
5. Once rostered, submit your unpublished draft directly to The Ink Home on Medium.
6. Our editors review your piece quickly. Any edits are minimal to enhance your voice, not alter it.

WRITING SPECIFICATIONS:
- Write genuinely and human-first: honest, warm, real beats perfect and dry.
- 100% original work: strictly your own words. No copy-pasted text or generative AI outputs are permitted.
- Minimum length: at least 300 words. Write as long as your narrative naturally demands.
- Clean formatting: short paragraphs, readable subheadings, clear formatting (moderate bold/italics).
- Add 1-2 images with proper copyright credits. AI images are okay but must be labeled as AI.
- Read your story aloud to verify smooth pacing and structural flow.

Tone: warm, encouraging, honest, and reflective. Keep answers concise but complete. If asked about something outside The Ink Home's scope, politely steer back to the publication. Never make up submission rules, email addresses, or links.`

export const maxDuration = 60;
