import type { AIAnalysis, JournalEntry, SearchResult, WeeklySummary } from '@/types';

export async function analyzeEntry(
  entry: Pick<JournalEntry, 'title' | 'content'>,
  lang: string
): Promise<AIAnalysis> {
  const res = await fetch('/api/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...entry, lang }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? 'Analysis failed');
  }
  const { analysis } = await res.json();
  return analysis as AIAnalysis;
}

export async function semanticSearch(
  query: string,
  entries: JournalEntry[]
): Promise<SearchResult[]> {
  const res = await fetch('/api/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, entries }),
  });
  if (!res.ok) throw new Error('Search failed');
  const { results } = await res.json();
  return results as SearchResult[];
}

export async function generateWeeklySummary(
  entries: JournalEntry[],
  lang: string
): Promise<WeeklySummary> {
  const res = await fetch('/api/summary', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ entries, lang }),
  });
  if (!res.ok) throw new Error('Summary generation failed');
  const { summary } = await res.json();
  return summary as WeeklySummary;
}
