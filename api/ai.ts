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

// Simplified system prompt - core only
const SYSTEM_PROMPT = `You are Ink Assistant for The Ink Home. Help users with submission guidelines, how to become a writer, and publication information. Keep answers concise.`;

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
    applyCorsHeaders(res, origin);
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

  // Build groq messages: always include a system message
  const groqMessages = [
    { role: "system", content: SYSTEM_PROMPT },
    ...body.messages,
  ];

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
      const errorText = await groqResponse.text().catch(() => "unknown error");
      console.error(`Groq API error ${groqResponse.status}:`, errorText);
      // Return specific error based on status
      if (groqResponse.status === 400) {
        return res.status(400).json({ error: "Bad request to AI service. Please try again." });
      }
      if (groqResponse.status === 429) {
        return res.status(429).json({ error: "AI service rate limit exceeded. Please try again later." });
      }
      if (groqResponse.status === 500) {
        return res.status(500).json({ error: "AI service internal error. Please try again." });
      }
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

export const maxDuration = 60;