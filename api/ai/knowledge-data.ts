import { createRequire } from "module";
const require = createRequire(import.meta.url);
const knowledgeDocsData = require("./knowledge-payload.json");
export const knowledgeDocs = knowledgeDocsData as any[];
export interface KnowledgeDoc {
  id: string;
  type: string;
  title: string;
  path: string;
  content: string;
  tags: string[];
  metadata: Record<string, any>;
}
