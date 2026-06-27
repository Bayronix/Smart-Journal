'use client';

import { useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { useJournalStore } from '@/store/journalStore';
import { formatDate } from '@/lib/utils';

const MOOD_SCORE: Record<string, number> = {
  excited: 9,
  happy: 8,
  grateful: 7,
  motivated: 7,
  neutral: 5,
  anxious: 3,
  frustrated: 3,
  sad: 2,
};

interface TooltipProps {
  active?: boolean;
  payload?: { value: number; payload: { mood: string; dateLabel: string } }[];
}

function CustomTooltip({ active, payload }: TooltipProps) {
  if (!active || !payload?.length) return null;
  const { mood, dateLabel } = payload[0].payload;
  return (
    <div className="bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-xs shadow-xl">
      <p className="text-zinc-400">{dateLabel}</p>
      <p className="text-zinc-100 font-medium capitalize mt-0.5">{mood}</p>
      <p className="text-zinc-500">score: {payload[0].value}</p>
    </div>
  );
}

export default function MoodChart() {
  const entries = useJournalStore((s) => s.entries);

  const data = useMemo(() => {
    return entries
      .filter((e) => e.analysis)
      .slice(0, 14)
      .reverse()
      .map((e) => ({
        dateLabel: formatDate(e.createdAt),
        date: e.createdAt.slice(5, 10),
        mood: e.analysis!.mood,
        score: MOOD_SCORE[e.analysis!.mood] ?? 5,
        stress: e.analysis!.stressLevel,
      }));
  }, [entries]);

  if (data.length < 2) {
    return (
      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm dark:shadow-none">
        <h3 className="text-sm font-semibold text-slate-700 dark:text-zinc-300 mb-3">Mood Overview</h3>
        <p className="text-slate-400 dark:text-zinc-600 text-sm py-8 text-center">
          Analyze at least 2 entries to see your mood chart.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm dark:shadow-none">
      <h3 className="text-sm font-semibold text-slate-700 dark:text-zinc-300 mb-4">Mood Overview</h3>
      <ResponsiveContainer width="100%" height={180}>
        <AreaChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="moodGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="stressGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f87171" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#f87171" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
          <XAxis
            dataKey="date"
            tick={{ fill: '#52525b', fontSize: 10 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            domain={[1, 10]}
            tick={{ fill: '#52525b', fontSize: 10 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="score"
            stroke="#6366f1"
            strokeWidth={2}
            fill="url(#moodGrad)"
            dot={{ fill: '#6366f1', r: 3, strokeWidth: 0 }}
            activeDot={{ r: 5, fill: '#818cf8' }}
            name="mood"
          />
          <Area
            type="monotone"
            dataKey="stress"
            stroke="#f87171"
            strokeWidth={1.5}
            fill="url(#stressGrad)"
            dot={false}
            strokeDasharray="4 2"
            name="stress"
          />
        </AreaChart>
      </ResponsiveContainer>
      <div className="flex items-center gap-4 mt-2 justify-center text-[11px] text-zinc-600">
        <span className="flex items-center gap-1.5"><span className="w-4 h-0.5 bg-indigo-500 inline-block rounded" />Mood</span>
        <span className="flex items-center gap-1.5"><span className="w-4 h-0.5 bg-red-400 inline-block rounded" />Stress</span>
      </div>
    </div>
  );
}
