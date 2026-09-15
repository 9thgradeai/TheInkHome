export interface KnowledgeDoc {
  id: string;
  type: string;
  title: string;
  path: string;
  content: string;
  tags: string[];
  metadata: Record<string, any>;
}

export interface SearchResult extends KnowledgeDoc {
  score: number;
}

export interface ChatResponse {
  message: string;
  sources: KnowledgeDoc[];
  suggestedQuestions: string[];
  actions: ActionItem[];
}

export interface ActionItem {
  label: string;
  href?: string;
  action?: string;
}
