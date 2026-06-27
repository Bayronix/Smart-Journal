import JournalEditor from '@/components/journal/JournalEditor';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function NewEntryPage() {
  return (
    <div className="min-h-screen">
      <div className="px-4 sm:px-6 pt-6 max-w-3xl mx-auto">
        <Link
          href="/journal"
          className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-300 transition-colors mb-2"
        >
          <ArrowLeft size={14} /> Back to Journal
        </Link>
      </div>
      <JournalEditor />
    </div>
  );
}
