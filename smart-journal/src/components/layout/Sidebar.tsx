'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { BookOpen, LayoutDashboard, PenSquare, Tag } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useJournalStore } from '@/store/journalStore';

const NAV = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/journal', label: 'Journal', icon: BookOpen },
  { href: '/journal/new', label: 'New Entry', icon: PenSquare },
];

export default function Sidebar() {
  const pathname = usePathname();
  // Select stable primitive — derive tags locally so Zustand never returns new array references
  const entries = useJournalStore((s) => s.entries);
  const tags = useMemo(() => {
    const set = new Set<string>();
    for (const e of entries) for (const t of e.tags) set.add(t);
    return Array.from(set).sort();
  }, [entries]);
  const activeTag = useJournalStore((s) => s.activeTag);
  const setActiveTag = useJournalStore((s) => s.setActiveTag);

  return (
    <aside className="hidden lg:flex flex-col w-60 min-h-screen bg-zinc-950 border-r border-zinc-800 px-3 py-6 gap-6 shrink-0">
      {/* Logo */}
      <div className="px-3 flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center">
          <BookOpen size={14} className="text-white" />
        </div>
        <span className="font-semibold text-zinc-100 text-sm tracking-wide">Smart Journal</span>
      </div>

      {/* Nav */}
      <nav className="flex flex-col gap-0.5">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = href === '/' ? pathname === '/' : pathname.startsWith(href) && href !== '/journal/new'
            ? pathname === '/journal' || pathname.startsWith('/journal/')
            : pathname === href;
          const isActive = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'group relative flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-zinc-800 text-zinc-100'
                  : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50'
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="sidebar-indicator"
                  className="absolute inset-0 bg-zinc-800 rounded-lg"
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
          <p className="px-3 text-xs font-semibold text-zinc-600 uppercase tracking-wider flex items-center gap-2">
            <Tag size={11} /> Tags
          </p>
          <div className="flex flex-col gap-0.5">
            <button
              onClick={() => setActiveTag(null)}
              className={cn(
                'flex items-center gap-2 px-3 py-1.5 rounded-md text-xs transition-colors text-left',
                activeTag === null ? 'bg-indigo-600/20 text-indigo-300' : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50'
              )}
            >
              All entries
            </button>
            {tags.map((tag) => (
              <button
                key={tag}
                onClick={() => setActiveTag(activeTag === tag ? null : tag)}
                className={cn(
                  'flex items-center gap-2 px-3 py-1.5 rounded-md text-xs transition-colors text-left',
                  activeTag === tag ? 'bg-indigo-600/20 text-indigo-300' : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50'
                )}
              >
                # {tag}
              </button>
            ))}
          </div>
        </div>
      )}
    </aside>
  );
}
