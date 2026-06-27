'use client';

import { create } from 'zustand';
import type { Lang } from '@/lib/i18n';
import { translations } from '@/lib/i18n';

// Use a union of all translation shapes so any language is assignable
export type Translations = typeof translations[Lang];

interface LangState {
  lang: Lang;
  t: Translations;
  setLang: (lang: Lang) => void;
}

export const useLangStore = create<LangState>((set) => ({
  lang: 'uk',
  t: translations.uk as Translations,

  setLang(lang) {
    if (typeof window !== 'undefined') {
      localStorage.setItem('sj_lang', lang);
    }
    set({ lang, t: translations[lang] as Translations });
  },
}));

export function useT(): Translations {
  return useLangStore((s) => s.t);
}
