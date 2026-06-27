'use client';

import StatsCards from '@/components/dashboard/StatsCards';
import MoodChart from '@/components/dashboard/MoodChart';
import WeeklySummary from '@/components/dashboard/WeeklySummary';
import SearchBar from '@/components/search/SearchBar';
import RecentEntries from '@/components/journal/RecentEntries';
import { useT } from '@/store/langStore';

export default function DashboardPage() {
  const t = useT();
  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-zinc-100">{t.dashboard.title}</h1>
        <p className="text-sm text-slate-500 dark:text-zinc-500 mt-0.5">{t.dashboard.subtitle}</p>
      </div>

      <SearchBar />
      <StatsCards />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2"><MoodChart /></div>
        <div><WeeklySummary /></div>
      </div>

      <div>
        <h2 className="text-sm font-semibold text-slate-600 dark:text-zinc-400 mb-3">{t.dashboard.recentEntries}</h2>
        <RecentEntries />
      </div>
    </div>
  );
}
