import type { JournalEntry, SearchResult } from '@/types';
import { extractSnippet } from './utils';

const MOOD_KEYWORDS: Record<string, string[]> = {
  happy:      ['happy', 'joy', 'joyful', 'great', 'wonderful', 'excited', 'good', 'positive'],
  sad:        ['sad', 'unhappy', 'depressed', 'down', 'blue', 'miserable', 'cry', 'crying'],
  anxious:    ['anxious', 'anxiety', 'stress', 'stressed', 'worried', 'nervous', 'panic'],
  neutral:    ['okay', 'fine', 'normal', 'ordinary'],
  motivated:  ['motivated', 'productive', 'focused', 'driven', 'energetic', 'ambitious'],
  frustrated: ['frustrated', 'angry', 'annoyed', 'irritated', 'upset'],
  grateful:   ['grateful', 'thankful', 'blessed', 'appreciate', 'gratitude'],
  excited:    ['excited', 'thrilled', 'enthusiastic', 'pumped', 'eager'],
};

const TIME_KEYWORDS: Record<string, number> = {
  today: 0,
  yesterday: 1,
  'last week': 7,
  'last month': 30,
  'this week': 7,
  'this month': 30,
};

function scoreEntry(entry: JournalEntry, terms: string[]): number {
  const text = `${entry.title} ${entry.content} ${entry.tags.join(' ')}`.toLowerCase();
  const analysisMood = entry.analysis?.mood?.toLowerCase() ?? '';
  const analysisTopics = entry.analysis?.keyTopics?.join(' ').toLowerCase() ?? '';
  const fullText = `${text} ${analysisMood} ${analysisTopics}`;

  let score = 0;
  for (const term of terms) {
    if (fullText.includes(term)) score += 2;
    // Check mood aliases
    for (const [mood, aliases] of Object.entries(MOOD_KEYWORDS)) {
      if (aliases.includes(term) && (analysisMood === mood || fullText.includes(term))) {
        score += 3;
      }
    }
  }
  return score;
}

function filterByTime(entries: JournalEntry[], query: string): JournalEntry[] {
  const lower = query.toLowerCase();
  for (const [keyword, days] of Object.entries(TIME_KEYWORDS)) {
    if (lower.includes(keyword)) {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - days);
      return entries.filter((e) => new Date(e.createdAt) >= cutoff);
    }
  }
  return entries;
}

export function localSearch(entries: JournalEntry[], query: string): SearchResult[] {
  if (!query.trim()) return [];

  const timeFiltered = filterByTime(entries, query);
  const terms = query
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter((t) => t.length > 2);

  const scored = timeFiltered
    .map((entry) => ({ entry, score: scoreEntry(entry, terms) }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score);

  return scored.map(({ entry, score }) => ({
    entry,
    relevance: Math.min(score / 10, 1),
    snippet: extractSnippet(entry.content, terms[0] ?? query.slice(0, 20)),
  }));
}
