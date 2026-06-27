'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Trash2 } from 'lucide-react';
import { useJournalStore } from '@/store/journalStore';
import { useT } from '@/store/langStore';
import JournalEditor from '@/components/journal/JournalEditor';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { formatDateLong } from '@/lib/utils';
import type { JournalEntry } from '@/types';

export default function EntryPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const hydrated = useJournalStore((s) => s.hydrated);
  const getEntry = useJournalStore((s) => s.getEntry);
  const deleteEntry = useJournalStore((s) => s.deleteEntry);
  const t = useT();
  const [entry, setEntry] = useState<JournalEntry | undefined>(undefined);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [notFoundState, setNotFoundState] = useState(false);

  useEffect(() => {
    if (!hydrated) return;
    const found = getEntry(id);
    if (!found) setNotFoundState(true);
    else setEntry(found);
  }, [hydrated, id, getEntry]);

  if (notFoundState) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4">
        <p className="text-slate-500 dark:text-zinc-500">{t.notFound}</p>
        <Link href="/journal" className="text-indigo-500 hover:text-indigo-400 text-sm">
          {t.editor.backToJournal}
        </Link>
      </div>
    );
  }

  if (!entry) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const handleDelete = () => {
    deleteEntry(id);
    router.push('/journal');
  };

  return (
    <div className="min-h-screen">
      <div className="px-4 sm:px-6 pt-6 max-w-3xl mx-auto flex items-center justify-between">
        <Link href="/journal"
          className="inline-flex items-center gap-2 text-sm text-slate-500 dark:text-zinc-500 hover:text-slate-800 dark:hover:text-zinc-200 transition-colors"
        >
          <ArrowLeft size={14} /> {t.editor.back}
        </Link>
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-500 dark:text-zinc-500">{formatDateLong(entry.createdAt)}</span>
          <button onClick={() => setDeleteOpen(true)}
            className="p-1.5 rounded-md text-slate-500 dark:text-zinc-500 hover:text-red-500 hover:bg-red-50 dark:hover:text-red-400 dark:hover:bg-red-400/10 transition-all"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      <JournalEditor entry={entry} />

      <Modal open={deleteOpen} onClose={() => setDeleteOpen(false)} title={t.editor.deleteEntry}>
        <p className="text-sm text-slate-500 dark:text-zinc-400 mb-6">
          {t.editor.deleteConfirm(entry.title || t.journal.untitled)}
        </p>
        <div className="flex gap-3 justify-end">
          <Button variant="secondary" onClick={() => setDeleteOpen(false)}>{t.editor.cancel}</Button>
          <Button variant="danger" onClick={handleDelete}>{t.editor.delete}</Button>
        </div>
      </Modal>
    </div>
  );
}
