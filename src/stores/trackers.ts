/**
 * trackers.ts — store wszystkich modułów zdrowotnych Kidelo.
 * Persystencja lokalna (MMKV / AsyncStorage) przez Zustand persist.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { createPersistStorage } from '@/storage/local-storage';

// ============ TYPY ============

export interface KickItem {
  time: number; // timestamp ms
}

export interface KickSession {
  id: string;
  date: string; // YYYY-MM-DD
  kicks: KickItem[];
  startedAt: number;
  endedAt?: number;
}

export interface ContractionItem {
  id: string;
  startedAt: number;
  endedAt?: number;
}

export interface ContractionSession {
  id: string;
  date: string;
  contractions: ContractionItem[];
  active: boolean;
}

export interface TestResult {
  id: string;
  name: string;
  value: string;
  unit: string;
  reference: string;
  date: string;
  status: 'normal' | 'abnormal' | 'unknown';
  note: string;
  trimester: 1 | 2 | 3 | null;
}

export interface FeedingSession {
  id: string;
  startedAt: number;
  endedAt?: number;
  side: 'left' | 'right' | 'bottle' | 'pump';
  note?: string;
}

export interface Vaccination {
  id: string;
  name: string;
  detail: string;
  groupLabel: string;
  done: boolean;
  completedDate?: string;
  note?: string;
}

export interface BumpEntry {
  id: string;
  week: number;
  date: string; // YYYY-MM-DD
  note: string;
  mood: 'great' | 'good' | 'tired' | 'tough';
}

export interface AlbumPhoto {
  week: number;
  uri: string; // permanent file URI in app's document directory
  addedAt: number;
}

export interface UsgPhoto {
  id: string;
  week: number;
  uri: string;
  addedAt: number;
}

// ============ STORE ============

interface TrackersState {
  // Kick counter
  kickSessions: KickSession[];
  activeKickSessionId: string | null;

  // Contraction timer
  contractionSessions: ContractionSession[];
  activeContractionSessionId: string | null;

  // Test results
  testResults: TestResult[];

  // Feeding tracker
  feedingSessions: FeedingSession[];
  activeFeedingSessionId: string | null;

  // Vaccinations
  vaccinations: Vaccination[];

  // Bump diary
  bumpEntries: BumpEntry[];

  // KICK ACTIONS
  startKickSession: () => void;
  addKick: () => void;
  endKickSession: () => void;
  tapKick: () => void;
  removeLastKick: () => void;

  // CONTRACTION ACTIONS
  startContractionSession: () => void;
  startContraction: () => void;
  endContraction: () => void;
  endContractionSession: () => void;

  // TEST RESULT ACTIONS
  addTestResult: (r: Omit<TestResult, 'id'>) => void;
  deleteTestResult: (id: string) => void;
  updateTestResult: (id: string, r: Partial<TestResult>) => void;

  // FEEDING ACTIONS
  startFeeding: (side: FeedingSession['side']) => void;
  endFeeding: () => void;
  deleteFeeding: (id: string) => void;

  // VACCINATION ACTIONS
  initVaccinations: () => void;
  toggleVaccination: (id: string, date?: string) => void;
  setVaccinationNote: (id: string, note: string) => void;

  // BUMP ACTIONS
  addBumpEntry: (e: Omit<BumpEntry, 'id'>) => void;
  updateBumpEntry: (id: string, e: Partial<BumpEntry>) => void;
  deleteBumpEntry: (id: string) => void;

  // ALBUM ACTIONS
  albumPhotos: AlbumPhoto[];
  setAlbumPhoto: (week: number, uri: string) => void;
  removeAlbumPhoto: (week: number) => void;

  // USG ALBUM ACTIONS
  usgPhotos: UsgPhoto[];
  addUsgPhotos: (items: { uri: string; week: number }[]) => void;
  removeUsgPhoto: (id: string) => void;

  // KICK SESSION MANAGEMENT
  deleteKickSession: (id: string) => void;
  setKickSessionCount: (id: string, count: number) => void;

  // CONTRACTION MANAGEMENT
  deleteContractionSession: (id: string) => void;
  deleteContraction: (sessionId: string, contractionId: string) => void;

  // CLOUD SYNC
  replaceFromCloud: (data: {
    kickSessions: KickSession[];
    contractionSessions: ContractionSession[];
    testResults: TestResult[];
    feedingSessions: FeedingSession[];
    vaccinations: Vaccination[];
    bumpEntries: BumpEntry[];
  }) => void;
}

// ============ DOMYŚLNE SZCZEPIENIA (PL 2024) ============

const DEFAULT_VACCINATIONS: Omit<Vaccination, 'done' | 'completedDate' | 'note'>[] = [
  // Przy urodzeniu
  { id: 'bcg', name: 'BCG', detail: 'Gruźlica', groupLabel: 'Przy urodzeniu' },
  { id: 'wzwb1', name: 'WZW B', detail: '1. dawka', groupLabel: 'Przy urodzeniu' },

  // 6-8 tygodnia
  { id: 'wzwb2', name: 'WZW B', detail: '2. dawka', groupLabel: '6–8 tygodnia życia' },
  { id: 'dtp1', name: 'DTP', detail: '1. dawka (błonica, tężec, krztusiec)', groupLabel: '6–8 tygodnia życia' },
  { id: 'hib1', name: 'Hib', detail: '1. dawka (Haemophilus influenzae)', groupLabel: '6–8 tygodnia życia' },
  { id: 'ipv1', name: 'IPV', detail: '1. dawka (polio)', groupLabel: '6–8 tygodnia życia' },
  { id: 'pcv1', name: 'PCV', detail: '1. dawka (pneumokoki)', groupLabel: '6–8 tygodnia życia' },
  { id: 'rv1', name: 'Rotawirusy', detail: '1. dawka', groupLabel: '6–8 tygodnia życia' },

  // 4 miesiące
  { id: 'dtp2', name: 'DTP', detail: '2. dawka', groupLabel: '4. miesiąc życia' },
  { id: 'hib2', name: 'Hib', detail: '2. dawka', groupLabel: '4. miesiąc życia' },
  { id: 'ipv2', name: 'IPV', detail: '2. dawka', groupLabel: '4. miesiąc życia' },
  { id: 'pcv2', name: 'PCV', detail: '2. dawka', groupLabel: '4. miesiąc życia' },
  { id: 'rv2', name: 'Rotawirusy', detail: '2. dawka', groupLabel: '4. miesiąc życia' },

  // 5-6 miesięcy
  { id: 'dtp3', name: 'DTP', detail: '3. dawka', groupLabel: '5–6. miesiąc życia' },
  { id: 'hib3', name: 'Hib', detail: '3. dawka', groupLabel: '5–6. miesiąc życia' },
  { id: 'ipv3', name: 'IPV', detail: '3. dawka', groupLabel: '5–6. miesiąc życia' },
  { id: 'wzwb3', name: 'WZW B', detail: '3. dawka', groupLabel: '5–6. miesiąc życia' },

  // 13-14 miesięcy
  { id: 'mmr1', name: 'MMR', detail: '1. dawka (odra, świnka, różyczka)', groupLabel: '13–14. miesiąc życia' },
  { id: 'pcv3', name: 'PCV', detail: 'dawka przypominająca', groupLabel: '13–14. miesiąc życia' },

  // 16-18 miesięcy
  { id: 'dtp4', name: 'DTP', detail: '4. dawka', groupLabel: '16–18. miesiąc życia' },
  { id: 'hib4', name: 'Hib', detail: 'dawka przypominająca', groupLabel: '16–18. miesiąc życia' },
  { id: 'ipv4', name: 'IPV', detail: '4. dawka', groupLabel: '16–18. miesiąc życia' },

  // 6 lat
  { id: 'dtp5', name: 'DTP', detail: '5. dawka', groupLabel: '6. rok życia' },
  { id: 'ipv5', name: 'IPV', detail: '5. dawka', groupLabel: '6. rok życia' },
  { id: 'mmr2', name: 'MMR', detail: '2. dawka', groupLabel: '6. rok życia' },
];

// ============ HELPERS ============

function uid(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

// ============ STORE ============

export const useTrackersStore = create<TrackersState>()(
  persist(
    (set, get) => ({
      kickSessions: [],
      activeKickSessionId: null,
      contractionSessions: [],
      activeContractionSessionId: null,
      testResults: [],
      feedingSessions: [],
      activeFeedingSessionId: null,
      vaccinations: [],
      bumpEntries: [],
      albumPhotos: [],
      usgPhotos: [],

      // ── KICK ──────────────────────────────────────────

      startKickSession: () => {
        const id = uid();
        set((s) => ({
          kickSessions: [
            { id, date: todayIso(), kicks: [], startedAt: Date.now() },
            ...s.kickSessions,
          ],
          activeKickSessionId: id,
        }));
      },

      addKick: () => {
        const { activeKickSessionId } = get();
        if (!activeKickSessionId) return;
        set((s) => ({
          kickSessions: s.kickSessions.map((sess) =>
            sess.id === activeKickSessionId
              ? { ...sess, kicks: [...sess.kicks, { time: Date.now() }] }
              : sess
          ),
        }));
      },

      endKickSession: () => {
        const { activeKickSessionId } = get();
        if (!activeKickSessionId) return;
        set((s) => ({
          kickSessions: s.kickSessions.map((sess) =>
            sess.id === activeKickSessionId ? { ...sess, endedAt: Date.now() } : sess
          ),
          activeKickSessionId: null,
        }));
      },

      tapKick: () => {
        const { activeKickSessionId } = get();
        if (!activeKickSessionId) {
          const id = uid();
          set((s) => ({
            kickSessions: [
              { id, date: todayIso(), kicks: [{ time: Date.now() }], startedAt: Date.now() },
              ...s.kickSessions,
            ],
            activeKickSessionId: id,
          }));
        } else {
          set((s) => ({
            kickSessions: s.kickSessions.map((sess) =>
              sess.id === activeKickSessionId
                ? { ...sess, kicks: [...sess.kicks, { time: Date.now() }] }
                : sess
            ),
          }));
        }
      },

      removeLastKick: () => {
        const { activeKickSessionId } = get();
        if (!activeKickSessionId) return;
        set((s) => ({
          kickSessions: s.kickSessions.map((sess) =>
            sess.id === activeKickSessionId
              ? { ...sess, kicks: sess.kicks.slice(0, -1) }
              : sess
          ),
        }));
      },

      // ── CONTRACTIONS ────────────────────────────────

      startContractionSession: () => {
        const id = uid();
        set((s) => ({
          contractionSessions: [
            { id, date: todayIso(), contractions: [], active: true },
            ...s.contractionSessions,
          ],
          activeContractionSessionId: id,
        }));
      },

      startContraction: () => {
        const { activeContractionSessionId } = get();
        if (!activeContractionSessionId) return;
        const cId = uid();
        set((s) => ({
          contractionSessions: s.contractionSessions.map((sess) =>
            sess.id === activeContractionSessionId
              ? {
                  ...sess,
                  contractions: [
                    ...sess.contractions,
                    { id: cId, startedAt: Date.now() },
                  ],
                }
              : sess
          ),
        }));
      },

      endContraction: () => {
        const { activeContractionSessionId } = get();
        if (!activeContractionSessionId) return;
        set((s) => ({
          contractionSessions: s.contractionSessions.map((sess) => {
            if (sess.id !== activeContractionSessionId) return sess;
            const last = sess.contractions[sess.contractions.length - 1];
            if (!last || last.endedAt) return sess;
            return {
              ...sess,
              contractions: sess.contractions.map((c, i) =>
                i === sess.contractions.length - 1
                  ? { ...c, endedAt: Date.now() }
                  : c
              ),
            };
          }),
        }));
      },

      endContractionSession: () => {
        const { activeContractionSessionId } = get();
        if (!activeContractionSessionId) return;
        set((s) => ({
          contractionSessions: s.contractionSessions.map((sess) =>
            sess.id === activeContractionSessionId ? { ...sess, active: false } : sess
          ),
          activeContractionSessionId: null,
        }));
      },

      // ── TEST RESULTS ─────────────────────────────────

      addTestResult: (r) => {
        set((s) => ({
          testResults: [{ ...r, id: uid() }, ...s.testResults],
        }));
      },

      deleteTestResult: (id) => {
        set((s) => ({ testResults: s.testResults.filter((r) => r.id !== id) }));
      },

      updateTestResult: (id, r) => {
        set((s) => ({
          testResults: s.testResults.map((x) => (x.id === id ? { ...x, ...r } : x)),
        }));
      },

      // ── FEEDING ──────────────────────────────────────

      startFeeding: (side) => {
        const { activeFeedingSessionId } = get();
        if (activeFeedingSessionId) return;
        const id = uid();
        set((s) => ({
          feedingSessions: [{ id, startedAt: Date.now(), side }, ...s.feedingSessions],
          activeFeedingSessionId: id,
        }));
      },

      endFeeding: () => {
        const { activeFeedingSessionId } = get();
        if (!activeFeedingSessionId) return;
        set((s) => ({
          feedingSessions: s.feedingSessions.map((sess) =>
            sess.id === activeFeedingSessionId ? { ...sess, endedAt: Date.now() } : sess
          ),
          activeFeedingSessionId: null,
        }));
      },

      deleteFeeding: (id) => {
        set((s) => ({
          feedingSessions: s.feedingSessions.filter((f) => f.id !== id),
          activeFeedingSessionId: get().activeFeedingSessionId === id ? null : get().activeFeedingSessionId,
        }));
      },

      // ── VACCINATIONS ─────────────────────────────────

      initVaccinations: () => {
        if (get().vaccinations.length > 0) return;
        set({
          vaccinations: DEFAULT_VACCINATIONS.map((v) => ({ ...v, done: false })),
        });
      },

      toggleVaccination: (id, date) => {
        set((s) => ({
          vaccinations: s.vaccinations.map((v) =>
            v.id === id
              ? { ...v, done: !v.done, completedDate: !v.done ? (date ?? todayIso()) : undefined }
              : v
          ),
        }));
      },

      setVaccinationNote: (id, note) => {
        set((s) => ({
          vaccinations: s.vaccinations.map((v) => (v.id === id ? { ...v, note } : v)),
        }));
      },

      // ── KICK SESSION MANAGEMENT ──────────────────────

      deleteKickSession: (id) => {
        set((s) => ({
          kickSessions: s.kickSessions.filter((sess) => sess.id !== id),
          activeKickSessionId: s.activeKickSessionId === id ? null : s.activeKickSessionId,
        }));
      },

      setKickSessionCount: (id, count) => {
        const n = Math.max(0, count);
        set((s) => ({
          kickSessions: s.kickSessions.map((sess) => {
            if (sess.id !== id) return sess;
            if (n <= sess.kicks.length) return { ...sess, kicks: sess.kicks.slice(0, n) };
            const extra = Array.from({ length: n - sess.kicks.length }, () => ({ time: Date.now() }));
            return { ...sess, kicks: [...sess.kicks, ...extra] };
          }),
        }));
      },

      // ── CONTRACTION MANAGEMENT ────────────────────────

      deleteContractionSession: (id) => {
        set((s) => ({
          contractionSessions: s.contractionSessions.filter((sess) => sess.id !== id),
          activeContractionSessionId: s.activeContractionSessionId === id ? null : s.activeContractionSessionId,
        }));
      },

      deleteContraction: (sessionId, contractionId) => {
        set((s) => ({
          contractionSessions: s.contractionSessions.map((sess) =>
            sess.id === sessionId
              ? { ...sess, contractions: sess.contractions.filter((c) => c.id !== contractionId) }
              : sess
          ),
        }));
      },

      // ── CLOUD SYNC ────────────────────────────────────

      replaceFromCloud: (data) => {
        set({
          kickSessions: data.kickSessions,
          contractionSessions: data.contractionSessions,
          testResults: data.testResults,
          feedingSessions: data.feedingSessions,
          vaccinations: data.vaccinations,
          bumpEntries: data.bumpEntries,
          activeKickSessionId: null,
          activeContractionSessionId: null,
          activeFeedingSessionId: null,
        });
      },

      // ── ALBUM PHOTOS ─────────────────────────────────

      setAlbumPhoto: (week, uri) => {
        set((s) => ({
          albumPhotos: [
            ...s.albumPhotos.filter((p) => p.week !== week),
            { week, uri, addedAt: Date.now() },
          ],
        }));
      },

      removeAlbumPhoto: (week) => {
        set((s) => ({ albumPhotos: s.albumPhotos.filter((p) => p.week !== week) }));
      },

      addUsgPhotos: (items) => {
        set((s) => ({
          usgPhotos: [
            ...s.usgPhotos,
            ...items.map((item) => ({ ...item, id: uid(), addedAt: Date.now() })),
          ],
        }));
      },

      removeUsgPhoto: (id) => {
        set((s) => ({ usgPhotos: s.usgPhotos.filter((p) => p.id !== id) }));
      },

      // ── BUMP DIARY ────────────────────────────────────

      addBumpEntry: (e) => {
        set((s) => ({
          bumpEntries: [{ ...e, id: uid() }, ...s.bumpEntries].sort(
            (a, b) => b.week - a.week
          ),
        }));
      },

      updateBumpEntry: (id, e) => {
        set((s) => ({
          bumpEntries: s.bumpEntries.map((x) => (x.id === id ? { ...x, ...e } : x)),
        }));
      },

      deleteBumpEntry: (id) => {
        set((s) => ({ bumpEntries: s.bumpEntries.filter((x) => x.id !== id) }));
      },
    }),
    {
      name: 'kidelo-trackers-v1',
      storage: createJSONStorage(() => createPersistStorage('kidelo-trackers')),
    }
  )
);
