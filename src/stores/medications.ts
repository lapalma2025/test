import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { createPersistStorage } from '@/storage/local-storage';
import { colors } from '@/theme/tokens';

export type MedType = 'supplement' | 'prescription' | 'pregnancy_vitamin' | 'insulin' | 'child_med';

export interface MedScheduleItem {
  id: string;
  hour: number;
  minute: number;
  dosage: string;
}

export interface Medication {
  id: string;
  name: string;
  type: MedType;
  schedule: MedScheduleItem[];
  dosageNote?: string;
  notificationIds: string[];
  createdAt: number;
}

export interface DoseRecord {
  id: string;
  medicationId: string;
  scheduleItemId: string;
  dateKey: string;
  takenAt: number | null;
}

export const MED_TYPE_CONFIG: Record<MedType, { label: string; emoji: string; bgColor: string }> = {
  supplement:        { label: 'Suplement',        emoji: '💊', bgColor: colors.mustard.soft },
  prescription:      { label: 'Lek na receptę',   emoji: '🩺', bgColor: colors.sage.soft },
  pregnancy_vitamin: { label: 'Witamina ciążowa', emoji: '🤰', bgColor: colors.blush.soft },
  insulin:           { label: 'Insulina',          emoji: '🧪', bgColor: colors.terracotta.soft },
  child_med:         { label: 'Lek dziecka',       emoji: '🍼', bgColor: '#E0EAF5' },
};

// ─── PURE HELPERS ─────────────────────────────────────────────────────────────

export interface NextDueResult {
  medication: Medication;
  item: MedScheduleItem;
  at: Date;
}

export function getNextDue(medications: Medication[], doseRecords: DoseRecord[] = []): NextDueResult | null {
  if (medications.length === 0) return null;
  const now = new Date();
  const todayKey = now.toISOString().slice(0, 10);
  const candidates: NextDueResult[] = [];

  for (const med of medications) {
    for (const item of med.schedule) {
      const todayAt = new Date(now);
      todayAt.setHours(item.hour, item.minute, 0, 0);

      // Jeśli doza jest już odznaczona na dziś (nawet przed godziną) → przeskocz do jutra
      const takenToday = doseRecords.some(
        (r) =>
          r.medicationId === med.id &&
          r.scheduleItemId === item.id &&
          r.dateKey === todayKey &&
          r.takenAt != null,
      );

      if (!takenToday && todayAt > now) {
        candidates.push({ medication: med, item, at: todayAt });
      } else {
        const tomorrowAt = new Date(now);
        tomorrowAt.setDate(tomorrowAt.getDate() + 1);
        tomorrowAt.setHours(item.hour, item.minute, 0, 0);
        candidates.push({ medication: med, item, at: tomorrowAt });
      }
    }
  }

  if (candidates.length === 0) return null;
  candidates.sort((a, b) => a.at.getTime() - b.at.getTime());
  return candidates[0] ?? null;
}

export interface TodayEntry {
  medication: Medication;
  item: MedScheduleItem;
  scheduledAt: Date;
  record: DoseRecord | undefined;
  taken: boolean;
  skipped: boolean;
  overdue: boolean;
}

export function getTodaySchedule(
  medications: Medication[],
  records: DoseRecord[],
  dateKey: string,
): TodayEntry[] {
  const now = new Date();
  const result: TodayEntry[] = [];

  for (const med of medications) {
    for (const item of med.schedule) {
      const scheduledAt = new Date();
      scheduledAt.setHours(item.hour, item.minute, 0, 0);
      const record = records.find(
        (r) => r.medicationId === med.id && r.scheduleItemId === item.id && r.dateKey === dateKey,
      );
      result.push({
        medication: med,
        item,
        scheduledAt,
        record,
        taken: record?.takenAt != null,
        skipped: record !== undefined && record.takenAt === null,
        overdue: !record && scheduledAt < now,
      });
    }
  }

  return result.sort((a, b) => a.scheduledAt.getTime() - b.scheduledAt.getTime());
}

function getDayAdherence(
  medications: Medication[],
  records: DoseRecord[],
  dateKey: string,
  isToday: boolean,
): number {
  if (medications.length === 0) return 0;
  const now = new Date();
  let total = 0;
  let taken = 0;

  for (const med of medications) {
    for (const item of med.schedule) {
      if (isToday) {
        const scheduledAt = new Date();
        scheduledAt.setHours(item.hour, item.minute, 0, 0);
        if (scheduledAt > now) continue;
      }
      total++;
      const record = records.find(
        (r) => r.medicationId === med.id && r.scheduleItemId === item.id && r.dateKey === dateKey,
      );
      if (record?.takenAt != null) taken++;
    }
  }

  return total === 0 ? 100 : Math.round((taken / total) * 100);
}

export function getAdherence(
  medications: Medication[],
  records: DoseRecord[],
  daysBack: number,
): number {
  if (medications.length === 0) return 0;
  const now = new Date();
  let total = 0;
  let taken = 0;

  for (let d = 0; d < daysBack; d++) {
    const date = new Date(now);
    date.setDate(date.getDate() - d);
    const dateKey = date.toISOString().slice(0, 10);

    for (const med of medications) {
      for (const item of med.schedule) {
        if (d === 0) {
          const scheduledAt = new Date();
          scheduledAt.setHours(item.hour, item.minute, 0, 0);
          if (scheduledAt > now) continue;
        }
        total++;
        const record = records.find(
          (r) => r.medicationId === med.id && r.scheduleItemId === item.id && r.dateKey === dateKey,
        );
        if (record?.takenAt != null) taken++;
      }
    }
  }

  return total === 0 ? 0 : Math.round((taken / total) * 100);
}

export function getStreakDays(medications: Medication[], records: DoseRecord[]): number {
  if (medications.length === 0) return 0;
  const now = new Date();
  let streak = 0;

  for (let d = 0; d <= 365; d++) {
    const date = new Date(now);
    date.setDate(date.getDate() - d);
    const dateKey = date.toISOString().slice(0, 10);
    const isToday = d === 0;
    let allTaken = true;
    let hadDue = false;

    for (const med of medications) {
      for (const item of med.schedule) {
        if (isToday) {
          const scheduledAt = new Date();
          scheduledAt.setHours(item.hour, item.minute, 0, 0);
          if (scheduledAt > now) continue;
        }
        hadDue = true;
        const record = records.find(
          (r) => r.medicationId === med.id && r.scheduleItemId === item.id && r.dateKey === dateKey,
        );
        if (!record?.takenAt) allTaken = false;
      }
    }

    if (!hadDue) { streak++; continue; }
    if (allTaken) streak++;
    else break;
  }

  return streak;
}

export function getChartData(
  medications: Medication[],
  records: DoseRecord[],
): { label: string; value: number }[] {
  const now = new Date();
  const dayNames = ['Nd', 'Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'So'];

  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now);
    d.setDate(d.getDate() - (6 - i));
    const dateKey = d.toISOString().slice(0, 10);
    return {
      label: dayNames[d.getDay()] ?? '',
      value: getDayAdherence(medications, records, dateKey, i === 6),
    };
  });
}

// ─── STORE ────────────────────────────────────────────────────────────────────

function uid(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

export interface NotifPrefs {
  sound: boolean;
  vibration: boolean;
}

interface MedicationsState {
  medications: Medication[];
  doseRecords: DoseRecord[];
  notifPrefs: NotifPrefs;
  addMedication: (m: Omit<Medication, 'id' | 'createdAt' | 'notificationIds'>) => string;
  updateMedication: (id: string, data: Omit<Medication, 'id' | 'createdAt' | 'notificationIds'>) => void;
  updateNotificationIds: (id: string, notificationIds: string[]) => void;
  deleteMedication: (id: string) => Medication | null;
  recordDose: (medicationId: string, scheduleItemId: string) => void;
  skipDose: (medicationId: string, scheduleItemId: string) => void;
  undoDose: (medicationId: string, scheduleItemId: string) => void;
  setDoseRecord: (medicationId: string, scheduleItemId: string, dateKey: string, status: 'taken' | 'skipped' | 'none') => void;
  setNotifPrefs: (prefs: NotifPrefs) => void;
  replaceFromCloud: (data: { medications: Medication[]; doseRecords: DoseRecord[] }) => void;
}

export const useMedicationsStore = create<MedicationsState>()(
  persist(
    (set, get) => ({
      medications: [],
      doseRecords: [],
      notifPrefs: { sound: true, vibration: true },

      addMedication: (medData) => {
        const id = uid();
        const med: Medication = { ...medData, id, createdAt: Date.now(), notificationIds: [] };
        set((s) => ({ medications: [...s.medications, med] }));
        return id;
      },

      updateMedication: (id, data) => {
        set((s) => ({
          medications: s.medications.map((m) =>
            m.id === id ? { ...m, ...data } : m,
          ),
        }));
      },

      updateNotificationIds: (id, notificationIds) => {
        set((s) => ({
          medications: s.medications.map((m) => (m.id === id ? { ...m, notificationIds } : m)),
        }));
      },

      deleteMedication: (id) => {
        const med = get().medications.find((m) => m.id === id) ?? null;
        set((s) => ({
          medications: s.medications.filter((m) => m.id !== id),
          doseRecords: s.doseRecords.filter((r) => r.medicationId !== id),
        }));
        return med;
      },

      recordDose: (medicationId, scheduleItemId) => {
        const today = todayKey();
        set((s) => {
          const exists = s.doseRecords.some(
            (r) => r.medicationId === medicationId && r.scheduleItemId === scheduleItemId && r.dateKey === today,
          );
          if (exists) {
            return {
              doseRecords: s.doseRecords.map((r) =>
                r.medicationId === medicationId && r.scheduleItemId === scheduleItemId && r.dateKey === today
                  ? { ...r, takenAt: Date.now() }
                  : r,
              ),
            };
          }
          return {
            doseRecords: [
              ...s.doseRecords,
              { id: uid(), medicationId, scheduleItemId, dateKey: today, takenAt: Date.now() },
            ],
          };
        });
      },

      skipDose: (medicationId, scheduleItemId) => {
        const today = todayKey();
        set((s) => {
          const exists = s.doseRecords.some(
            (r) => r.medicationId === medicationId && r.scheduleItemId === scheduleItemId && r.dateKey === today,
          );
          if (exists) {
            return {
              doseRecords: s.doseRecords.map((r) =>
                r.medicationId === medicationId && r.scheduleItemId === scheduleItemId && r.dateKey === today
                  ? { ...r, takenAt: null }
                  : r,
              ),
            };
          }
          return {
            doseRecords: [
              ...s.doseRecords,
              { id: uid(), medicationId, scheduleItemId, dateKey: today, takenAt: null },
            ],
          };
        });
      },

      undoDose: (medicationId, scheduleItemId) => {
        const today = todayKey();
        set((s) => ({
          doseRecords: s.doseRecords.filter(
            (r) => !(r.medicationId === medicationId && r.scheduleItemId === scheduleItemId && r.dateKey === today),
          ),
        }));
      },

      setDoseRecord: (medicationId, scheduleItemId, dateKey, status) => {
        set((s) => {
          const filtered = s.doseRecords.filter(
            (r) => !(r.medicationId === medicationId && r.scheduleItemId === scheduleItemId && r.dateKey === dateKey),
          );
          if (status === 'none') return { doseRecords: filtered };
          return {
            doseRecords: [
              ...filtered,
              { id: uid(), medicationId, scheduleItemId, dateKey, takenAt: status === 'taken' ? Date.now() : null },
            ],
          };
        });
      },

      setNotifPrefs: (prefs) => set({ notifPrefs: prefs }),

      replaceFromCloud: (data) => set({
        medications: data.medications,
        doseRecords: data.doseRecords,
      }),
    }),
    {
      name: 'kidelo-medications-v1',
      storage: createJSONStorage(() => createPersistStorage('kidelo-medications')),
    },
  ),
);
