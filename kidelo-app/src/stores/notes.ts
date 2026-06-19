/**
 * notes.ts — store notatek rodziców, persystowany lokalnie.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { createPersistStorage } from '@/storage/local-storage';

// ============ TYPY ============

export type CategoryId = 'mysli' | 'rzeczy' | 'szpitale' | 'dziecko' | 'lekarz';

export interface NoteCategory {
  id: CategoryId;
  label: string;
  emoji: string;
}

export const NOTE_CATEGORIES: NoteCategory[] = [
  { id: 'mysli',    label: 'Myśli',         emoji: '🧠' },
  { id: 'rzeczy',   label: 'Lista rzeczy',   emoji: '📦' },
  { id: 'szpitale', label: 'Szpitale',       emoji: '🏥' },
  { id: 'dziecko',  label: 'Dla dziecka',    emoji: '👶' },
  { id: 'lekarz',   label: 'Do lekarza',     emoji: '📅' },
];

export interface NoteItem {
  id: string;
  categoryId: CategoryId;
  text: string;
  done: boolean;
  createdAt: number; // timestamp ms
}

interface NotesState {
  notes: NoteItem[];
  addNote: (categoryId: CategoryId, text: string) => void;
  toggleDone: (id: string) => void;
  deleteNote: (id: string) => void;
  editNote: (id: string, text: string) => void;
}

// ============ STORE ============

export const useNotesStore = create<NotesState>()(
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

      editNote: (id, text) => {
        const trimmed = text.trim();
        if (!trimmed) return;
        set((s) => ({
          notes: s.notes.map((n) => (n.id === id ? { ...n, text: trimmed } : n)),
        }));
      },
    }),
    {
      name: 'kidelo-notes',
      storage: createJSONStorage(() => createPersistStorage('kidelo-notes')),
    }
  )
);
