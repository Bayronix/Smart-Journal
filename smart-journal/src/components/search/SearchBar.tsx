'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Loader2 } from 'lucide-react';
import { useJournalStore } from '@/store/journalStore';
import { useT } from '@/store/langStore';
import { semanticSearch } from '@/services/api';
import type { SearchResult } from '@/types';
import { cn, truncate, formatDate } from '@/lib/utils';
import { moodConfig } from '@/lib/utils';
import Link from 'next/link';

export default function SearchBar() {
  const entries      = useJournalStore((s) => s.entries);
  const setSearchQuery = useJournalStore((s) => s.setSearchQuery);
  const t = useT();
  const [query, setQuery]     = useState('');
  const [focused, setFocused] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapperRef  = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (!wrapperRef.current?.contains(e.target as Node)) setFocused(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const runSearch = (value: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!value.trim()) { setResults([]); return; }
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const r = await semanticSearch(value, entries);
        setResults(r.slice(0, 6));
      } finally {
        setLoading(false);
      }
    }, 400);
  };

  const handleChange = (value: string) => {
    setQuery(value);
    setSearchQuery(value);
    runSearch(value);
  };

  const handleSuggestion = (s: string) => {
    setQuery(s);
    setSearchQuery(s);
    runSearch(s);
  };

  const clear = () => {
    setQuery('');
    setSearchQuery('');
    setResults([]);
    if (debounceRef.current) clearTimeout(debounceRef.current);
  };

  const showDropdown = focused && (results.length > 0 || !query || (query && !loading));

  return (
    <div ref={wrapperRef} className="relative w-full max-w-xl">
      {/* Input */}
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

      {/* Dropdown */}
      <AnimatePresence>
        {showDropdown && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full mt-2 left-0 right-0 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md border border-slate-200 dark:border-zinc-800 rounded-xl shadow-xl overflow-hidden z-50"
          >
            {/* Results */}
            {results.length > 0 && (
              <div>
                <p className="px-3 pt-3 pb-1.5 text-[10px] text-zinc-500 dark:text-zinc-500 uppercase tracking-wider font-semibold">
                  {t.search.results} · {results.length}
                </p>
                {results.map((r) => {
                  const mood = r.entry.analysis ? moodConfig[r.entry.analysis.mood] : null;
                  return (
                    <Link
                      key={r.entry.id}
                      href={`/journal/${r.entry.id}`}
                      onClick={() => setFocused(false)}
                      className="flex items-start gap-3 px-3 py-2.5 hover:bg-slate-50 dark:hover:bg-zinc-800/60 transition-colors border-t border-slate-100 dark:border-zinc-800/50 first:border-0"
                    >
                      {/* Mood dot */}
                      <span className="mt-0.5 text-base shrink-0" title={mood?.label}>
                        {mood ? mood.emoji : '📝'}
                      </span>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="text-sm text-slate-900 dark:text-zinc-100 font-medium truncate">
                            {r.entry.title || t.journal.untitled}
                          </p>
                          <span className="text-[10px] text-slate-400 dark:text-zinc-500 shrink-0 ml-auto">
                            {formatDate(r.entry.createdAt)}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-zinc-400 line-clamp-1">
                          {truncate(r.snippet, 90)}
                        </p>
                        {r.entry.tags.length > 0 && (
                          <div className="flex gap-1 mt-1 flex-wrap">
                            {r.entry.tags.slice(0, 3).map((tag) => (
                              <span key={tag} className="text-[10px] px-1.5 py-px rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400">
                                #{tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Relevance bar */}
                      <div className="flex flex-col items-end gap-1 shrink-0 mt-0.5">
                        <div className="w-8 h-1 rounded-full bg-slate-100 dark:bg-zinc-700 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-indigo-500"
                            style={{ width: `${Math.round(r.relevance * 100)}%` }}
                          />
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}

            {/* Suggestions when empty */}
            {!query && (
              <div>
                <p className="px-3 pt-3 pb-1.5 text-[10px] text-zinc-500 dark:text-zinc-500 uppercase tracking-wider font-semibold">
                  {t.search.tryAsking}
                </p>
                {t.search.suggestions.map((s) => (
                  <button
                    key={s}
                    onClick={() => handleSuggestion(s)}
                    className="w-full text-left px-3 py-2 text-sm text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800 hover:text-slate-900 dark:hover:text-zinc-100 transition-colors flex items-center gap-2"
                  >
                    <Search size={11} className="text-zinc-400 shrink-0" />
                    {s}
                  </button>
                ))}
              </div>
            )}

            {/* No results */}
            {query && results.length === 0 && !loading && (
              <p className="px-3 py-4 text-sm text-zinc-500 text-center">{t.search.noResults}</p>
            )}

            {/* Loading skeleton */}
            {loading && (
              <div className="px-3 py-3 space-y-2">
                {[1, 2].map((i) => (
                  <div key={i} className="h-10 rounded-lg bg-slate-100 dark:bg-zinc-800 animate-pulse" />
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
