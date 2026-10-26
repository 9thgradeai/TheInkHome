import type { VercelRequest, VercelResponse } from "@vercel/node";

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = "llama-3.1-8b-instant";

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

// Minimal system prompt
const SYSTEM_PROMPT = `You are Ink Assistant for The Ink Home. Help with submission guidelines, how to become a writer, and publication information. Keep answers concise and helpful.`;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Vercel automatically parses JSON body, no need for manual parsing
  const body = req.body as { messages?: { role: string; content: string }[]; temperature?: number; max_tokens?: number } || {};

  // Validate required fields
  if (!body?.messages || !Array.isArray(body.messages)) {
    return res.status(400).json({ error: "Invalid request: messages array is required." });
  }

  if (body.messages.length === 0) {
    return res.status(400).json({ error: "Messages array cannot be empty." });
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    // In production, this should be set via Vercel environment variables
    return res.status(500).json({ error: "AI service not configured. Please contact support." });
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
        return res.status(429).json({ error: "AI service rate limit exceeded. Please try again later." });
      }
      return res.status(groqResponse.status).json({ error: "AI service error. Please try again." });
    }

    const data = await groqResponse.json();
    const reply = data?.choices?.[0]?.message?.content || "";
    return res.status(200).json({ reply });
  } catch (err) {
    console.error("AI assistant proxy error:", err);
    return res.status(500).json({ error: "AI assistant is temporarily unavailable." });
  }
}

export const maxDuration = 60;