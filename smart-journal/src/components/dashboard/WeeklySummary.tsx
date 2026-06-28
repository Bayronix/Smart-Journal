'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, RefreshCw, ChevronDown } from 'lucide-react';
import { useJournalStore } from '@/store/journalStore';
import { useT, useLangStore } from '@/store/langStore';
import { generateWeeklySummary } from '@/services/api';
import { moodConfig, formatDate } from '@/lib/utils';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';

export default function WeeklySummary() {
  const entries = useJournalStore((s) => s.entries);
  const weeklySummary = useJournalStore((s) => s.weeklySummary);
  const setWeeklySummary = useJournalStore((s) => s.setWeeklySummary);
  const t = useT();
  const lang = useLangStore((s) => s.lang);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(true);
  const [genError, setGenError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!entries.length) return;
    setLoading(true);
    setGenError(null);
    try {
      const summary = await generateWeeklySummary(entries, lang);
      setWeeklySummary(summary);
      setExpanded(true);
    } catch (err) {
      setGenError(err instanceof Error ? err.message : 'Generation failed');
    } finally {
      setLoading(false);
    }
  };

  const mood = weeklySummary ? moodConfig[weeklySummary.dominantMood] : null;
  const moodLabel = weeklySummary
    ? (t.moods[weeklySummary.dominantMood] ?? mood?.label ?? weeklySummary.dominantMood)
    : '';
  // True when existing summary was generated in a different language
  const langMismatch = !!weeklySummary?.lang && weeklySummary.lang !== lang;

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

      {langMismatch && !loading && (
        <div className="mx-5 mb-4 flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/40 text-xs text-amber-700 dark:text-amber-400">
          <span>{t.summary.langMismatch}</span>
          <button
            onClick={handleGenerate}
            className="font-semibold underline underline-offset-2 hover:opacity-70 transition-opacity shrink-0"
          >
            {t.summary.refresh}
          </button>
        </div>
      )}
      {genError && (
        <p className="px-5 pb-4 text-xs text-red-500 dark:text-red-400">{genError}</p>
      )}
      {!weeklySummary && !loading && entries.length === 0 && (
        <p className="px-5 pb-5 text-xs text-slate-600 dark:text-zinc-200">{t.summary.empty}</p>
      )}
    </div>
  );
}
