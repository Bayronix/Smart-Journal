'use client';

import { useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { PenSquare } from 'lucide-react';
import Link from 'next/link';
import { useJournalStore } from '@/store/journalStore';
import { localSearch } from '@/lib/search';
import JournalCard from './JournalCard';
import Button from '@/components/ui/Button';

export default function JournalList() {
  const entries = useJournalStore((s) => s.entries);
  const deleteEntry = useJournalStore((s) => s.deleteEntry);
  const searchQuery = useJournalStore((s) => s.searchQuery);
  const activeTag = useJournalStore((s) => s.activeTag);

  const displayed = useMemo(() => {
    let result = entries;

    if (activeTag) {
      result = result.filter((e) => e.tags.includes(activeTag));
    }

    if (searchQuery.trim()) {
      const searchResults = localSearch(result, searchQuery);
      return searchResults.map((r) => r.entry);
    }

    return result;
  }, [entries, searchQuery, activeTag]);

  if (entries.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center justify-center py-24 gap-4 text-center"
      >
        <div className="w-16 h-16 rounded-2xl bg-zinc-800 flex items-center justify-center">
          <PenSquare size={28} className="text-zinc-600" />
        </div>
        <div>
          <p className="text-zinc-300 font-medium mb-1">No entries yet</p>
          <p className="text-zinc-600 text-sm">Start writing your first journal entry</p>
        </div>
        <Link href="/journal/new">
          <Button>Write your first entry</Button>
        </Link>
      </motion.div>
    );
  }

  return (
    <div>
      {searchQuery && (
        <p className="text-sm text-zinc-500 mb-4">
          {displayed.length} result{displayed.length !== 1 ? 's' : ''} for &ldquo;{searchQuery}&rdquo;
        </p>
      )}

      {displayed.length === 0 ? (
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-zinc-600 text-sm py-12 text-center">
          No entries match your search.
        </motion.p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          <AnimatePresence mode="popLayout">
            {displayed.map((entry, i) => (
              <JournalCard
                key={entry.id}
                entry={entry}
                onDelete={deleteEntry}
                index={i}
              />
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
