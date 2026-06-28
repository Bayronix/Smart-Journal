'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { PenSquare } from 'lucide-react';
import Link from 'next/link';
import { useLangStore } from '@/store/langStore';

const GREET = {
  morning:   { uk: 'Доброго ранку',  en: 'Good morning',   pl: 'Dzień dobry',      emoji: '🌅' },
  afternoon: { uk: 'Добрий день',    en: 'Good afternoon', pl: 'Miłego dnia',      emoji: '☀️' },
  evening:   { uk: 'Добрий вечір',   en: 'Good evening',   pl: 'Dobry wieczór',    emoji: '🌆' },
  night:     { uk: 'Добраніч',       en: 'Good night',     pl: 'Dobranoc',         emoji: '🌙' },
} as const;

function period(h: number): keyof typeof GREET {
  if (h >= 5  && h < 12) return 'morning';
  if (h >= 12 && h < 18) return 'afternoon';
  if (h >= 18 && h < 23) return 'evening';
  return 'night';
}

export default function DashboardHero() {
  const lang   = useLangStore((s) => s.lang);
  const [now, setNow] = useState<Date>(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  const l = lang === 'uk' ? 'uk' : lang as 'en' | 'pl';
  const p = period(now?.getHours() ?? 10);
  const g = GREET[p];

  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex items-center justify-between gap-4 py-1"
    >
      <div>
        <div className="flex items-center gap-2">
          <span className="text-xl">{g.emoji}</span>
          <h1 className="text-lg font-bold text-slate-900 dark:text-zinc-100">
            {g[l]}!
          </h1>
        </div>
        <p className="text-sm text-slate-400 dark:text-zinc-600 mt-0.5 ml-0.5">
          {format(now, 'd MMMM yyyy')}
        </p>
      </div>

      <Link
        href="/journal/new"
        className="shrink-0 inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-4 py-2.5 rounded-xl transition-colors shadow-sm shadow-indigo-500/20"
      >
        <PenSquare size={15} />
        {lang === 'en' ? 'New Entry' : lang === 'pl' ? 'Nowy wpis' : 'Новий запис'}
      </Link>
    </motion.div>
  );
}
