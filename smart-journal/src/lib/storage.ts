import type { JournalEntry, WeeklySummary } from '@/types';

const ENTRIES_KEY = 'sj_entries';
const SUMMARY_KEY = 'sj_weekly_summary';

export function loadEntries(): JournalEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(ENTRIES_KEY);
    return raw ? (JSON.parse(raw) as JournalEntry[]) : [];
  } catch {
    return [];
  }
}

export function saveEntries(entries: JournalEntry[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(ENTRIES_KEY, JSON.stringify(entries));
}

export function loadWeeklySummary(): WeeklySummary | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(SUMMARY_KEY);
    return raw ? (JSON.parse(raw) as WeeklySummary) : null;
  } catch {
    return null;
  }
}

export function saveWeeklySummary(summary: WeeklySummary): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(SUMMARY_KEY, JSON.stringify(summary));
}
