'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Trash2, Bot, User, Sparkles, AlertCircle } from 'lucide-react';
import { useJournalStore } from '@/store/journalStore';
import { useChatStore } from '@/store/chatStore';
import { useT, useLangStore } from '@/store/langStore';
import { cn } from '@/lib/utils';

const SUGGESTIONS_UA = [
  'Який у мене найчастіший настрій?',
  'Коли я найбільше стресував?',
  'Які теми я найчастіше піднімаю?',
  'Що допомагало мені почуватися краще?',
  'Проаналізуй мій емоційний стан за останній місяць',
];
const SUGGESTIONS_EN = [
  'What is my most common mood?',
  'When do I stress the most?',
  'What topics come up most often?',
  'What helps me feel better?',
  'Analyze my emotional state over the last month',
];
const SUGGESTIONS_PL = [
  'Jaki mam najczęstszy nastrój?',
  'Kiedy najbardziej się stresuję?',
  'Jakie tematy poruszam najczęściej?',
  'Co pomaga mi czuć się lepiej?',
  'Przeanalizuj mój stan emocjonalny w ostatnim miesiącu',
];

function TypingDots() {
  return (
    <div className="flex items-center gap-1 px-4 py-3">
      {[0, 1, 2].map((i) => (
        <motion.span key={i} className="w-2 h-2 rounded-full bg-indigo-400"
          animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1, 0.8] }}
          transition={{ repeat: Infinity, duration: 1.2, delay: i * 0.2 }}
        />
      ))}
    </div>
  );
}

export default function ChatView() {
  const entries = useJournalStore((s) => s.entries);
  const { messages, streaming, addUserMessage, appendToLast, setStreaming, clear } = useChatStore();
  const t = useT();
  const lang = useLangStore((s) => s.lang);
  const [input, setInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const langSuggestions = lang === 'pl' ? SUGGESTIONS_PL : lang === 'en' ? SUGGESTIONS_EN : SUGGESTIONS_UA;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streaming]);

  const send = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || streaming) return;

    setInput('');
    setError(null);
    addUserMessage(trimmed);
    setStreaming(true);

    const history = [...messages, { role: 'user' as const, content: trimmed }];

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: history.map((m) => ({ role: m.role, content: m.content })),
          entries,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Request failed' }));
        throw new Error(err.error ?? 'Chat failed');
      }

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) throw new Error('No response stream');

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        appendToLast(decoder.decode(value, { stream: true }));
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Something went wrong';
      setError(msg);
    } finally {
      setStreaming(false);
    }
  }, [streaming, messages, entries, addUserMessage, appendToLast, setStreaming]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send(input);
    }
  };

  const isEmpty = messages.length === 0;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-slate-200 dark:border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center shadow-sm">
            <Bot size={18} className="text-white" />
          </div>
          <div>
            <h2 className="font-semibold text-slate-900 dark:text-zinc-100 text-sm">Aria</h2>
            <p className="text-xs text-slate-500 dark:text-zinc-500">LLaMA 3.3 70B · знає твій щоденник</p>
          </div>
        </div>
        {messages.length > 0 && (
          <button onClick={clear}
            className="p-1.5 rounded-md text-slate-400 dark:text-zinc-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-400/10 transition-all"
            title="Clear chat"
          >
            <Trash2 size={15} />
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 space-y-4">
        {isEmpty ? (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center h-full gap-6 text-center pb-10"
          >
            <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-600/20 flex items-center justify-center">
              <Sparkles size={28} className="text-indigo-500 dark:text-indigo-400" />
            </div>
            <div>
              <p className="font-semibold text-slate-800 dark:text-zinc-200 mb-1">
                {entries.length === 0 ? 'Спочатку напиши кілька записів' : 'Запитай мене про свій щоденник'}
              </p>
              <p className="text-sm text-slate-500 dark:text-zinc-500">
                {entries.length === 0
                  ? 'Я зможу аналізувати твої записи та відповідати на запитання'
                  : `Я знаю ${entries.length} твоїх записів і можу знайти патерни та інсайти`}
              </p>
            </div>
            {entries.length > 0 && (
              <div className="flex flex-wrap gap-2 justify-center max-w-sm">
                {langSuggestions.map((s) => (
                  <button key={s} onClick={() => send(s)}
                    className="px-3 py-1.5 rounded-full text-xs bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 hover:bg-indigo-50 dark:hover:bg-indigo-600/20 hover:text-indigo-600 dark:hover:text-indigo-300 transition-colors border border-slate-200 dark:border-zinc-700"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        ) : (
          <AnimatePresence initial={false}>
            {messages.map((msg) => (
              <motion.div key={msg.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className={cn('flex gap-3', msg.role === 'user' ? 'justify-end' : 'justify-start')}
              >
                {msg.role === 'assistant' && (
                  <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center shrink-0 mt-0.5">
                    <Bot size={13} className="text-white" />
                  </div>
                )}
                <div className={cn(
                  'max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed',
                  msg.role === 'user'
                    ? 'bg-indigo-600 text-white rounded-tr-sm'
                    : 'bg-white dark:bg-zinc-800 text-slate-800 dark:text-zinc-200 border border-slate-200 dark:border-zinc-700 rounded-tl-sm shadow-sm'
                )}>
                  {msg.content || (streaming && msg.role === 'assistant' ? <TypingDots /> : '')}
                </div>
                {msg.role === 'user' && (
                  <div className="w-7 h-7 rounded-lg bg-slate-200 dark:bg-zinc-700 flex items-center justify-center shrink-0 mt-0.5">
                    <User size={13} className="text-slate-600 dark:text-zinc-300" />
                  </div>
                )}
              </motion.div>
            ))}
            {streaming && messages[messages.length - 1]?.role === 'user' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3">
                <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center shrink-0 mt-0.5">
                  <Bot size={13} className="text-white" />
                </div>
                <div className="bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-2xl rounded-tl-sm shadow-sm">
                  <TypingDots />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        )}

        {error && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm"
          >
            <AlertCircle size={15} className="shrink-0" />
            <span>{error}</span>
          </motion.div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-4 sm:px-6 py-4 border-t border-slate-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-950/50 backdrop-blur">
        <div className="flex items-end gap-3 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded-2xl px-4 py-3 shadow-sm focus-within:border-indigo-500 transition-colors">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => { setInput(e.target.value); e.target.style.height = 'auto'; e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px'; }}
            onKeyDown={handleKeyDown}
            placeholder={entries.length > 0 ? 'Запитай мене про свій щоденник…' : 'Спочатку напиши кілька записів…'}
            disabled={streaming || entries.length === 0}
            rows={1}
            className="flex-1 bg-transparent text-sm text-slate-800 dark:text-zinc-200 placeholder-slate-400 dark:placeholder-zinc-600 outline-none resize-none leading-relaxed disabled:opacity-50"
            style={{ minHeight: '24px', maxHeight: '120px' }}
          />
          <button
            onClick={() => send(input)}
            disabled={!input.trim() || streaming || entries.length === 0}
            className="w-8 h-8 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:pointer-events-none flex items-center justify-center transition-colors shrink-0"
          >
            <Send size={14} className="text-white" />
          </button>
        </div>
        <p className="text-[11px] text-slate-400 dark:text-zinc-600 mt-2 text-center">
          Enter — надіслати · Shift+Enter — новий рядок · LLaMA 3.3 70B via Groq
        </p>
      </div>
    </div>
  );
}
