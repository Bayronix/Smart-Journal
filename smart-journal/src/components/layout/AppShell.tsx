'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BookOpen, LayoutDashboard, PenSquare, CalendarDays, MessageCircle } from 'lucide-react';
import Sidebar from './Sidebar';
import Background from '@/components/ui/Background';
import { useJournalStore } from '@/store/journalStore';
import { useThemeStore } from '@/store/themeStore';
import { useLangStore, useT } from '@/store/langStore';
import ThemeToggle from '@/components/ui/ThemeToggle';
import LangToggle from '@/components/ui/LangToggle';
import { cn } from '@/lib/utils';
import type { Lang } from '@/lib/i18n';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const hydrate = useJournalStore((s) => s.hydrate);
  const { setTheme } = useThemeStore();
  const { setLang } = useLangStore();
  const t = useT();
  const pathname = usePathname();

  useEffect(() => {
    hydrate();
    const savedTheme = localStorage.getItem('sj_theme') as 'dark' | 'light' | null;
    setTheme(savedTheme === 'light' ? 'light' : 'dark');
    const savedLang = localStorage.getItem('sj_lang') as Lang | null;
    if (savedLang && ['en', 'uk', 'pl'].includes(savedLang)) setLang(savedLang);
  }, [hydrate, setTheme, setLang]);

  const MOBILE_NAV = [
    { href: '/', label: t.nav.dashboard, icon: LayoutDashboard },
    { href: '/journal', label: t.nav.journal, icon: BookOpen },
    { href: '/calendar', label: t.nav.calendar, icon: CalendarDays },
    { href: '/chat', label: t.nav.chat, icon: MessageCircle },
    { href: '/journal/new', label: t.nav.newEntry, icon: PenSquare },
  ];

  return (
    <>
      {/* Animated water background — fixed, behind everything */}
      <Background />

      <div className="flex min-h-screen">
        <Sidebar />

        <div className="flex-1 flex flex-col min-w-0">
          {/* Mobile top bar */}
          <header className="lg:hidden flex items-center gap-2 px-3 py-2.5 border-b border-white/20 dark:border-white/10 bg-white/60 dark:bg-black/40 backdrop-blur-xl sticky top-0 z-40">
            <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center shrink-0">
              <BookOpen size={14} className="text-white" />
            </div>
            <span className="font-semibold text-slate-900 dark:text-zinc-100 text-sm flex-1">{t.appName}</span>
            <LangToggle variant="compact" />
            <ThemeToggle />
          </header>

          <main className="flex-1 overflow-auto">
            {children}
          </main>

          {/* Mobile bottom nav */}
          <nav className="lg:hidden flex border-t border-white/20 dark:border-white/10 bg-white/60 dark:bg-black/40 backdrop-blur-xl">
            {MOBILE_NAV.map(({ href, label, icon: Icon }) => {
              const isActive = pathname === href;
              return (
                <Link key={href} href={href}
                  className={cn(
                    'flex-1 flex flex-col items-center gap-1 py-3 text-xs font-medium transition-colors',
                    isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-zinc-400'
                  )}
                >
                  <Icon size={18} />
                  {label}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </>
  );
}
