import { KnowledgeDoc, SearchResult } from "./types";
import Fuse from "fuse.js";

let fuseIndex: Fuse<KnowledgeDoc> | null = null;
let fullTextFuseIndex: Fuse<KnowledgeDoc> | null = null;

const keywordOptions = {
  keys: ["title", "tags", "path", "metadata.title"],
  threshold: 0.6,
  minMatchCharLength: 2,
};

const fullTextOptions = {
  keys: ["title", "content", "tags", "path", "metadata.title"],
  threshold: 0.6,
  minMatchCharLength: 2,
};

export function buildSearchIndex(docs: KnowledgeDoc[]) {
  fuseIndex = new Fuse(docs, keywordOptions);
  fullTextFuseIndex = new Fuse(docs, fullTextOptions);
}

export function keywordSearch(query: string, limit = 12): SearchResult[] {
  if (!fuseIndex || !query.trim()) return [];
  return fuseIndex
    .search(query, { limit })
    .map((result) => ({ ...result.item, score: result.score }));
}

export function fullTextSearch(query: string, limit = 12): SearchResult[] {
  if (!fullTextFuseIndex || !query.trim()) return [];
  return fullTextFuseIndex
    .search(query, { limit })
    .map((result) => ({ ...result.item, score: result.score ?? 0 }));
}

export function getDocumentById(_id: string): KnowledgeDoc | undefined {
  return undefined;
}

export function getAllDocuments(): KnowledgeDoc[] {
  return [];
}
