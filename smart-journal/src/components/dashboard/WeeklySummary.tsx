'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, RefreshCw, ChevronDown } from 'lucide-react';
import { useJournalStore } from '@/store/journalStore';
import { generateWeeklySummary } from '@/services/api';
import { moodConfig, formatDate } from '@/lib/utils';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';

export default function WeeklySummary() {
  const entries = useJournalStore((s) => s.entries);
  const weeklySummary = useJournalStore((s) => s.weeklySummary);
  const setWeeklySummary = useJournalStore((s) => s.setWeeklySummary);
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

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
      <div
        className="flex items-center gap-3 px-5 py-4 cursor-pointer select-none"
        onClick={() => weeklySummary && setExpanded(!expanded)}
      >
        <Sparkles size={15} className="text-indigo-400" />
        <h3 className="text-sm font-semibold text-zinc-300 flex-1">Weekly AI Summary</h3>
        {weeklySummary && (
          <motion.div animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
            <ChevronDown size={15} className="text-zinc-600" />
          </motion.div>
        )}
        <Button
          variant="ghost"
          size="sm"
          loading={loading}
          onClick={(e) => { e.stopPropagation(); handleGenerate(); }}
          disabled={!entries.length}
          className="text-xs"
        >
          <RefreshCw size={12} />
          {weeklySummary ? 'Refresh' : 'Generate'}
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
            <div className="px-5 pb-5 border-t border-zinc-800 pt-4 space-y-4">
              {/* Mood + Stress row */}
              <div className="flex items-center gap-3 flex-wrap">
                {mood && (
                  <span className={`flex items-center gap-2 rounded-full px-3 py-1 text-sm font-medium ${mood.bg} ${mood.color}`}>
                    {mood.emoji} {mood.label}
                  </span>
                )}
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-zinc-500">Avg Stress:</span>
                  <span className={`font-semibold ${
                    weeklySummary.avgStressLevel > 6 ? 'text-red-400' : 'text-emerald-400'
                  }`}>{weeklySummary.avgStressLevel}/10</span>
                </div>
                <span className="text-xs text-zinc-600 ml-auto">
                  {formatDate(weeklySummary.generatedAt)}
                </span>
              </div>

              {/* Summary text */}
              <p className="text-sm text-zinc-300 leading-relaxed">{weeklySummary.summary}</p>

              {/* Top topics */}
              {weeklySummary.topTopics.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {weeklySummary.topTopics.map((topic) => (
                    <Badge key={topic} variant="tag">{topic}</Badge>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!weeklySummary && !loading && entries.length === 0 && (
        <p className="px-5 pb-5 text-xs text-zinc-600">Write some entries first to generate a summary.</p>
      )}
    </div>
  );
}
