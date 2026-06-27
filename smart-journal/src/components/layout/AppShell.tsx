'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BookOpen, LayoutDashboard, PenSquare } from 'lucide-react';
import Sidebar from './Sidebar';
import { useJournalStore } from '@/store/journalStore';
import { useThemeStore } from '@/store/themeStore';
import ThemeToggle from '@/components/ui/ThemeToggle';
import { cn } from '@/lib/utils';

const MOBILE_NAV = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/journal', label: 'Journal', icon: BookOpen },
  { href: '/journal/new', label: 'New', icon: PenSquare },
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const hydrate = useJournalStore((s) => s.hydrate);
  const { setTheme } = useThemeStore();
  const pathname = usePathname();

  useEffect(() => {
    hydrate();
    const saved = localStorage.getItem('sj_theme') as 'dark' | 'light' | null;
    setTheme(saved === 'light' ? 'light' : 'dark');
  }, [hydrate, setTheme]);

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-zinc-950 transition-colors duration-200">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile top bar */}
        <header className="lg:hidden flex items-center gap-3 px-4 py-3 border-b border-slate-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur sticky top-0 z-40 transition-colors duration-200">
          <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center shrink-0">
            <BookOpen size={14} className="text-white" />
          </div>
          <span className="font-semibold text-slate-900 dark:text-zinc-100 text-sm flex-1">Smart Journal</span>
          <ThemeToggle />
        </header>

        <main className="flex-1 overflow-auto">
          {children}
        </main>

        {/* Mobile bottom nav */}
        <nav className="lg:hidden flex border-t border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 transition-colors duration-200">
          {MOBILE_NAV.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href;
            return (
              <Link key={href} href={href}
                className={cn(
                  'flex-1 flex flex-col items-center gap-1 py-3 text-xs font-medium transition-colors',
                  isActive ? 'text-indigo-500 dark:text-indigo-400' : 'text-slate-600 dark:text-zinc-200'
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
  );
}
