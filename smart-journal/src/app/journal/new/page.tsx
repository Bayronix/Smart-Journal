'use client';

import JournalEditor from '@/components/journal/JournalEditor';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { useT } from '@/store/langStore';

export default function NewEntryPage() {
  const t = useT();
  return (
    <div className="min-h-screen px-4 sm:px-6 py-6 max-w-3xl mx-auto flex flex-col gap-4">
      <Link
        href="/journal"
        className="inline-flex items-center gap-2 text-sm text-slate-500 dark:text-zinc-500 hover:text-slate-800 dark:hover:text-zinc-200 transition-colors self-start"
      >
        <ArrowLeft size={14} /> {t.editor.backToJournal}
      </Link>

      <div className="bg-white/70 dark:bg-black/30 backdrop-blur-md border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden">
        <JournalEditor />
      </div>
    </div>
  );
}
