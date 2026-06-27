'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, RefreshCw, ChevronDown } from 'lucide-react';
import { useJournalStore } from '@/store/journalStore';
import { useT } from '@/store/langStore';
import { generateWeeklySummary } from '@/services/api';
import { moodConfig, formatDate } from '@/lib/utils';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';

export default function WeeklySummary() {
  const entries = useJournalStore((s) => s.entries);
  const weeklySummary = useJournalStore((s) => s.weeklySummary);
  const setWeeklySummary = useJournalStore((s) => s.setWeeklySummary);
  const t = useT();
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(true);

  const handleGenerate = async () => {
    if (!entries.length) return;
    setLoading(true);
    try {
      const summary = await generateWeeklySummary(entries);
      setWeeklySummary(summary);
      setExpanded(true);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const mood = weeklySummary ? moodConfig[weeklySummary.dominantMood] : null;
  const moodLabel = weeklySummary
    ? (t.moods[weeklySummary.dominantMood] ?? mood?.label ?? weeklySummary.dominantMood)
    : '';

  return (
    <div className="bg-white/70 dark:bg-black/30 backdrop-blur-md border border-white/40 dark:border-white/10 rounded-xl overflow-hidden shadow-sm dark:shadow-none">
      <div className="flex items-center gap-3 px-5 py-4 cursor-pointer select-none"
        onClick={() => weeklySummary && setExpanded(!expanded)}
      >
        <Sparkles size={15} className="text-indigo-500 dark:text-indigo-400" />
        <h3 className="text-sm font-semibold text-slate-700 dark:text-zinc-200 flex-1">{t.summary.title}</h3>
        {weeklySummary && (
          <motion.div animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
            <ChevronDown size={15} className="text-slate-600 dark:text-zinc-200" />
          </motion.div>
        )}
        <Button variant="ghost" size="sm" loading={loading}
          onClick={(e) => { e.stopPropagation(); handleGenerate(); }}
          disabled={!entries.length} className="text-xs"
        >
          <RefreshCw size={12} />
          {weeklySummary ? t.summary.refresh : t.summary.generate}
        </Button>
      </div>

      <AnimatePresence initial={false}>
        {expanded && weeklySummary && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 border-t border-slate-100 dark:border-zinc-800 pt-4 space-y-4">
              <div className="flex items-center gap-3 flex-wrap">
                {mood && (
                  <span className={`flex items-center gap-2 rounded-full px-3 py-1 text-sm font-medium ${mood.bg} ${mood.color}`}>
                    {mood.emoji} {moodLabel}
                  </span>
                )}
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-slate-600 dark:text-zinc-200">{t.summary.avgStress}</span>
                  <span className={`font-semibold ${weeklySummary.avgStressLevel > 6 ? 'text-red-500 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                    {weeklySummary.avgStressLevel}/10
                  </span>
                </div>
                <span className="text-xs text-slate-600 dark:text-zinc-200 ml-auto">{formatDate(weeklySummary.generatedAt)}</span>
              </div>
              <p className="text-sm text-slate-800 dark:text-zinc-200 leading-relaxed">{weeklySummary.summary}</p>
              {weeklySummary.topTopics.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {weeklySummary.topTopics.map((topic) => <Badge key={topic} variant="tag">{topic}</Badge>)}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!weeklySummary && !loading && entries.length === 0 && (
        <p className="px-5 pb-5 text-xs text-slate-600 dark:text-zinc-200">{t.summary.empty}</p>
      )}
    </div>
  );
}
