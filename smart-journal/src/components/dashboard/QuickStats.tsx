'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';

// Computed once at module load — stable across renders, no impurity during render
const SEVEN_DAYS_AGO = Date.now() - 7 * 86_400_000;
import { useJournalStore } from '@/store/journalStore';
import { useLangStore } from '@/store/langStore';
import { moodConfig } from '@/lib/utils';

export default function QuickStats() {
  const entries = useJournalStore((s) => s.entries);
  const lang    = useLangStore((s) => s.lang);

  const { total, thisWeek, avgStress, topMood } = useMemo(() => {
    const analyzed = entries.filter((e) => e.analysis);
    const avgStress = analyzed.length
      ? +(analyzed.reduce((s, e) => s + (e.analysis?.stressLevel ?? 0), 0) / analyzed.length).toFixed(1)
      : null;
    const counts: Record<string, number> = {};
    for (const e of analyzed) {
      const m = e.analysis?.mood;
      if (m) counts[m] = (counts[m] ?? 0) + 1;
    }
    const topMood = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0];
    const thisWeek = entries.filter((e) =>
      new Date(e.createdAt).getTime() >= SEVEN_DAYS_AGO
    ).length;
    return { total: entries.length, thisWeek, avgStress, topMood };
  }, [entries]);

  const topMoodCfg = topMood ? moodConfig[topMood as keyof typeof moodConfig] : null;

  const items = [
    {
      emoji: '📚',
      value: total,
      label: lang === 'en' ? 'Total entries' : lang === 'pl' ? 'Wszystkich wpisów' : 'Всього записів',
    },
    {
      emoji: '📅',
      value: thisWeek,
      label: lang === 'en' ? 'This week' : lang === 'pl' ? 'W tym tygodniu' : 'Цього тижня',
    },
    {
      emoji: avgStress != null && avgStress > 6 ? '😰' : '😌',
      value: avgStress != null ? `${avgStress}/10` : '—',
      label: lang === 'en' ? 'Avg stress' : lang === 'pl' ? 'Śr. stres' : 'Сер. стрес',
    },
    {
      emoji: topMoodCfg?.emoji ?? '💭',
      value: topMoodCfg
        ? (lang === 'en' ? topMoodCfg.label : topMoodCfg.label)
        : '—',
      label: lang === 'en' ? 'Top mood' : lang === 'pl' ? 'Nastrój' : 'Настрій',
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-2">
      {items.map((item, i) => (
        <motion.div
          key={item.label}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: i * 0.06 }}
          className="bg-white/70 dark:bg-black/30 backdrop-blur-md border border-white/40 dark:border-white/10 rounded-xl px-3 py-3"
        >
          <p className="text-lg mb-1">{item.emoji}</p>
          <p className="text-base font-bold text-slate-900 dark:text-zinc-100 truncate">{item.value}</p>
          <p className="text-[10px] text-slate-400 dark:text-zinc-600 mt-0.5 leading-tight">{item.label}</p>
        </motion.div>
      ))}
    </div>
  );
}
