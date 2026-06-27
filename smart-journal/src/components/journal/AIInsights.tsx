'use client';

import { motion } from 'framer-motion';
import { Brain, TrendingUp, Lightbulb, Tag } from 'lucide-react';
import type { AIAnalysis } from '@/types';
import { moodConfig } from '@/lib/utils';
import { useT } from '@/store/langStore';
import Badge from '@/components/ui/Badge';

interface Props { analysis: AIAnalysis }

export default function AIInsights({ analysis }: Props) {
  const t = useT();
  const mood = moodConfig[analysis.mood];

  const stressColor = analysis.stressLevel <= 3 ? 'text-emerald-400' : analysis.stressLevel <= 6 ? 'text-yellow-400' : 'text-red-400';
  const stressBg    = analysis.stressLevel <= 3 ? 'bg-emerald-400'   : analysis.stressLevel <= 6 ? 'bg-yellow-400'   : 'bg-red-400';

  // Translated mood label
  const moodLabel = t.moods[analysis.mood] ?? mood.label;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 divide-y divide-slate-100 dark:divide-zinc-800 overflow-hidden shadow-sm dark:shadow-none"
    >
      {/* Header */}
      <div className="flex items-center gap-2.5 px-4 py-3">
        <Brain size={15} className="text-indigo-400" />
        <span className="text-sm font-semibold text-slate-900 dark:text-zinc-100">{t.insights.title}</span>
        <span className="ml-auto text-xs text-slate-600 dark:text-zinc-200">
          {new Date(analysis.analyzedAt).toLocaleDateString()}
        </span>
      </div>

      {/* Mood + Stress */}
      <div className="px-4 py-3 flex items-center gap-4">
        <div className={`flex items-center gap-2 rounded-full px-3 py-1 text-sm font-medium ${mood.bg} ${mood.color}`}>
          <span>{mood.emoji}</span>
          <span>{moodLabel}</span>
        </div>
        <div className="flex items-center gap-2 flex-1">
          <TrendingUp size={13} className={stressColor} />
          <span className="text-xs text-slate-600 dark:text-zinc-200 shrink-0">{t.insights.stress}</span>
          <div className="flex-1 h-1.5 bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${analysis.stressLevel * 10}%` }}
              transition={{ delay: 0.2, duration: 0.5, ease: 'easeOut' }}
              className={`h-full rounded-full ${stressBg}`}
            />
          </div>
          <span className={`text-xs font-semibold ${stressColor} shrink-0`}>{analysis.stressLevel}/10</span>
        </div>
      </div>

      {/* Key Topics */}
      {analysis.keyTopics.length > 0 && (
        <div className="px-4 py-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-zinc-200 mb-2">
            <Tag size={11} /> {t.insights.keyTopics}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {analysis.keyTopics.map((topic) => <Badge key={topic} variant="tag">{topic}</Badge>)}
          </div>
        </div>
      )}

      {/* Insights */}
      <div className="px-4 py-3">
        <p className="text-xs text-slate-600 dark:text-zinc-200 mb-1.5 flex items-center gap-1.5">
          <Brain size={11} /> {t.insights.insight}
        </p>
        <p className="text-sm text-slate-800 dark:text-zinc-200 leading-relaxed">{analysis.insights}</p>
      </div>

      {/* Advice */}
      <div className="px-4 py-3 bg-indigo-50 dark:bg-indigo-950/30">
        <p className="text-xs text-slate-600 dark:text-zinc-200 mb-1.5 flex items-center gap-1.5">
          <Lightbulb size={11} /> {t.insights.advice}
        </p>
        <p className="text-sm text-indigo-700 dark:text-indigo-200 leading-relaxed">{analysis.advice}</p>
      </div>
    </motion.div>
  );
}
