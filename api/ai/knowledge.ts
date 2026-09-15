import { KnowledgeDoc } from "./types";
import { knowledgeDocs } from "./knowledge-data";

export function loadAllDocuments(): Promise<KnowledgeDoc[]> {
  return Promise.resolve(knowledgeDocs);
}

export function getDocUrl(relPath: string): string {
  if (relPath.startsWith("articles/")) {
    const slug = relPath.replace(/^articles\//, "").replace(/\.md$/i, "");
    return `https://theinkhome.live/story/${slug}`;
  }
  if (relPath.startsWith("editors/")) {
    const username = relPath.replace(/^editors\//, "").replace(/\.md$/i, "");
    return `https://medium.com/@${username}`;
  }
  if (relPath.startsWith("writers/")) {
    const username = relPath.replace(/^writers\//, "").replace(/\.md$/i, "");
    return `https://medium.com/@${username}`;
  }
  if (relPath.startsWith("founder/")) {
    return "https://theinkhome.live/about";
  }
  if (relPath.startsWith("publication/")) {
    return "https://theinkhome.live/about";
  }
  if (relPath.startsWith("categories/")) {
    return "https://theinkhome.live/about";
  }
  if (relPath.startsWith("support/")) {
    return "https://theinkhome.live/about";
  }
  return "https://theinkhome.live/about";
}

export function getDocTypeLabel(doc: KnowledgeDoc): string {
  if (doc.path.startsWith("articles/")) return "Article";
  if (doc.path.startsWith("editors/")) return "Editor";
  if (doc.path.startsWith("writers/")) return "Writer";
  if (doc.path.startsWith("founder/")) return "Founder";
  if (doc.path.startsWith("publication/")) return "Publication";
  if (doc.path.startsWith("categories/")) return "Category";
  if (doc.path.startsWith("support/")) return "Support";
  return "Document";
}
