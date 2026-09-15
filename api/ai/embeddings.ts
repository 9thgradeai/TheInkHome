import type { VercelRequest, VercelResponse } from "@vercel/node";
import { initializeKnowledgeBase, getDocuments } from "./rag";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    await initializeKnowledgeBase();
    const docs = getDocuments();
    const count = docs.length;
    const now = new Date().toISOString();
    return res.status(200).json({
      status: "embeddings_generated",
      count,
      message: count > 0 ? `Generated embeddings for ${count} documents` : "No documents found",
      stats: {
        documents: count,
        embeddings: count,
        lastCrawled: now,
      },
    });
  } catch (err) {
    console.error("Embeddings error:", err);
    return res.status(500).json({
      error: "Embeddings generation failed",
      message: err instanceof Error ? err.message : "Unknown error",
    });
  }
}
