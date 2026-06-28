import { format, formatDistanceToNow, parseISO } from 'date-fns';
import type { Mood } from '@/types';

export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

export function formatDate(isoString: string): string {
  return format(parseISO(isoString), 'MMM d, yyyy');
}

export function formatDateLong(isoString: string): string {
  return format(parseISO(isoString), 'EEEE, MMMM d, yyyy • h:mm a');
}

export function formatRelative(isoString: string): string {
  return formatDistanceToNow(parseISO(isoString), { addSuffix: true });
}

export function formatWeekStart(isoString: string): string {
  return format(parseISO(isoString), 'MMM d');
}

export const moodConfig: Record<Mood, { emoji: string; label: string; color: string; bg: string }> = {
  happy:      { emoji: '😊', label: 'Happy',      color: 'text-yellow-400', bg: 'bg-yellow-400/10' },
  sad:        { emoji: '😢', label: 'Sad',         color: 'text-blue-400',   bg: 'bg-blue-400/10'   },
  anxious:    { emoji: '😰', label: 'Anxious',     color: 'text-orange-400', bg: 'bg-orange-400/10' },
  neutral:    { emoji: '😐', label: 'Neutral',     color: 'text-zinc-400',   bg: 'bg-zinc-400/10'   },
  motivated:  { emoji: '🔥', label: 'Motivated',   color: 'text-rose-400',   bg: 'bg-rose-400/10'   },
  frustrated: { emoji: '😤', label: 'Frustrated',  color: 'text-red-400',    bg: 'bg-red-400/10'    },
  grateful:   { emoji: '🙏', label: 'Grateful',    color: 'text-emerald-400',bg: 'bg-emerald-400/10'},
  excited:    { emoji: '🚀', label: 'Excited',     color: 'text-purple-400', bg: 'bg-purple-400/10' },
};

export const moodChartColor: Record<Mood, string> = {
  happy:      '#facc15',
  sad:        '#60a5fa',
  anxious:    '#fb923c',
  neutral:    '#a1a1aa',
  motivated:  '#fb7185',
  frustrated: '#f87171',
  grateful:   '#34d399',
  excited:    '#c084fc',
};

export function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return text.slice(0, max).trimEnd() + '…';
}

export function extractSnippet(content: string, query: string): string {
  const lower = content.toLowerCase();
  const idx = lower.indexOf(query.toLowerCase());
  if (idx === -1) return truncate(content, 120);
  const start = Math.max(0, idx - 40);
  const end = Math.min(content.length, idx + 80);
  return (start > 0 ? '…' : '') + content.slice(start, end) + (end < content.length ? '…' : '');
}

export function generateId(): string {
  return crypto.randomUUID();
}
