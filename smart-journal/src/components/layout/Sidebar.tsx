'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { BookOpen, LayoutDashboard, PenSquare, Tag, CalendarDays, MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useJournalStore } from '@/store/journalStore';
import { useT } from '@/store/langStore';
import ThemeToggle from '@/components/ui/ThemeToggle';
import LangToggle from '@/components/ui/LangToggle';

export default function Sidebar() {
  const pathname = usePathname();
  const t = useT();

  const entries = useJournalStore((s) => s.entries);
  const tags = useMemo(() => {
    const set = new Set<string>();
    for (const e of entries) for (const tag of e.tags) set.add(tag);
    return Array.from(set).sort();
  }, [entries]);
  const activeTag = useJournalStore((s) => s.activeTag);
  const setActiveTag = useJournalStore((s) => s.setActiveTag);

  const NAV = [
    { href: '/', label: t.nav.dashboard, icon: LayoutDashboard },
    { href: '/journal', label: t.nav.journal, icon: BookOpen },
    { href: '/calendar', label: t.nav.calendar, icon: CalendarDays },
    { href: '/chat', label: t.nav.chat, icon: MessageCircle },
    { href: '/journal/new', label: t.nav.newEntry, icon: PenSquare },
  ];

  return (
    <aside className="hidden lg:flex flex-col w-60 min-h-screen bg-white dark:bg-zinc-950 border-r border-slate-200 dark:border-zinc-800 px-3 py-6 gap-5 shrink-0 transition-colors duration-200">
      {/* Logo */}
      <div className="px-3 flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center">
          <BookOpen size={14} className="text-white" />
        </div>
        <span className="font-semibold text-slate-900 dark:text-zinc-100 text-sm tracking-wide">{t.appName}</span>
      </div>

      {/* Nav */}
      <nav className="flex flex-col gap-0.5">
        {NAV.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href;
          return (
            <Link key={href} href={href}
              className={cn(
                'group relative flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-slate-100 dark:bg-zinc-800 text-slate-900 dark:text-zinc-100'
                  : 'text-slate-700 dark:text-zinc-200 hover:text-slate-900 dark:hover:text-zinc-100 hover:bg-slate-100 dark:hover:bg-zinc-800/50'
              )}
            >
              {isActive && (
                <motion.div layoutId="sidebar-indicator"
                  className="absolute inset-0 bg-slate-100 dark:bg-zinc-800 rounded-lg"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              <Icon size={16} className="relative z-10 shrink-0" />
              <span className="relative z-10">{label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Tags */}
      {tags.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <p className="px-3 text-xs font-semibold text-slate-600 dark:text-zinc-400 uppercase tracking-wider flex items-center gap-2">
            <Tag size={11} /> {t.nav.tags}
          </p>
          <div className="flex flex-col gap-0.5">
            <button onClick={() => setActiveTag(null)}
              className={cn(
                'flex items-center gap-2 px-3 py-1.5 rounded-md text-xs transition-colors text-left',
                activeTag === null
                  ? 'bg-indigo-50 dark:bg-indigo-600/20 text-indigo-600 dark:text-indigo-300'
                  : 'text-slate-700 dark:text-zinc-200 hover:text-slate-900 dark:hover:text-zinc-100 hover:bg-slate-100 dark:hover:bg-zinc-800/50'
              )}
            >{t.nav.allEntries}</button>
            {tags.map((tag) => (
              <button key={tag} onClick={() => setActiveTag(activeTag === tag ? null : tag)}
                className={cn(
                  'flex items-center gap-2 px-3 py-1.5 rounded-md text-xs transition-colors text-left',
                  activeTag === tag
                    ? 'bg-indigo-50 dark:bg-indigo-600/20 text-indigo-600 dark:text-indigo-300'
                    : 'text-slate-700 dark:text-zinc-200 hover:text-slate-900 dark:hover:text-zinc-100 hover:bg-slate-100 dark:hover:bg-zinc-800/50'
                )}
              ># {tag}</button>
            ))}
          </div>
        </div>
      )}

      {/* Bottom controls */}
      <div className="mt-auto flex flex-col gap-2 px-3">
        {/* Language */}
        <div className="flex flex-col gap-1">
          <p className="text-xs font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider px-0.5">
            Language
          </p>
          <LangToggle variant="full" />
        </div>

        {/* Theme */}
        <ThemeToggle variant="full" />
      </div>
    </aside>
  );
}
