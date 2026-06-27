'use client';

import { cn } from '@/lib/utils';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'tag' | 'mood';
  color?: string;
  className?: string;
  onClick?: () => void;
}

export default function Badge({ children, variant = 'default', color, className, onClick }: BadgeProps) {
  const base = 'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors';

  const variants = {
    default: 'bg-zinc-800 text-zinc-300',
    tag: 'bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 hover:bg-indigo-500/20',
    mood: color ?? 'bg-zinc-800 text-zinc-300',
  };

  return (
    <span
      onClick={onClick}
      className={cn(base, variant !== 'mood' ? variants[variant] : '', color, onClick && 'cursor-pointer', className)}
    >
      {children}
    </span>
  );
}
