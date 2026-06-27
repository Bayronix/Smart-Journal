'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BookOpen, LayoutDashboard, PenSquare } from 'lucide-react';
import Sidebar from './Sidebar';
import { useJournalStore } from '@/store/journalStore';
import { cn } from '@/lib/utils';

const MOBILE_NAV = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/journal', label: 'Journal', icon: BookOpen },
  { href: '/journal/new', label: 'New', icon: PenSquare },
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const hydrate = useJournalStore((s) => s.hydrate);
  const pathname = usePathname();

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  return (
    <div className="flex min-h-screen bg-zinc-950">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile top bar */}
        <header className="lg:hidden flex items-center gap-3 px-4 py-3 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur sticky top-0 z-40">
          <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center shrink-0">
            <BookOpen size={14} className="text-white" />
          </div>
          <span className="font-semibold text-zinc-100 text-sm flex-1">Smart Journal</span>
        </header>

        {/* Main content */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>

        {/* Mobile bottom nav */}
        <nav className="lg:hidden flex border-t border-zinc-800 bg-zinc-950">
          {MOBILE_NAV.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex-1 flex flex-col items-center gap-1 py-3 text-xs font-medium transition-colors',
                  isActive ? 'text-indigo-400' : 'text-zinc-500'
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
