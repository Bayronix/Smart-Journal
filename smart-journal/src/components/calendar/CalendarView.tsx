'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, isSameDay, isSameMonth, addMonths, subMonths,
  isToday,
} from 'date-fns';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useJournalStore } from '@/store/journalStore';
import { useT } from '@/store/langStore';
import { moodConfig, moodChartColor } from '@/lib/utils';
import type { JournalEntry } from '@/types';
import Link from 'next/link';
import Badge from '@/components/ui/Badge';

export default function CalendarView() {
  const entries = useJournalStore((s) => s.entries);
  const t = useT();
  const [current, setCurrent] = useState<Date>(() => new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  const entriesByDay = useMemo(() => {
    const map = new Map<string, JournalEntry[]>();
    for (const entry of entries) {
      const key = entry.createdAt.slice(0, 10);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(entry);
    }
    return map;
  }, [entries]);

  const days = useMemo(() => {
    const monthStart = startOfMonth(current);
    const monthEnd = endOfMonth(current);
    const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
    return eachDayOfInterval({ start: gridStart, end: gridEnd });
  }, [current]);

  const selectedEntries = useMemo(() => {
    if (!selectedDay) return [];
    const key = format(selectedDay, 'yyyy-MM-dd');
    return entriesByDay.get(key) ?? [];
  }, [selectedDay, entriesByDay]);

  const handleDayClick = (day: Date) => {
    const key = format(day, 'yyyy-MM-dd');
    if (entriesByDay.has(key)) {
      setSelectedDay((prev) => (prev && isSameDay(prev, day) ? null : day));
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      {/* Month navigator */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-zinc-100">
            {t.calendar.months[current.getMonth()]} {current.getFullYear()}
          </h1>
          <p className="text-sm text-slate-500 dark:text-zinc-500 mt-0.5">
            {t.calendar.hint(entries.length)}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setCurrent(subMonths(current, 1))}
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-500 dark:text-zinc-400 transition-colors"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={() => setCurrent(new Date())}
            className="px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-600 dark:text-zinc-400 transition-colors"
          >
            {t.calendar.today}
          </button>
          <button
            onClick={() => setCurrent(addMonths(current, 1))}
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-500 dark:text-zinc-400 transition-colors"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* Calendar grid */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 overflow-hidden shadow-sm dark:shadow-none">
        {/* Weekday headers */}
        <div className="grid grid-cols-7 border-b border-slate-100 dark:border-zinc-800">
          {t.calendar.weekdays.map((d) => (
            <div key={d} className="py-2.5 text-center text-xs font-semibold text-slate-400 dark:text-zinc-600">
              {d}
            </div>
          ))}
        </div>

        {/* Days */}
        <div className="grid grid-cols-7">
          {days.map((day, i) => {
            const key = format(day, 'yyyy-MM-dd');
            const dayEntries = entriesByDay.get(key) ?? [];
            const hasEntries = dayEntries.length > 0;
            const inMonth = isSameMonth(day, current);
            const today = isToday(day);
            const selected = selectedDay && isSameDay(day, selectedDay);

            const moodColors = dayEntries
              .filter((e) => e.analysis?.mood)
              .map((e) => moodChartColor[e.analysis!.mood]);

            return (
              <div
                key={key}
                onClick={() => handleDayClick(day)}
                className={[
                  'relative min-h-[64px] sm:min-h-[80px] p-1.5 sm:p-2 border-b border-r border-slate-100 dark:border-zinc-800/50',
                  i % 7 === 6 ? 'border-r-0' : '',
                  Math.floor(i / 7) === Math.floor((days.length - 1) / 7) ? 'border-b-0' : '',
                  hasEntries ? 'cursor-pointer hover:bg-indigo-50/50 dark:hover:bg-indigo-900/10' : '',
                  selected ? 'bg-indigo-50 dark:bg-indigo-900/20' : '',
                  'transition-colors duration-100',
                ].join(' ')}
              >
                <span className={[
                  'inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-medium',
                  today ? 'bg-indigo-600 text-white' : '',
                  !today && inMonth ? 'text-slate-700 dark:text-zinc-300' : '',
                  !inMonth ? 'text-slate-300 dark:text-zinc-700' : '',
                ].join(' ')}>
                  {format(day, 'd')}
                </span>

                {hasEntries && (
                  <div className="flex flex-wrap gap-0.5 mt-1">
                    {moodColors.slice(0, 3).map((color, ci) => (
                      <span key={ci} className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ backgroundColor: color }} />
                    ))}
                    {dayEntries.length > 3 && (
                      <span className="text-[9px] text-slate-400 dark:text-zinc-600 leading-none mt-0.5">
                        +{dayEntries.length - 3}
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3">
        {Object.entries(moodConfig).map(([mood, cfg]) => (
          <div key={mood} className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-zinc-500">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: moodChartColor[mood as keyof typeof moodChartColor] }} />
            {cfg.emoji} {t.moods[mood as keyof typeof t.moods] ?? cfg.label}
          </div>
        ))}
      </div>

      {/* Selected day entries */}
      <AnimatePresence>
        {selectedDay && selectedEntries.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            transition={{ duration: 0.2 }}
            className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 overflow-hidden shadow-sm"
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-zinc-800">
              <h3 className="font-semibold text-slate-900 dark:text-zinc-100 text-sm">
                {format(selectedDay, 'd')} {t.calendar.months[selectedDay.getMonth()]} — {t.calendar.dayEntries(selectedEntries.length)}
              </h3>
              <button
                onClick={() => setSelectedDay(null)}
                className="p-1 rounded-md text-slate-400 dark:text-zinc-600 hover:text-slate-700 dark:hover:text-zinc-300 transition-colors"
              >
                <X size={15} />
              </button>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-zinc-800">
              {selectedEntries.map((entry) => {
                const mood = entry.analysis ? moodConfig[entry.analysis.mood] : null;
                return (
                  <Link key={entry.id} href={`/journal/${entry.id}`}
                    className="block px-5 py-4 hover:bg-slate-50 dark:hover:bg-zinc-800/50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          {mood && <span className="text-base">{mood.emoji}</span>}
                          <h4 className="font-medium text-slate-900 dark:text-zinc-100 text-sm truncate">
                            {entry.title || t.calendar.untitled}
                          </h4>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-zinc-500 line-clamp-2 leading-relaxed">
                          {entry.content.slice(0, 150)}
                        </p>
                        {entry.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {entry.tags.slice(0, 3).map((tag) => (
                              <Badge key={tag} variant="tag" className="text-[10px] px-1.5 py-0">#{tag}</Badge>
                            ))}
                          </div>
                        )}
                      </div>
                      {entry.analysis && (
                        <div className="shrink-0">
                          <span className={`text-xs font-semibold ${
                            entry.analysis.stressLevel <= 3 ? 'text-emerald-500' :
                            entry.analysis.stressLevel <= 6 ? 'text-yellow-500' : 'text-red-500'
                          }`}>
                            {t.calendar.stress(entry.analysis.stressLevel)}
                          </span>
                        </div>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
