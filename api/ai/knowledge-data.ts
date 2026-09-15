import knowledgeDocsData from "./knowledge-data.json" assert { type: "json" };
export const knowledgeDocs = knowledgeDocsData as typeof knowledgeDocsData;
export interface KnowledgeDoc {
  id: string;
  type: string;
  title: string;
  path: string;
  content: string;
  tags: string[];
  metadata: Record<string, any>;
}
