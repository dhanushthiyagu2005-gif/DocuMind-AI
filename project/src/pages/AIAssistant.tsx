
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Send,
  FileText,
  User,
  Lightbulb,
  Plus,
  Trash2,
} from 'lucide-react';
import { useRef, useState, useEffect } from 'react';
import { suggestedQuestions } from '@/data/mockData';
import type { ChatMessage } from '@/types';
import { cn } from '@/lib/utils';

const STORAGE_KEY = 'documind-ai-chat-history';

const welcomeMessage: ChatMessage = {
  id: 'welcome',
  role: 'assistant',
  text: "Hello! I'm DocuMind AI. I've connected to your document workspace. Upload a document and ask me anything about it.",
  ts: new Date().toISOString(),
};

function loadMessages(): ChatMessage[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);

    if (saved) {
      const parsed = JSON.parse(saved);

      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (error) {
    console.error('Could not restore chat history:', error);
  }

  return [welcomeMessage];
}

export function AIAssistant() {
  const [messages, setMessages] = useState<ChatMessage[]>(loadMessages);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);

  // Save chat history automatically
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    } catch (error) {
      console.error('Could not save chat history:', error);
    }
  }, [messages]);

  // Automatically scroll to latest message
  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: 'smooth',
    });
  }, [messages, typing]);

  // Send message to FastAPI
  const send = async (text: string) => {
    const question = text.trim();

    if (!question || typing) return;

    const userMsg: ChatMessage = {
      id: 'u-' + Date.now(),
      role: 'user',
      text: question,
      ts: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setTyping(true);

    try {
      const response = await fetch('http://127.0.0.1:8002/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question,
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();

      const assistantMsg: ChatMessage = {
        id: 'a-' + Date.now(),
        role: 'assistant',
        text: data.answer || 'I could not generate an answer.',
        ts: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (error) {
      console.error('Chat API error:', error);

      const errorMsg: ChatMessage = {
        id: 'a-' + Date.now(),
        role: 'assistant',
        text: 'Sorry, I could not connect to the AI server. Please check that the backend is running and try again.',
        ts: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setTyping(false);
    }
  };

  // Start a new conversation
  const newChat = () => {
    if (typing) return;

    const confirmed = window.confirm(
      'Start a new chat? Your previous conversation will be cleared.'
    );

    if (!confirmed) return;

    setMessages([
      {
        ...welcomeMessage,
        id: 'welcome-' + Date.now(),
        ts: new Date().toISOString(),
      },
    ]);

    setInput('');
  };

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-glow">
            <Sparkles className="h-5 w-5" />
          </div>

          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              AI Assistant
            </h1>
            <p className="text-sm text-slate-500">
              Ask questions across your indexed documents
            </p>
          </div>
        </div>

        <button
          onClick={newChat}
          disabled={typing}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-brand-300 hover:text-brand-700 disabled:opacity-50"
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">New Chat</span>
        </button>
      </div>

      {/* Chat window */}
      <div className="flex flex-1 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card">

        <div
          ref={scrollRef}
          className="flex-1 space-y-5 overflow-y-auto scrollbar-thin p-4 md:p-6"
        >
          {messages.map((message) => (
            <MessageBubble key={message.id} msg={message} />
          ))}

          <AnimatePresence>
            {typing && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex items-start gap-3"
              >
                <Avatar role="assistant" />

                <div className="rounded-2xl rounded-tl-sm bg-slate-50 px-4 py-3">
                  <div className="flex gap-1">
                    {[0, 1, 2].map((i) => (
                      <motion.span
                        key={i}
                        animate={{ y: [0, -4, 0] }}
                        transition={{
                          duration: 0.8,
                          repeat: Infinity,
                          delay: i * 0.15,
                        }}
                        className="h-1.5 w-1.5 rounded-full bg-brand-400"
                      />
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Suggested questions */}
        {messages.length === 1 && (
          <div className="border-t border-slate-100 px-4 py-4 md:px-6">
            <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
              <Lightbulb className="h-3.5 w-3.5" />
              Suggested questions
            </div>

            <div className="flex flex-wrap gap-2">
              {suggestedQuestions.map((question) => (
                <button
                  key={question}
                  onClick={() => send(question)}
                  disabled={typing}
                  className="rounded-full border border-slate-200 bg-slate-50 px-3.5 py-1.5 text-sm text-slate-600 transition-colors hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700"
                >
                  {question}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div className="border-t border-slate-100 p-3 md:p-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
            className="flex items-end gap-2 rounded-xl border border-slate-200 bg-slate-50 p-2 focus-within:border-brand-300 focus-within:bg-white focus-within:ring-4 focus-within:ring-brand-100"
          >
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  send(input);
                }
              }}
              rows={1}
              placeholder="Ask anything about your documents..."
              className="max-h-32 flex-1 resize-none bg-transparent px-2 py-1.5 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none"
            />

            <button
              type="submit"
              disabled={!input.trim() || typing}
              className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-brand-600 to-brand-700 text-white transition-transform hover:-translate-y-0.5 disabled:opacity-40 disabled:hover:translate-y-0"
              aria-label="Send"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>

          <p className="mt-2 px-1 text-[11px] text-slate-400">
            Ask questions about your uploaded and processed documents.
          </p>
        </div>
      </div>
    </div>
  );
}

// Format inline Markdown: bold, italic and code
function formatInline(text: string) {
  const parts = text.split(/(\*\*.*?\*\*|`.*?`|\*.*?\*)/g);

  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={index} className="font-semibold text-slate-900">
          {part.slice(2, -2)}
        </strong>
      );
    }

    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code
          key={index}
          className="rounded bg-slate-200 px-1.5 py-0.5 text-xs"
        >
          {part.slice(1, -1)}
        </code>
      );
    }

    if (part.startsWith('*') && part.endsWith('*')) {
      return <em key={index}>{part.slice(1, -1)}</em>;
    }

    return part;
  });
}

// Render Markdown-style response cleanly
function FormattedAnswer({ text }: { text: string }) {
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];

  let paragraph: string[] = [];

  const flushParagraph = () => {
    if (paragraph.length > 0) {
      elements.push(
        <p key={`p-${elements.length}`} className="leading-7">
          {formatInline(paragraph.join(' '))}
        </p>
      );

      paragraph = [];
    }
  };

  lines.forEach((rawLine, index) => {
    const line = rawLine.trim();

    if (!line) {
      flushParagraph();
      return;
    }

    // Headings
    if (/^#{1,6}\s/.test(line)) {
      flushParagraph();

      const heading = line.replace(/^#{1,6}\s*/, '');

      elements.push(
        <h3
          key={`h-${index}`}
          className="mt-3 text-base font-bold text-slate-900"
        >
          {formatInline(heading)}
        </h3>
      );

      return;
    }

    // Horizontal separator
    if (/^[-*_]{3,}$/.test(line)) {
      flushParagraph();

      elements.push(
        <hr key={`hr-${index}`} className="my-3 border-slate-200" />
      );

      return;
    }

    // Bullet points
    if (/^[-*•]\s+/.test(line)) {
      flushParagraph();

      elements.push(
        <div key={`li-${index}`} className="flex items-start gap-2 pl-1">
          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" />
          <div className="min-w-0 flex-1 leading-7">
            {formatInline(line.replace(/^[-*•]\s+/, ''))}
          </div>
        </div>
      );

      return;
    }

    // Numbered lists
    if (/^\d+[.)]\s+/.test(line)) {
      flushParagraph();

      const number = line.match(/^\d+/)?.[0] || '';

      elements.push(
        <div key={`num-${index}`} className="flex items-start gap-2 pl-1">
          <span className="font-semibold text-brand-600">{number}.</span>
          <div className="min-w-0 flex-1 leading-7">
            {formatInline(line.replace(/^\d+[.)]\s+/, ''))}
          </div>
        </div>
      );

      return;
    }

    paragraph.push(line);
  });

  flushParagraph();

  return <div className="space-y-2">{elements}</div>;
}

function MessageBubble({ msg }: { msg: ChatMessage }) {
  const isUser = msg.role === 'user';

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn('flex items-start gap-3', isUser && 'flex-row-reverse')}
    >
      <Avatar role={msg.role} />

      <div className={cn('max-w-[85%] min-w-0', isUser && 'items-end')}>
        <div
          className={cn(
            'rounded-2xl px-4 py-3 text-sm leading-relaxed',
            isUser
              ? 'rounded-tr-sm bg-gradient-to-br from-brand-600 to-brand-700 text-white'
              : 'rounded-tl-sm bg-slate-50 text-slate-700'
          )}
        >
          {isUser ? (
            <div className="whitespace-pre-wrap break-words">{msg.text}</div>
          ) : (
            <FormattedAnswer text={msg.text} />
          )}
        </div>

        {msg.sources && msg.sources.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {msg.sources.map((source, index) => (
              <span
                key={index}
                className="inline-flex items-center gap-1.5 rounded-lg bg-white px-2.5 py-1 text-[11px] font-medium text-slate-600 ring-1 ring-inset ring-slate-200"
              >
                <FileText className="h-3 w-3 text-brand-500" />
                {source.doc} · p.{source.page}
              </span>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

function Avatar({ role }: { role: 'user' | 'assistant' }) {
  if (role === 'user') {
    return (
      <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-navy-900 text-white">
        <User className="h-4 w-4" />
      </div>
    );
  }

  return (
    <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 text-white">
      <Sparkles className="h-4 w-4" />
    </div>
  );
}
