import type { JournalEntry, SearchResult } from '@/types';
import { extractSnippet } from './utils';

// Multilingual mood keyword map — EN + UA + PL
const MOOD_KEYWORDS: Record<string, string[]> = {
  happy: [
    'happy', 'joy', 'joyful', 'great', 'wonderful', 'excited', 'good', 'positive', 'smile',
    'радість', 'щасливий', 'щастя', 'радий', 'відмінно', 'чудово', 'весело', 'позитив', 'класно',
    'szczęśliwy', 'radość', 'wspaniale', 'świetnie', 'wesoło', 'pozytywnie', 'cudownie',
  ],
  sad: [
    'sad', 'unhappy', 'depressed', 'down', 'miserable', 'cry', 'crying', 'lonely', 'grief',
    'сумно', 'сум', 'сумний', 'плачу', 'горе', 'смуток', 'пригнічений', 'самотній', 'журба',
    'smutny', 'smutek', 'płaczę', 'przygnębiony', 'nieszczęśliwy', 'samotny', 'żal',
  ],
  anxious: [
    'anxious', 'anxiety', 'stress', 'stressed', 'worried', 'nervous', 'panic', 'fear', 'overwhelm',
    'тривога', 'тривожно', 'стрес', 'хвилююся', 'нервую', 'переживаю', 'паніка', 'страх', 'боюся',
    'stres', 'niepokój', 'martwię', 'nerwowy', 'panika', 'strach', 'boję', 'zaniepokojony',
  ],
  motivated: [
    'motivated', 'productive', 'focused', 'driven', 'energetic', 'ambitious', 'goal', 'achieve',
    'мотивація', 'мотивований', 'продуктивно', 'натхнення', 'цілеспрямований', 'ціль', 'досягнення',
    'zmotywowany', 'produktywny', 'skupiony', 'ambitny', 'cel', 'osiągnięcie',
  ],
  frustrated: [
    'frustrated', 'angry', 'annoyed', 'irritated', 'upset', 'mad', 'hate', 'fail',
    'злий', 'злість', 'роздратований', 'розчарований', 'бісить', 'дратує', 'злюся', 'ненавиджу',
    'sfrustrowany', 'zły', 'zirytowany', 'rozczarowany', 'wściekły', 'nienawidzę',
  ],
  grateful: [
    'grateful', 'thankful', 'blessed', 'appreciate', 'gratitude', 'lucky', 'fortunate',
    'вдячний', 'дякую', 'вдячність', 'ціную', 'пощастило',
    'wdzięczny', 'dziękuję', 'wdzięczność', 'doceniam', 'cenię',
  ],
  excited: [
    'excited', 'thrilled', 'enthusiastic', 'pumped', 'eager', 'amazing', 'incredible',
    'захоплений', 'захоплення', 'неймовірно', 'в захваті', 'очікую',
    'podekscytowany', 'entuzjastyczny', 'niecierpliwie', 'zachwycony',
  ],
  neutral: [
    'okay', 'fine', 'normal', 'ordinary', 'alright',
    'нормально', 'звичайно', 'ок', 'нейтрально', 'буденно',
    'normalnie', 'zwyczajnie', 'w porządku', 'neutralnie',
  ],
};

// Multilingual time keywords — mapped to days in the past
const TIME_KEYWORDS: Array<[string, number]> = [
  // EN
  ['today', 0],
  ['yesterday', 1],
  ['last week', 7],
  ['this week', 7],
  ['last month', 30],
  ['this month', 30],
  ['past week', 7],
  ['past month', 30],
  // UA
  ['сьогодні', 0],
  ['вчора', 1],
  ['минулого тижня', 7],
  ['цього тижня', 7],
  ['минулого місяця', 30],
  ['цього місяця', 30],
  ['за тиждень', 7],
  ['за місяць', 30],
  ['на цьому тижні', 7],
  // PL
  ['dzisiaj', 0],
  ['wczoraj', 1],
  ['w zeszłym tygodniu', 7],
  ['w tym tygodniu', 7],
  ['w zeszłym miesiącu', 30],
  ['w tym miesiącu', 30],
  ['ostatni tydzień', 7],
  ['ostatni miesiąc', 30],
];

function filterByTime(entries: JournalEntry[], query: string): JournalEntry[] {
  const lower = query.toLowerCase();
  // Longer phrases first so "last month" wins over "last"
  for (const [keyword, days] of TIME_KEYWORDS) {
    if (lower.includes(keyword)) {
      if (days === 0) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return entries.filter((e) => new Date(e.createdAt) >= today);
      }
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - days);
      return entries.filter((e) => new Date(e.createdAt) >= cutoff);
    }
  }
  return entries;
}

function scoreEntry(entry: JournalEntry, terms: string[]): number {
  const titleLower   = (entry.title   ?? '').toLowerCase();
  const contentLower = (entry.content ?? '').toLowerCase();
  const tagsLower    = entry.tags.join(' ').toLowerCase();
  const moodLower    = entry.analysis?.mood ?? '';
  const topicsLower  = (entry.analysis?.keyTopics ?? []).join(' ').toLowerCase();

  let score = 0;

  for (const term of terms) {
    // Title match — highest weight (exact substring)
    if (titleLower.includes(term)) score += 5;

    // Content match
    const contentMatches = (contentLower.match(new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) ?? []).length;
    score += contentMatches * 2;

    // Tags match
    if (tagsLower.includes(term)) score += 3;

    // Mood & AI topics match
    if (moodLower === term || topicsLower.includes(term)) score += 3;

    // Mood alias — user writes "stress" → matches entries with anxious mood
    for (const [mood, aliases] of Object.entries(MOOD_KEYWORDS)) {
      if (aliases.some((a) => a === term || a.startsWith(term)) && moodLower === mood) {
        score += 4;
      }
    }
  }

  return score;
}

export function localSearch(entries: JournalEntry[], query: string): SearchResult[] {
  if (!query.trim()) return [];

  const timeFiltered = filterByTime(entries, query);

  // Tokenize — keep short words (≥2 chars for Cyrillic/Latin) but drop stopwords
  const STOPWORDS = new Set(['the', 'and', 'or', 'is', 'in', 'at', 'on', 'a', 'an',
    'та', 'або', 'і', 'в', 'на', 'до', 'по', 'за', 'як',
    'i', 'w', 'na', 'do', 'po', 'jak', 'że', 'się',
  ]);

  const terms = query
    .toLowerCase()
    .split(/[\s,;]+/)
    .map((t) => t.replace(/[^\wа-яёієїьАЯЁІЄЇЬąćęłńóśźżĄĆĘŁŃÓŚŹŻ'-]/g, ''))
    .filter((t) => t.length >= 2 && !STOPWORDS.has(t));

  if (terms.length === 0) return [];

  const scored = timeFiltered
    .map((entry) => ({ entry, score: scoreEntry(entry, terms) }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score);

  const maxScore = scored[0]?.score ?? 1;

  return scored.slice(0, 10).map(({ entry, score }) => ({
    entry,
    relevance: Math.min(score / maxScore, 1),
    snippet: extractSnippet(entry.content, terms[0] ?? query.slice(0, 20)),
  }));
}
