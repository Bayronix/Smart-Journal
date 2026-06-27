'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, TrendingDown, Smile, Calendar } from 'lucide-react';
import { useJournalStore } from '@/store/journalStore';
import { moodConfig } from '@/lib/utils';

export default function StatsCards() {
  const entries = useJournalStore((s) => s.entries);

  const stats = useMemo(() => {
    const analyzed = entries.filter((e) => e.analysis);
    const avgStress = analyzed.length
      ? Math.round(analyzed.reduce((sum, e) => sum + (e.analysis?.stressLevel ?? 0), 0) / analyzed.length * 10) / 10
      : null;

    const moodCounts: Record<string, number> = {};
    for (const e of analyzed) {
      if (e.analysis) moodCounts[e.analysis.mood] = (moodCounts[e.analysis.mood] ?? 0) + 1;
    }
    const topMood = Object.entries(moodCounts).sort((a, b) => b[1] - a[1])[0];

    const thisWeek = entries.filter((e) => {
      const d = new Date(e.createdAt);
      const now = new Date();
      const diff = (now.getTime() - d.getTime()) / 86400000;
      return diff <= 7;
    }).length;

    return { total: entries.length, avgStress, topMood, thisWeek };
  }, [entries]);

  const cards = [
    {
      label: 'Total Entries',
      value: stats.total,
      icon: BookOpen,
      color: 'text-indigo-400',
      bg: 'bg-indigo-400/10',
    },
    {
      label: 'This Week',
      value: stats.thisWeek,
      icon: Calendar,
      color: 'text-purple-400',
      bg: 'bg-purple-400/10',
    },
    {
      label: 'Avg Stress',
      value: stats.avgStress !== null ? `${stats.avgStress}/10` : '—',
      icon: TrendingDown,
      color: stats.avgStress !== null && stats.avgStress > 6 ? 'text-red-400' : 'text-emerald-400',
      bg: stats.avgStress !== null && stats.avgStress > 6 ? 'bg-red-400/10' : 'bg-emerald-400/10',
    },
    {
      label: 'Top Mood',
      value: stats.topMood
        ? `${moodConfig[stats.topMood[0] as keyof typeof moodConfig]?.emoji} ${moodConfig[stats.topMood[0] as keyof typeof moodConfig]?.label}`
        : '—',
      icon: Smile,
      color: 'text-yellow-400',
      bg: 'bg-yellow-400/10',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, i) => (
        <motion.div
          key={card.label}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.07 }}
          className="bg-zinc-900 border border-zinc-800 rounded-xl p-4"
        >
          <div className={`w-8 h-8 rounded-lg ${card.bg} flex items-center justify-center mb-3`}>
            <card.icon size={15} className={card.color} />
          </div>
          <p className="text-xl font-bold text-zinc-100">{card.value}</p>
          <p className="text-xs text-zinc-500 mt-0.5">{card.label}</p>
        </motion.div>
      ))}
    </div>
  );
}
