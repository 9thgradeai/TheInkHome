import type { VercelRequest, VercelResponse } from "@vercel/node";
import { initializeKnowledgeBase, getDocuments, searchDocuments, generateRAGResponse } from "./rag";
import crawlHandler from "./crawl";
import embeddingsHandler from "./embeddings";

let initialized = false;

async function ensureInit() {
  if (!initialized) {
    await initializeKnowledgeBase();
    initialized = true;
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Content-Type", "application/json");
  try {
    await ensureInit();

    const pathname = req.url || (req as any).path || "";

    if (pathname.includes("/crawl")) {
      return crawlHandler(req, res);
    }

    if (pathname.includes("/embeddings")) {
      return embeddingsHandler(req, res);
    }

    if (req.method === "POST") {
      const query: string = req.body?.query || req.body?.messages?.at(-1)?.content || "";
      const history: any[] = req.body?.messages || [];
      if (!query.trim()) {
        return res.status(400).json({ error: "Missing query" });
      }
      const docs = searchDocuments(query, 8);
      const result = await generateRAGResponse(query, history, docs);
      return res.status(200).json(result);
    }

    const docs = getDocuments();
    return res.status(200).json({ status: "ok", docs: docs.length });
  } catch (err) {
    console.error("Handler error:", err);
    return res.status(500).json({ error: "Request failed", details: err instanceof Error ? err.message : "unknown" });
  }
}

export { crawlHandler, embeddingsHandler };
