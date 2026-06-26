import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { createPersistStorage } from '@/storage/local-storage';

export type Lang = 'pl' | 'en';

interface LanguageState {
  lang: Lang;
  setLang: (lang: Lang) => void;
}

export const useLanguageStore = create<LanguageState>()(
  persist(
    (set) => ({
      lang: 'pl',
      setLang: (lang) => set({ lang }),
    }),
    {
      name: 'kidelo-language',
      storage: createJSONStorage(() => createPersistStorage('lang')),
    }
  )
);
