import { z } from 'zod';

export const ChatMessageSchema = z.object({
  role: z.enum(['system', 'user', 'assistant']),
  content: z.string().min(1).max(4000),
});

export const AIRequestSchema = z.object({
  messages: z.array(ChatMessageSchema).min(1).max(20),
  temperature: z.number().min(0).max(1).optional(),
  max_tokens: z.number().int().min(1).max(1024).optional(),
});

export type ChatMessage = z.infer<typeof ChatMessageSchema>;
export type AIRequest = z.infer<typeof AIRequestSchema>;
