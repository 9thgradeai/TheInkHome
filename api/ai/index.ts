import type { VercelRequest, VercelResponse } from "@vercel/node";
import { initializeKnowledgeBase, getDocuments, searchDocuments, generateRAGResponse } from "./rag.js";

let initialized = false;
async function ensureInit() {
  if (!initialized) { await initializeKnowledgeBase(); initialized = true; }
}

// Inline crawl handler — consolidated to keep Hobby 12-function limit
async function crawlHandler(_req: VercelRequest, res: VercelResponse) {
  const docs = getDocuments();
  return res.json({ status: "crawled", stories: docs.length, stats: { documents: docs.length, lastCrawled: new Date().toISOString() } });
}
async function embeddingsHandler(_req: VercelRequest, res: VercelResponse) {
  const docs = getDocuments();
  return res.json({ status: "embeddings_generated", count: docs.length, stats: { documents: docs.length, lastCrawled: new Date().toISOString() } });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Content-Type", "application/json");
  try {
    await ensureInit();
    const pathname = req.url || (req as any).path || "";
    if (pathname.includes("/crawl")) return crawlHandler(req, res);
    if (pathname.includes("/embeddings")) return embeddingsHandler(req, res);
    if (req.method === "POST") {
      const query: string = req.body?.query || req.body?.messages?.at(-1)?.content || "";
      const history: any[] = req.body?.messages || [];
      if (!query.trim()) return res.status(400).json({ error: "Missing query" });
      const docs = searchDocuments(query, 8);
      const result = await generateRAGResponse(query, history, docs);
      return res.status(200).json(result);
    }
    const docs = getDocuments();
    return res.status(200).json({ status: "ok", docs: docs.length });
  } catch (err) {
    return res.status(500).json({ error: "Request failed", details: err instanceof Error ? err.message : "unknown" });
  }
}
