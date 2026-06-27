'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Loader2 } from 'lucide-react';
import { useJournalStore } from '@/store/journalStore';
import { useT } from '@/store/langStore';
import { semanticSearch } from '@/services/api';
import type { SearchResult } from '@/types';
import { cn, truncate } from '@/lib/utils';
import Link from 'next/link';

export default function SearchBar() {
  const entries = useJournalStore((s) => s.entries);
  const setSearchQuery = useJournalStore((s) => s.setSearchQuery);
  const t = useT();
  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (!wrapperRef.current?.contains(e.target as Node)) setFocused(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleChange = (value: string) => {
    setQuery(value);
    setSearchQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!value.trim()) { setResults([]); return; }
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const r = await semanticSearch(value, entries);
        setResults(r.slice(0, 5));
      } finally {
        setLoading(false);
      }
    }, 500);
  };

  const clear = () => { setQuery(''); setSearchQuery(''); setResults([]); };

  return (
    <div ref={wrapperRef} className="relative w-full max-w-xl">
      <div className={cn(
        'flex items-center gap-2 px-3 py-2 rounded-xl bg-white dark:bg-zinc-900 border transition-colors shadow-sm dark:shadow-none',
        focused ? 'border-indigo-500' : 'border-slate-200 dark:border-zinc-800'
      )}>
        {loading
          ? <Loader2 size={15} className="text-zinc-500 animate-spin shrink-0" />
          : <Search size={15} className="text-zinc-500 shrink-0" />
        }
        <input
          type="text"
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          onFocus={() => setFocused(true)}
          placeholder={t.search.placeholder}
          className="flex-1 bg-transparent text-sm text-slate-700 dark:text-zinc-200 placeholder-slate-400 dark:placeholder-zinc-600 outline-none"
        />
        {query && (
          <button onClick={clear} className="text-zinc-600 hover:text-zinc-400 transition-colors">
            <X size={14} />
          </button>
        )}
      </div>

      <AnimatePresence>
        {focused && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full mt-2 left-0 right-0 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl shadow-xl overflow-hidden z-50"
          >
            {results.length > 0 && (
              <div>
                <p className="px-3 pt-3 pb-1 text-[10px] text-zinc-600 uppercase tracking-wider font-semibold">{t.search.results}</p>
                {results.map((r) => (
                  <Link key={r.entry.id} href={`/journal/${r.entry.id}`} onClick={() => setFocused(false)}
                    className="block px-3 py-2.5 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors border-t border-slate-100 dark:border-zinc-800/50 first:border-0"
                  >
                    <p className="text-sm text-slate-900 dark:text-zinc-200 font-medium line-clamp-1">{r.entry.title || t.journal.untitled}</p>
                    <p className="text-xs text-slate-600 dark:text-zinc-200 line-clamp-1 mt-0.5">{truncate(r.snippet, 90)}</p>
                  </Link>
                ))}
              </div>
            )}

            {!query && (
              <div>
                <p className="px-3 pt-3 pb-1 text-[10px] text-zinc-600 uppercase tracking-wider font-semibold">{t.search.tryAsking}</p>
                {t.search.suggestions.map((s) => (
                  <button key={s} onClick={() => handleChange(s)}
                    className="w-full text-left px-3 py-2 text-sm text-slate-700 dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-800 hover:text-slate-900 dark:hover:text-zinc-100 transition-colors flex items-center gap-2"
                  >
                    <Search size={12} className="text-zinc-600" />
                    {s}
                  </button>
                ))}
              </div>
            )}

            {query && results.length === 0 && !loading && (
              <p className="px-3 py-4 text-sm text-zinc-600 text-center">{t.search.noResults}</p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
