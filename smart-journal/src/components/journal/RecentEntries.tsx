'use client';

import { useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Link from 'next/link';
import { PenSquare, ArrowRight } from 'lucide-react';
import { useJournalStore } from '@/store/journalStore';
import { useLangStore } from '@/store/langStore';
import JournalCard from './JournalCard';

export default function RecentEntries() {
  const entries     = useJournalStore((s) => s.entries);
  const deleteEntry = useJournalStore((s) => s.deleteEntry);
  const lang        = useLangStore((s) => s.lang);
  const recent      = useMemo(() => entries.slice(0, 6), [entries]);

  if (recent.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-white/70 dark:bg-black/30 backdrop-blur-md border border-white/40 dark:border-white/10 rounded-2xl p-10 flex flex-col items-center gap-4 text-center"
      >
        <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center">
          <PenSquare size={22} className="text-indigo-400" />
        </div>
        <div>
          <p className="font-semibold text-slate-800 dark:text-zinc-200 mb-1">
            {lang === 'en' ? 'No entries yet' : lang === 'pl' ? 'Brak wpisów' : 'Записів ще немає'}
          </p>
          <p className="text-sm text-slate-400 dark:text-zinc-600">
            {lang === 'en' ? 'Start writing your first journal entry' : lang === 'pl' ? 'Napisz swój pierwszy wpis' : 'Почни писати свій перший запис'}
          </p>
        </div>
        <Link href="/journal/new"
          className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors"
        >
          <PenSquare size={14} />
          {lang === 'en' ? 'Write first entry' : lang === 'pl' ? 'Napisz wpis' : 'Написати запис'}
        </Link>
      </motion.div>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        <AnimatePresence mode="popLayout">
          {recent.map((entry, i) => (
            <JournalCard key={entry.id} entry={entry} onDelete={deleteEntry} index={i} />
          ))}
        </AnimatePresence>
      </div>

      {entries.length > 6 && (
        <div className="mt-4 text-center">
          <Link href="/journal"
            className="inline-flex items-center gap-2 text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 font-medium transition-colors"
          >
            {lang === 'en' ? `See all ${entries.length} entries` : lang === 'pl' ? `Wszystkie wpisy (${entries.length})` : `Переглянути всі ${entries.length} записів`}
            <ArrowRight size={14} />
          </Link>
        </div>
      )}
    </div>
  );
}
