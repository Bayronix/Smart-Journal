import StatsCards from '@/components/dashboard/StatsCards';
import MoodChart from '@/components/dashboard/MoodChart';
import WeeklySummary from '@/components/dashboard/WeeklySummary';
import SearchBar from '@/components/search/SearchBar';
import RecentEntries from '@/components/journal/RecentEntries';

export default function DashboardPage() {
  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold text-zinc-100">Dashboard</h1>
        <p className="text-sm text-zinc-500 mt-0.5">Your journal at a glance</p>
      </div>

      <SearchBar />
      <StatsCards />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <MoodChart />
        </div>
        <div>
          <WeeklySummary />
        </div>
      </div>

      <div>
        <h2 className="text-sm font-semibold text-zinc-400 mb-3">Recent Entries</h2>
        <RecentEntries />
      </div>
    </div>
  );
}
