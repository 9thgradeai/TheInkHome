import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, X, Send, Loader2, BookOpen, Users, Feather } from 'lucide-react';
import AIChatMessage from './AIChatMessage';
import { ChatResponse, KnowledgeDoc } from '../lib/ai/types';
import { getApiBase } from '../lib/api';

const QUICK_PROMPTS = [
  { label: "What is The Ink Home?", query: "What is The Ink Home?" },
  { label: "Who are the editors?", query: "Who are the editors?" },
  { label: "How do I become a writer?", query: "How do I become a writer?" },
  { label: "Recommend AI articles", query: "Recommend articles about AI" },
  { label: "Latest stories", query: "What are the newest articles?" },
];

interface Message {
  role: 'user' | 'assistant';
  content: string;
  sources?: KnowledgeDoc[];
  actions?: Array<{ label: string; href?: string; action?: string }>;
  suggestedQuestions?: string[];
  id: string;
}

export default function AIAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasGreeted, setHasGreeted] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && !hasGreeted && messages.length === 0) {
      setHasGreeted(true);
      setMessages([
        {
          id: 'greeting',
          role: 'assistant',
          content: "Hi, I'm your Ink Home assistant. I can help you discover articles, understand our publication, or guide you through submission.",
          suggestedQuestions: QUICK_PROMPTS.map(p => p.label),
        }
      ]);
    }
  }, [isOpen]);

  async function sendMessage(query: string) {
    if (!query.trim() || loading) return;

    const userMessage: Message = { role: 'user', content: query, id: Date.now().toString() };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const apiBase = getApiBase();
      const response = await fetch(`${apiBase}/api/ai/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          messages: [...messages, userMessage].map(m => ({ role: m.role, content: m.content })),
        }),
      });

      if (!response.ok) {
        throw new Error('Chat request failed');
      }

      const data: ChatResponse = await response.json();
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.message,
        sources: data.sources,
        actions: data.actions,
        suggestedQuestions: data.suggestedQuestions,
      };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (err) {
      console.error('Chat failed:', err);
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "I couldn't find that information in The Ink Home's knowledge base. Our editorial team handles these inquiries directly.",
        actions: [
          { label: 'Contact Editors', href: 'https://theinkhome.live/about' },
          { label: 'Explore Articles', href: 'https://theinkhome.live/3d' },
        ],
      }]);
    } finally {
      setLoading(false);
    }
  }

  function handleQuickPrompt(query: string) {
    setInput(query);
    sendMessage(query);
  }

  function handleSuggestionClick(question: string) {
    setInput(question);
    sendMessage(question);
  }

  return (
    <div className="fixed inset-0 z-50 pointer-events-none">
      <div className="pointer-events-auto">
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: 40, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 40, scale: 0.97 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="absolute bottom-20 right-0 md:bottom-24 md:right-6 w-[calc(100vw-2rem)] md:w-[420px] max-h-[75vh] md:max-h-[600px] flex flex-col rounded-2xl border border-white/10 bg-black/90 backdrop-blur-2xl shadow-2xl origin-bottom-right"
            >
              <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-[var(--atmo-text)]" />
                  <span className="font-mono text-[11px] uppercase tracking-widest font-bold text-white">Ink Assistant</span>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                  aria-label="Close assistant"
                >
                  <X className="w-4 h-4 text-slate-400" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar" role="log" aria-live="polite" aria-label="Assistant messages">
                {messages.map((msg) => (
                  <AIChatMessage
                    key={msg.id}
                    message={msg}
                    onQuickPrompt={handleSuggestionClick}
                  />
                ))}
                {loading && (
                  <div className="flex items-center gap-2 text-slate-400 text-xs font-mono">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    <span>Thinking...</span>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              <div className="p-3 border-t border-white/10">
                <div className="flex gap-2">
                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage(input);
                      }
                    }}
                    placeholder="Ask about articles, editors, submissions..."
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[var(--atmo-text)] resize-none"
                    rows={1}
                  />
                  <button
                    onClick={() => sendMessage(input)}
                    disabled={loading || !input.trim()}
                    className="px-3 py-2 rounded-xl bg-[var(--atmo-text)] text-black font-bold text-xs hover:bg-white transition-colors disabled:opacity-50 cursor-pointer"
                    aria-label="Send message"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {!isOpen && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={() => setIsOpen(true)}
            className="fixed right-3 md:right-6 bottom-3 md:bottom-6 z-50 p-3 rounded-full bg-[var(--atmo-text)] text-black shadow-[0_0_20px_var(--atmo-glow)] hover:bg-white transition-colors cursor-pointer"
            aria-label="Open AI assistant"
            aria-expanded={false}
            aria-haspopup="dialog"
          >
            <MessageSquare className="w-5 h-5" />
          </motion.button>
        )}

        {isOpen && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={() => setIsOpen(false)}
            className="md:hidden fixed right-3 bottom-3 z-50 p-3 rounded-full bg-[var(--atmo-text)] text-black shadow-[0_0_20px_var(--atmo-glow)] cursor-pointer"
            aria-label="Close assistant"
          >
            <X className="w-5 h-5" />
          </motion.button>
        )}
      </div>
    </div>
  );
}
