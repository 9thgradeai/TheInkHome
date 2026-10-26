import type { VercelRequest, VercelResponse } from "@vercel/node";

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = "openai/gpt-oss-20b";

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface ChatRequest {
  messages: ChatMessage[];
  temperature?: number;
  max_tokens?: number;
}

// Simplified system prompt - core only
const SYSTEM_PROMPT = `You are Ink Assistant for The Ink Home. Help users with submission guidelines, how to become a writer, and publication information. Keep answers concise and helpful. Keep answers under 200 words.`;

function validateRequest(body: any): body is ChatRequest {
  return (
    body &&
    Array.isArray(body.messages) &&
    body.messages.length > 0 &&
    body.messages.every(
      (m: any) => m && typeof m === "object" && m.role && typeof m.content === "string"
    )
  );
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Vercel automatically parses JSON body, no need for manual parsing
  const body = req.body as ChatRequest | undefined;

  // Validate request structure
  if (!validateRequest(body)) {
    return res.status(400).json({ error: "Invalid request: messages array is required and must contain objects with 'role' and 'content' fields." });
  }

  if (body.messages.length === 0) {
    return res.status(400).json({ error: "Messages array cannot be empty." });
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    // In production, this MUST be set via Vercel environment variables
    // The .env file is gitignored and won't deploy
    return res.status(500).json({ error: "AI service not configured. Please set GROQ_API_KEY in Vercel dashboard > Settings > Environment Variables." });
  }

  try {
    const groqMessages = [
      { role: "system", content: SYSTEM_PROMPT },
      ...body.messages,
    ];

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
    });

    if (!groqResponse.ok) {
      const errorText = await groqResponse.text().catch(() => "unknown error");
      console.error(`Groq API error ${groqResponse.status}:`, errorText);
      if (groqResponse.status === 429) {
        return res.status(429).json({ error: "AI service rate limit exceeded. Please wait a moment and try again." });
      }
      if (groqResponse.status >= 500) {
        return res.status(550).json({ error: "AI service internal error. Please try again later." });
      }
      return res.status(groqResponse.status).json({ error: "AI service error. Please try again." });
    }

    const data = await groqResponse.json();
    const reply = data?.choices?.[0]?.message?.content || "";
    if (!reply) {
      return res.status(502).json({ error: "AI response was empty. Please try again." });
    }
    res.status(200).json({ reply });
  } catch (err) {
    console.error("AI assistant proxy error:", err);
    return res.status(500).json({ error: "AI assistant is temporarily unavailable. Please try again in a few moments." });
  }
}

export const maxDuration = 60;