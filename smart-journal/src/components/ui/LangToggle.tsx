'use client';

import { motion } from 'framer-motion';
import type { Lang } from '@/lib/i18n';
import { useLangStore } from '@/store/langStore';

const LANGS: { code: Lang; flag: string; label: string }[] = [
  { code: 'uk', flag: '🇺🇦', label: 'UA' },
  { code: 'en', flag: '🇬🇧', label: 'EN' },
  { code: 'pl', flag: '🇵🇱', label: 'PL' },
];

interface Props {
  variant?: 'compact' | 'full';
}

export default function LangToggle({ variant = 'compact' }: Props) {
  const { lang, setLang } = useLangStore();

  if (variant === 'full') {
    return (
      <div className="flex flex-col gap-1">
        {LANGS.map(({ code, flag, label }) => {
          const active = lang === code;
          return (
            <button
              key={code}
              onClick={() => setLang(code)}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 w-full text-left
                ${active
                  ? 'bg-indigo-50 dark:bg-indigo-600/20 text-indigo-600 dark:text-indigo-300'
                  : 'text-slate-700 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800/50'
                }`}
            >
              <span className="text-base">{flag}</span>
              <span>{label}</span>
              {active && (
                <motion.span
                  layoutId="lang-check"
                  className="ml-auto text-indigo-500 dark:text-indigo-400 text-xs font-bold"
                >
                  ✓
                </motion.span>
              )}
            </button>
          );
        })}
      </div>
    );
  }

  // Compact: horizontal pill row (for mobile header)
  return (
    <div className="flex items-center gap-1 bg-slate-100 dark:bg-zinc-800 rounded-lg p-0.5">
      {LANGS.map(({ code, flag, label }) => {
        const active = lang === code;
        return (
          <button
            key={code}
            onClick={() => setLang(code)}
            title={label}
            className={`relative flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-all duration-150
              ${active
                ? 'text-slate-900 dark:text-zinc-100'
                : 'text-slate-400 dark:text-zinc-500 hover:text-slate-700 dark:hover:text-zinc-300'
              }`}
          >
            {active && (
              <motion.div
                layoutId="lang-pill"
                className="absolute inset-0 bg-white dark:bg-zinc-700 rounded-md shadow-sm"
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              />
            )}
            <span className="relative z-10">{flag}</span>
            <span className="relative z-10 hidden sm:inline">{label}</span>
          </button>
        );
      })}
    </div>
  );
}
