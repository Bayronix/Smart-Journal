'use client';

import JournalEditor from '@/components/journal/JournalEditor';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { useT } from '@/store/langStore';

export default function NewEntryPage() {
  const t = useT();
  return (
    <div className="min-h-screen">
      <div className="px-4 sm:px-6 pt-6 max-w-3xl mx-auto">
        <Link href="/journal"
          className="inline-flex items-center gap-2 text-sm text-slate-500 dark:text-zinc-500 hover:text-slate-800 dark:hover:text-zinc-200 transition-colors mb-2"
        >
          <ArrowLeft size={14} /> {t.editor.backToJournal}
        </Link>
      </div>
      <JournalEditor />
    </div>
  );
}
