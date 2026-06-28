'use client';

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type { JournalEntry, WeeklySummary, AIAnalysis } from '@/types';
import { loadEntries, saveEntries, loadWeeklySummary, saveWeeklySummary } from '@/lib/storage';
import { generateId } from '@/lib/utils';

interface JournalState {
  entries: JournalEntry[];
  weeklySummary: WeeklySummary | null;
  searchQuery: string;
  activeTag: string | null;
  hydrated: boolean;

  hydrate: () => void;
  addEntry: (data: Pick<JournalEntry, 'title' | 'content' | 'tags'>) => JournalEntry;
  updateEntry: (id: string, data: Partial<Pick<JournalEntry, 'title' | 'content' | 'tags'>>) => void;
  deleteEntry: (id: string) => void;
  setAnalysis: (id: string, analysis: AIAnalysis) => void;
  setWeeklySummary: (summary: WeeklySummary) => void;
  setSearchQuery: (q: string) => void;
  setActiveTag: (tag: string | null) => void;
  getAllTags: () => string[];
  getEntry: (id: string) => JournalEntry | undefined;
}

export const useJournalStore = create<JournalState>()(
  subscribeWithSelector((set, get) => ({
    entries: [],
    weeklySummary: null,
    searchQuery: '',
    activeTag: null,
    hydrated: false,

    hydrate() {
      if (get().hydrated) return;
      const entries = loadEntries();
      const weeklySummary = loadWeeklySummary();
      set({ entries, weeklySummary, hydrated: true });
    },

    addEntry({ title, content, tags }) {
      const now = new Date().toISOString();
      const entry: JournalEntry = {
        id: generateId(),
        title,
        content,
        tags,
        createdAt: now,
        updatedAt: now,
      };
      const entries = [entry, ...get().entries];
      saveEntries(entries);
      set({ entries });
      return entry;
    },

    updateEntry(id, data) {
      const entries = get().entries.map((e) => {
        if (e.id !== id) return e;
        // createdAt is explicitly kept from e — data cannot override it
        const { createdAt, ...rest } = e;
        return { createdAt, ...rest, ...data, updatedAt: new Date().toISOString() };
      });
      saveEntries(entries);
      set({ entries });
    },

    deleteEntry(id) {
      const entries = get().entries.filter((e) => e.id !== id);
      saveEntries(entries);
      set({ entries });
    },

    setAnalysis(id, analysis) {
      const entries = get().entries.map((e) =>
        e.id === id ? { ...e, analysis, updatedAt: new Date().toISOString() } : e
      );
      saveEntries(entries);
      set({ entries });
    },

    setWeeklySummary(summary) {
      saveWeeklySummary(summary);
      set({ weeklySummary: summary });
    },

    setSearchQuery(searchQuery) {
      set({ searchQuery });
    },

    setActiveTag(activeTag) {
      set({ activeTag });
    },

    getAllTags() {
      const tagSet = new Set<string>();
      for (const entry of get().entries) {
        for (const tag of entry.tags) tagSet.add(tag);
      }
      return Array.from(tagSet).sort();
    },

    getEntry(id) {
      return get().entries.find((e) => e.id === id);
    },
  }))
);
