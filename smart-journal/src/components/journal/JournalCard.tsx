'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Calendar, Trash2 } from 'lucide-react';
import type { JournalEntry } from '@/types';
import { formatDate, formatRelative, moodConfig, truncate } from '@/lib/utils';
import { useT } from '@/store/langStore';
import Badge from '@/components/ui/Badge';

interface Props {
  entry: JournalEntry;
  onDelete: (id: string) => void;
  index?: number;
}

export default function JournalCard({ entry, onDelete, index = 0 }: Props) {
  const mood = entry.analysis ? moodConfig[entry.analysis.mood] : null;
  const t = useT();

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.2, delay: index * 0.04 }}
      layout
      className="group relative bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl hover:border-slate-300 dark:hover:border-zinc-700 transition-all duration-200 overflow-hidden shadow-sm dark:shadow-none"
    >
      <Link href={`/journal/${entry.id}`} className="block p-5">
        <div className="flex items-start justify-between gap-3 mb-2">
          <h3 className="font-semibold text-slate-900 dark:text-zinc-100 text-sm leading-snug group-hover:text-indigo-600 dark:group-hover:text-white transition-colors line-clamp-1">
            {entry.title || t.journal.untitled}
          </h3>
          {mood && (
            <span className={`shrink-0 text-base ${mood.color}`} title={mood.label}>
              {mood.emoji}
            </span>
          )}
        </div>

        <p className="text-slate-600 dark:text-zinc-200 text-xs leading-relaxed mb-3 line-clamp-2">
          {truncate(entry.content, 150)}
        </p>

        {entry.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {entry.tags.slice(0, 4).map((tag) => (
              <Badge key={tag} variant="tag" className="text-[10px] px-2 py-px">#{tag}</Badge>
            ))}
            {entry.tags.length > 4 && (
              <Badge variant="default" className="text-[10px] px-2 py-px">+{entry.tags.length - 4}</Badge>
            )}
          </div>
        )}

        <div className="flex items-center gap-3 text-[11px] text-slate-600 dark:text-zinc-200">
          <Calendar size={11} />
          <span>{formatDate(entry.createdAt)}</span>
          <span className="ml-auto">{formatRelative(entry.createdAt)}</span>
        </div>

        {entry.analysis && (
          <div className="mt-2 h-0.5 bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                entry.analysis.stressLevel <= 3 ? 'bg-emerald-500'
                : entry.analysis.stressLevel <= 6 ? 'bg-yellow-500'
                : 'bg-red-500'
              }`}
              style={{ width: `${entry.analysis.stressLevel * 10}%` }}
            />
          </div>
        )}
      </Link>

      <button
        onClick={(e) => { e.preventDefault(); onDelete(entry.id); }}
        className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 p-1.5 rounded-md text-slate-600 dark:text-zinc-200 hover:text-red-500 hover:bg-red-50 dark:hover:text-red-400 dark:hover:bg-red-400/10 transition-all"
        title="Delete entry"
      >
        <Trash2 size={13} />
      </button>
    </motion.div>
  );
}
