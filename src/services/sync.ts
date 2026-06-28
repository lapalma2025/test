/**
 * sync.ts — push/pull wszystkich danych zdrowotnych z Supabase.
 * Dane są powiązane z user_id (RLS). Zdjęcia (albumPhotos, usgPhotos)
 * nie są synchronizowane — to lokalne URI pliku.
 */

import { supabase } from './supabase';
import {
  useTrackersStore,
  type KickSession,
  type ContractionSession,
  type TestResult,
  type FeedingSession,
  type Vaccination,
  type BumpEntry,
} from '@/stores/trackers';
import { useMedicationsStore, type Medication, type DoseRecord } from '@/stores/medications';
import { useNotesStore, type NoteItem } from '@/stores/notes';

// ── HELPERS ───────────────────────────────────────────────────────────────────

async function replaceTable(
  tableName: string,
  userId: string,
  rows: Record<string, unknown>[],
): Promise<void> {
  const { error: delError } = await supabase
    .from(tableName)
    .delete()
    .eq('user_id', userId);
  if (delError) return; // Nie insertuj jeśli delete się nie powiódł
  if (rows.length > 0) {
    await supabase.from(tableName).insert(rows);
  }
}

// ── PUSH ─────────────────────────────────────────────────────────────────────

export async function pushAll(userId: string): Promise<void> {
  const t = useTrackersStore.getState();
  const m = useMedicationsStore.getState();
  const n = useNotesStore.getState();

  await Promise.allSettled([
    replaceTable(
      'kidelo_kick_sessions',
      userId,
      t.kickSessions.map((s) => ({
        id: s.id,
        user_id: userId,
        date: s.date,
        kicks: s.kicks,
        started_at: s.startedAt,
        ended_at: s.endedAt ?? null,
      })),
    ),
    replaceTable(
      'kidelo_contraction_sessions',
      userId,
      t.contractionSessions.map((s) => ({
        id: s.id,
        user_id: userId,
        date: s.date,
        contractions: s.contractions,
        active: s.active,
      })),
    ),
    replaceTable(
      'kidelo_test_results',
      userId,
      t.testResults.map((r) => ({
        id: r.id,
        user_id: userId,
        name: r.name,
        value: r.value,
        unit: r.unit,
        reference: r.reference,
        date: r.date,
        status: r.status,
        note: r.note,
        trimester: r.trimester ?? null,
      })),
    ),
    replaceTable(
      'kidelo_feeding_sessions',
      userId,
      t.feedingSessions.map((s) => ({
        id: s.id,
        user_id: userId,
        started_at: s.startedAt,
        ended_at: s.endedAt ?? null,
        side: s.side,
        note: s.note ?? null,
      })),
    ),
    replaceTable(
      'kidelo_vaccinations',
      userId,
      t.vaccinations.map((v) => ({
        id: v.id,
        user_id: userId,
        name: v.name,
        detail: v.detail,
        group_label: v.groupLabel,
        done: v.done,
        completed_date: v.completedDate ?? null,
        note: v.note ?? null,
      })),
    ),
    replaceTable(
      'kidelo_bump_entries',
      userId,
      t.bumpEntries.map((e) => ({
        id: e.id,
        user_id: userId,
        week: e.week,
        date: e.date,
        note: e.note,
        mood: e.mood,
      })),
    ),
    replaceTable(
      'kidelo_medications',
      userId,
      m.medications.map((med) => ({
        id: med.id,
        user_id: userId,
        name: med.name,
        type: med.type,
        schedule: med.schedule,
        dosage_note: med.dosageNote ?? null,
        created_at: med.createdAt,
      })),
    ),
    replaceTable(
      'kidelo_dose_records',
      userId,
      m.doseRecords.map((r) => ({
        id: r.id,
        user_id: userId,
        medication_id: r.medicationId,
        schedule_item_id: r.scheduleItemId,
        date_key: r.dateKey,
        taken_at: r.takenAt ?? null,
      })),
    ),
    replaceTable(
      'kidelo_notes',
      userId,
      n.notes.map((note) => ({
        id: note.id,
        user_id: userId,
        category_id: note.categoryId,
        text: note.text,
        done: note.done,
        created_at: note.createdAt,
      })),
    ),
  ]);
}

// ── PULL ─────────────────────────────────────────────────────────────────────

export async function pullAndApply(userId: string): Promise<void> {
  const [
    kicksRes,
    contractionsRes,
    testsRes,
    feedingsRes,
    vaccinationsRes,
    bumpsRes,
    medsRes,
    dosesRes,
    notesRes,
  ] = await Promise.all([
    supabase.from('kidelo_kick_sessions').select('*').eq('user_id', userId),
    supabase.from('kidelo_contraction_sessions').select('*').eq('user_id', userId),
    supabase.from('kidelo_test_results').select('*').eq('user_id', userId),
    supabase.from('kidelo_feeding_sessions').select('*').eq('user_id', userId),
    supabase.from('kidelo_vaccinations').select('*').eq('user_id', userId),
    supabase.from('kidelo_bump_entries').select('*').eq('user_id', userId),
    supabase.from('kidelo_medications').select('*').eq('user_id', userId),
    supabase.from('kidelo_dose_records').select('*').eq('user_id', userId),
    supabase.from('kidelo_notes').select('*').eq('user_id', userId),
  ]);

  const kickSessions: KickSession[] = (kicksRes.data ?? []).map((r: any) => ({
    id: r.id,
    date: r.date,
    kicks: r.kicks ?? [],
    startedAt: r.started_at,
    endedAt: r.ended_at ?? undefined,
  }));

  const contractionSessions: ContractionSession[] = (contractionsRes.data ?? []).map((r: any) => ({
    id: r.id,
    date: r.date,
    contractions: r.contractions ?? [],
    active: r.active,
  }));

  const testResults: TestResult[] = (testsRes.data ?? []).map((r: any) => ({
    id: r.id,
    name: r.name,
    value: r.value,
    unit: r.unit,
    reference: r.reference,
    date: r.date,
    status: r.status,
    note: r.note,
    trimester: r.trimester ?? null,
  }));

  const feedingSessions: FeedingSession[] = (feedingsRes.data ?? []).map((r: any) => ({
    id: r.id,
    startedAt: r.started_at,
    endedAt: r.ended_at ?? undefined,
    side: r.side,
    note: r.note ?? undefined,
  }));

  const vaccinations: Vaccination[] = (vaccinationsRes.data ?? []).map((r: any) => ({
    id: r.id,
    name: r.name,
    detail: r.detail,
    groupLabel: r.group_label,
    done: r.done,
    completedDate: r.completed_date ?? undefined,
    note: r.note ?? undefined,
  }));

  const bumpEntries: BumpEntry[] = (bumpsRes.data ?? []).map((r: any) => ({
    id: r.id,
    week: r.week,
    date: r.date,
    note: r.note,
    mood: r.mood,
  }));

  const medications: Medication[] = (medsRes.data ?? []).map((r: any) => ({
    id: r.id,
    name: r.name,
    type: r.type,
    schedule: r.schedule ?? [],
    dosageNote: r.dosage_note ?? undefined,
    notificationIds: [], // powiadomienia są per-device
    createdAt: r.created_at,
  }));

  const doseRecords: DoseRecord[] = (dosesRes.data ?? []).map((r: any) => ({
    id: r.id,
    medicationId: r.medication_id,
    scheduleItemId: r.schedule_item_id,
    dateKey: r.date_key,
    takenAt: r.taken_at ?? null,
  }));

  const noteItems: NoteItem[] = (notesRes.data ?? []).map((r: any) => ({
    id: r.id,
    categoryId: r.category_id,
    text: r.text,
    done: r.done,
    createdAt: r.created_at,
  }));

  useTrackersStore.getState().replaceFromCloud({
    kickSessions,
    contractionSessions,
    testResults,
    feedingSessions,
    vaccinations,
    bumpEntries,
  });
  useMedicationsStore.getState().replaceFromCloud({ medications, doseRecords });
  useNotesStore.getState().replaceFromCloud(noteItems);
}

// ── CHECK IF CLOUD HAS DATA ───────────────────────────────────────────────────

export async function cloudHasData(userId: string): Promise<boolean> {
  const { data: kicks } = await supabase
    .from('kidelo_kick_sessions')
    .select('id')
    .eq('user_id', userId)
    .limit(1);
  if (kicks && kicks.length > 0) return true;

  const { data: notes } = await supabase
    .from('kidelo_notes')
    .select('id')
    .eq('user_id', userId)
    .limit(1);
  return !!(notes && notes.length > 0);
}
