export type Mood =
  | 'happy'
  | 'sad'
  | 'anxious'
  | 'neutral'
  | 'motivated'
  | 'frustrated'
  | 'grateful'
  | 'excited';

export interface AIAnalysis {
  mood: Mood;
  stressLevel: number;
  keyTopics: string[];
  insights: string;
  advice: string;
  analyzedAt: string;
}

export interface JournalEntry {
  id: string;
  title: string;
  content: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  analysis?: AIAnalysis;
}

export interface WeeklySummary {
  weekStart: string;
  summary: string;
  dominantMood: Mood;
  avgStressLevel: number;
  topTopics: string[];
  generatedAt: string;
  lang?: string;
}

export interface SearchResult {
  entry: JournalEntry;
  relevance: number;
  snippet: string;
}

export interface MoodDataPoint {
  date: string;
  mood: Mood;
  stressLevel: number;
  label: string;
}
