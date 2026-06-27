'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Sun, Moon } from 'lucide-react';
import { useThemeStore } from '@/store/themeStore';

interface Props {
  /** compact = small pill (mobile header), full = wide button (sidebar) */
  variant?: 'compact' | 'full';
  className?: string;
}

export default function ThemeToggle({ variant = 'compact', className }: Props) {
  const { theme, toggle } = useThemeStore();
  const isDark = theme === 'dark';

  if (variant === 'full') {
    return (
      <button
        onClick={toggle}
        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
          bg-slate-100 dark:bg-zinc-800/80
          hover:bg-slate-200 dark:hover:bg-zinc-700
          text-slate-700 dark:text-zinc-200
          border border-slate-200 dark:border-zinc-700
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500
          ${className ?? ''}`}
      >
        {/* Animated icon */}
        <div className="w-8 h-8 rounded-lg bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 flex items-center justify-center shadow-sm shrink-0">
          <AnimatePresence mode="wait" initial={false}>
            {isDark ? (
              <motion.div key="moon"
                initial={{ opacity: 0, rotate: -30, scale: 0.7 }}
                animate={{ opacity: 1, rotate: 0, scale: 1 }}
                exit={{ opacity: 0, rotate: 30, scale: 0.7 }}
                transition={{ duration: 0.18 }}
              >
                <Moon size={16} className="text-indigo-400" />
              </motion.div>
            ) : (
              <motion.div key="sun"
                initial={{ opacity: 0, rotate: 30, scale: 0.7 }}
                animate={{ opacity: 1, rotate: 0, scale: 1 }}
                exit={{ opacity: 0, rotate: -30, scale: 0.7 }}
                transition={{ duration: 0.18 }}
              >
                <Sun size={16} className="text-amber-500" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <span>{isDark ? 'Dark mode' : 'Light mode'}</span>

        {/* Mini toggle pill */}
        <div className={`ml-auto w-10 h-5 rounded-full relative transition-colors duration-300 ${isDark ? 'bg-indigo-600' : 'bg-slate-300'}`}>
          <motion.div
            animate={{ x: isDark ? 21 : 2 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm"
          />
        </div>
      </button>
    );
  }

  // Compact variant (mobile header)
  return (
    <button
      onClick={toggle}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className={`relative w-14 h-7 rounded-full transition-colors duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
        isDark ? 'bg-zinc-700' : 'bg-indigo-100'
      } ${className ?? ''}`}
    >
      <motion.div
        animate={{ x: isDark ? 2 : 30 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        className={`absolute top-1 w-5 h-5 rounded-full flex items-center justify-center shadow-sm ${isDark ? 'bg-zinc-900' : 'bg-white'}`}
      >
        <AnimatePresence mode="wait" initial={false}>
          {isDark ? (
            <motion.div key="moon"
              initial={{ opacity: 0, rotate: -90, scale: 0.5 }}
              animate={{ opacity: 1, rotate: 0, scale: 1 }}
              exit={{ opacity: 0, rotate: 90, scale: 0.5 }}
              transition={{ duration: 0.15 }}
            >
              <Moon size={11} className="text-indigo-300" />
            </motion.div>
          ) : (
            <motion.div key="sun"
              initial={{ opacity: 0, rotate: 90, scale: 0.5 }}
              animate={{ opacity: 1, rotate: 0, scale: 1 }}
              exit={{ opacity: 0, rotate: -90, scale: 0.5 }}
              transition={{ duration: 0.15 }}
            >
              <Sun size={11} className="text-amber-500" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </button>
  );
}
