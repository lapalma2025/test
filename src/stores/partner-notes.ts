import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { createPersistStorage } from '@/storage/local-storage';

export type PartnerCategoryId = 'przemyslenia' | 'zakupy' | 'notatki' | 'dziecko';

export interface PartnerCategory {
  id: PartnerCategoryId;
  label: string;
  emoji: string;
  placeholder: string;
}

export const PARTNER_CATEGORIES: PartnerCategory[] = [
  { id: 'przemyslenia', label: 'Przemyślenia', emoji: '💭', placeholder: 'Zapisz swoje przemyślenia…' },
  { id: 'zakupy',       label: 'Co kupić',     emoji: '🛒', placeholder: 'Dodaj rzecz do kupienia…' },
  { id: 'notatki',      label: 'Notatki',      emoji: '📝', placeholder: 'Dodaj notatkę…' },
  { id: 'dziecko',      label: 'Dla dziecka',  emoji: '👶', placeholder: 'Pomysł dla maluszka…' },
];

export interface PartnerNoteItem {
  id: string;
  categoryId: PartnerCategoryId;
  text: string;
  done: boolean;
  createdAt: number;
}

interface PartnerNotesState {
  notes: PartnerNoteItem[];
  addNote: (categoryId: PartnerCategoryId, text: string) => void;
  toggleDone: (id: string) => void;
  deleteNote: (id: string) => void;
}

export const usePartnerNotesStore = create<PartnerNotesState>()(
  persist(
    (set) => ({
      notes: [],

      addNote: (categoryId, text) => {
        const trimmed = text.trim();
        if (!trimmed) return;
        set((s) => ({
          notes: [
            {
              id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
              categoryId,
              text: trimmed,
              done: false,
              createdAt: Date.now(),
            },
            ...s.notes,
          ],
        }));
      },

      toggleDone: (id) =>
        set((s) => ({
          notes: s.notes.map((n) => (n.id === id ? { ...n, done: !n.done } : n)),
        })),

      deleteNote: (id) =>
        set((s) => ({ notes: s.notes.filter((n) => n.id !== id) })),
    }),
    {
      name: 'kidelo-partner-notes',
      storage: createJSONStorage(() => createPersistStorage('kidelo-partner-notes')),
    }
  )
);
