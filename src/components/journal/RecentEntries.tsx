'use client';

import { useMemo } from 'react';
import { AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { PenSquare } from 'lucide-react';
import { useJournalStore } from '@/store/journalStore';
import JournalCard from './JournalCard';
import Button from '@/components/ui/Button';

export default function RecentEntries() {
  const entries = useJournalStore((s) => s.entries);
  const deleteEntry = useJournalStore((s) => s.deleteEntry);
  const recent = useMemo(() => entries.slice(0, 6), [entries]);

  if (recent.length === 0) {
    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 flex flex-col items-center gap-3 text-center">
        <PenSquare size={24} className="text-zinc-600" />
        <p className="text-zinc-500 text-sm">No entries yet. Start your first one.</p>
        <Link href="/journal/new">
          <Button size="sm">New Entry</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
      <AnimatePresence mode="popLayout">
        {recent.map((entry, i) => (
          <JournalCard key={entry.id} entry={entry} onDelete={deleteEntry} index={i} />
        ))}
      </AnimatePresence>
    </div>
  );
}
