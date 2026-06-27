import JournalList from '@/components/journal/JournalList';
import SearchBar from '@/components/search/SearchBar';
import Link from 'next/link';
import { PenSquare } from 'lucide-react';

export default function JournalPage() {
  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-zinc-100">Journal</h1>
          <p className="text-sm text-zinc-500 mt-0.5">All your entries</p>
        </div>
        <Link
          href="/journal/new"
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          <PenSquare size={14} />
          New Entry
        </Link>
      </div>

      <SearchBar />
      <JournalList />
    </div>
  );
}
