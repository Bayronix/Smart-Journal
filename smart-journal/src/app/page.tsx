'use client';

import DashboardHero   from '@/components/dashboard/DashboardHero';
import QuickStats      from '@/components/dashboard/QuickStats';
import MoodChart       from '@/components/dashboard/MoodChart';
import WeeklySummary   from '@/components/dashboard/WeeklySummary';
import SearchBar       from '@/components/search/SearchBar';
import RecentEntries   from '@/components/journal/RecentEntries';
import { useT }        from '@/store/langStore';
import { useJournalStore } from '@/store/journalStore';

export default function DashboardPage() {
  const t       = useT();
  const entries = useJournalStore((s) => s.entries);
  const hasChart = entries.filter((e) => e.analysis).length >= 2;

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 max-w-5xl mx-auto">

      {/* ── Greeting bar ──────────────────────────────────────── */}
      <DashboardHero />

      {/* ── Search ────────────────────────────────────────────── */}
      <div className="mt-5">
        <SearchBar />
      </div>

      {/* ── Main two-column layout ────────────────────────────── */}
      <div className="mt-5 grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Left — Recent entries (wider) */}
        <div className="lg:col-span-2">
          <h2 className="text-xs font-semibold text-slate-400 dark:text-zinc-600 uppercase tracking-wider mb-3">
            {t.dashboard.recentEntries}
          </h2>
          <RecentEntries />
        </div>

        {/* Right — Context sidebar */}
        <div className="flex flex-col gap-4">
          <QuickStats />
          <WeeklySummary />
        </div>
      </div>

      {/* ── Mood chart — only if enough data ──────────────────── */}
      {hasChart && (
        <div className="mt-5">
          <MoodChart />
        </div>
      )}

    </div>
  );
}
