import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  Modal,
  Alert,
  Animated,
  KeyboardAvoidingView,
  Platform,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { Icon } from '@/components/ui/Icon';
import { colors } from '@/theme/tokens';
import {
  useMedicationsStore,
  MED_TYPE_CONFIG,
  getNextDue,
  getTodaySchedule,
  getAdherence,
  getStreakDays,
  getChartData,
  type MedType,
  type TodayEntry,
  type Medication,
  type NotifPrefs,
  type DoseRecord,
} from '@/stores/medications';
import {
  scheduleMedNotifications,
  cancelMedNotifications,
  snoozeMedNotification,
  rescheduleAllMedNotifications,
  requestMedNotifPermissions,
  checkExactAlarmPermission,
  openExactAlarmSettings,
} from '@/services/medicationNotifications';
import { useT } from '@/i18n';

// ─── HELPERS ──────────────────────────────────────────────────────────────────

const pad = (n: number) => String(n).padStart(2, '0');

function formatCountdown(ms: number, nowLabel: string): string {
  if (ms <= 0) return nowLabel;
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

function fmtTime(h: number, m: number): string {
  return `${pad(h)}:${pad(m)}`;
}

function parseTime(raw: string): { hour: number; minute: number } | null {
  const match = raw.trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return null;
  const hour = parseInt(match[1]!, 10);
  const minute = parseInt(match[2]!, 10);
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null;
  return { hour, minute };
}

// ─── TYPES ────────────────────────────────────────────────────────────────────

interface ScheduleFormEntry {
  time: string;
  dosage: string;
}

type Tab = 'today' | 'medications' | 'stats';

// ─── MAIN SCREEN ──────────────────────────────────────────────────────────────

export default function LekiScreen() {
  const router = useRouter();
  const t = useT();
  const {
    medications, doseRecords, notifPrefs,
    addMedication, updateMedication, updateNotificationIds, deleteMedication,
    recordDose, skipDose, setDoseRecord, setNotifPrefs,
  } = useMedicationsStore();

  const [activeTab, setActiveTab] = useState<Tab>('today');
  const [editingMed, setEditingMed] = useState<Medication | null>(null);
  const [showMedModal, setShowMedModal] = useState(false);
  const [showPrefsModal, setShowPrefsModal] = useState(false);
  const [exactAlarmOk, setExactAlarmOk] = useState(true);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    requestMedNotifPermissions().catch(() => {});
    checkExactAlarmPermission().then(setExactAlarmOk).catch(() => {});
  }, []);

  useEffect(() => {
    const id = setInterval(() => setTick((tv) => tv + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const todayKey = new Date().toISOString().slice(0, 10);
  const nextDue = getNextDue(medications);
  const todaySchedule = getTodaySchedule(medications, doseRecords, todayKey);

  const countdownMs = nextDue ? nextDue.at.getTime() - Date.now() : 0;

  const TABS: [Tab, string][] = [
    ['today', t.medications.tabToday],
    ['medications', t.medications.tabMeds],
    ['stats', t.medications.tabStats],
  ];

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: colors.cream.DEFAULT }}>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, paddingVertical: 12 }}>
        <Pressable
          onPress={() => router.back()}
          style={{
            width: 40, height: 40, borderRadius: 12,
            borderWidth: 0.5, borderColor: colors.line.DEFAULT,
            backgroundColor: colors.surface.DEFAULT,
            alignItems: 'center', justifyContent: 'center',
          }}
        >
          <Icon name="back" size={20} color={colors.ink.DEFAULT} />
        </Pressable>
        <View style={{ flex: 1, marginLeft: 14 }}>
          <Text style={{ fontSize: 18, fontFamily: 'Geist_500Medium', color: colors.ink.DEFAULT }}>
            {t.medications.title}
          </Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Pressable
            onPress={() => setShowPrefsModal(true)}
            style={{
              width: 40, height: 40, borderRadius: 12,
              borderWidth: 0.5, borderColor: colors.line.DEFAULT,
              backgroundColor: colors.surface.DEFAULT,
              alignItems: 'center', justifyContent: 'center',
            }}
          >
            <Icon name="settings" size={20} color={colors.ink.soft} />
          </Pressable>
          {activeTab === 'medications' && (
            <Pressable
              onPress={() => { setEditingMed(null); setShowMedModal(true); }}
              style={{
                width: 40, height: 40, borderRadius: 12,
                backgroundColor: colors.evergreen.DEFAULT,
                alignItems: 'center', justifyContent: 'center',
              }}
            >
              <Icon name="plus" size={20} color="#FFFFFF" />
            </Pressable>
          )}
        </View>
      </View>

      {/* Tab bar */}
      <View style={{
        flexDirection: 'row', marginHorizontal: 18, marginBottom: 12,
        backgroundColor: colors.line.DEFAULT, borderRadius: 12, padding: 3,
      }}>
        {TABS.map(([tab, label]) => (
          <Pressable
            key={tab}
            onPress={() => setActiveTab(tab)}
            style={{
              flex: 1, paddingVertical: 8, borderRadius: 10, alignItems: 'center',
              backgroundColor: activeTab === tab ? colors.surface.DEFAULT : 'transparent',
            }}
          >
            <Text style={{
              fontSize: 13, fontFamily: 'Geist_500Medium',
              color: activeTab === tab ? colors.evergreen.DEFAULT : colors.ink.faint,
            }}>
              {label}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Exact alarm permission warning (Android 12+) */}
      {!exactAlarmOk && Platform.OS === 'android' && (
        <Pressable
          onPress={() => { openExactAlarmSettings(); }}
          style={{
            marginHorizontal: 18, marginBottom: 10,
            backgroundColor: colors.terracotta.soft,
            borderRadius: 12, borderWidth: 0.5, borderColor: colors.terracotta.DEFAULT + '55',
            padding: 12, flexDirection: 'row', alignItems: 'center', gap: 10,
          }}
        >
          <Text style={{ fontSize: 18 }}>⚠️</Text>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 13, fontFamily: 'Geist_500Medium', color: colors.ink.DEFAULT }}>
              {t.medications.allowAlarms}
            </Text>
            <Text style={{ fontSize: 12, color: colors.ink.soft, marginTop: 2 }}>
              {t.medications.allowAlarmsDesc}
            </Text>
          </View>
          <Icon name="chevron" size={16} color={colors.ink.faint} />
        </Pressable>
      )}

      {/* Content */}
      {activeTab === 'today' && (
        <TodayTab
          nextDue={nextDue}
          countdownMs={countdownMs}
          todaySchedule={todaySchedule}
          medications={medications}
          doseRecords={doseRecords}
          onAdd={() => { setEditingMed(null); setShowMedModal(true); }}
          onTake={(medicationId, scheduleItemId) => recordDose(medicationId, scheduleItemId)}
          onSkip={(medicationId, scheduleItemId) => skipDose(medicationId, scheduleItemId)}
          onSetRecord={(medicationId, scheduleItemId, dateKey, status) =>
            setDoseRecord(medicationId, scheduleItemId, dateKey, status)
          }
          onSnooze={(entry) => {
            snoozeMedNotification(entry.medication, entry.item, notifPrefs).catch(() => {});
            Alert.alert(t.medications.snoozed, t.medications.snoozedMsg);
          }}
        />
      )}
      {activeTab === 'medications' && (
        <MedicationsTab
          medications={medications}
          onAdd={() => { setEditingMed(null); setShowMedModal(true); }}
          onEdit={(med) => { setEditingMed(med); setShowMedModal(true); }}
          onDelete={(id) => {
            Alert.alert(t.medications.deleteAlertTitle, t.medications.deleteAlertMsg, [
              { text: t.medications.cancel, style: 'cancel' },
              {
                text: t.medications.delete, style: 'destructive',
                onPress: () => {
                  const removed = deleteMedication(id);
                  if (removed && removed.notificationIds.length > 0) {
                    cancelMedNotifications(removed.notificationIds).catch(() => {});
                  }
                },
              },
            ]);
          }}
        />
      )}
      {activeTab === 'stats' && (
        <StatsTab medications={medications} doseRecords={doseRecords} />
      )}

      {/* Notification Prefs Modal */}
      <NotifPrefsModal
        visible={showPrefsModal}
        prefs={notifPrefs}
        onClose={() => setShowPrefsModal(false)}
        onChange={(newPrefs) => {
          setNotifPrefs(newPrefs);
          rescheduleAllMedNotifications(
            medications,
            newPrefs,
            (medicationId, ids) => updateNotificationIds(medicationId, ids),
          ).catch(() => {});
        }}
      />

      {/* Add / Edit Medication Modal */}
      <MedFormModal
        visible={showMedModal}
        initialData={editingMed ?? undefined}
        onClose={() => { setShowMedModal(false); setEditingMed(null); }}
        onSave={(data) => {
          if (editingMed) {
            updateMedication(editingMed.id, data);
            cancelMedNotifications(editingMed.notificationIds).catch(() => {});
            const updated: Medication = { ...editingMed, ...data };
            scheduleMedNotifications(updated, notifPrefs)
              .then((ids) => { if (ids.length > 0) updateNotificationIds(editingMed.id, ids); })
              .catch(() => {});
          } else {
            const newId = addMedication(data);
            const med: Medication = { ...data, id: newId, createdAt: Date.now(), notificationIds: [] };
            scheduleMedNotifications(med, notifPrefs)
              .then((ids) => { if (ids.length > 0) updateNotificationIds(newId, ids); })
              .catch(() => {});
          }
          setShowMedModal(false);
          setEditingMed(null);
        }}
      />
    </SafeAreaView>
  );
}

// ─── TODAY TAB ────────────────────────────────────────────────────────────────

function buildHistoryDays(
  medications: Medication[],
  doseRecords: DoseRecord[],
  days = 14,
): { dateKey: string; label: string; entries: TodayEntry[] }[] {
  const now = new Date();
  const dayNames = ['Niedziela', 'Poniedziałek', 'Wtorek', 'Środa', 'Czwartek', 'Piątek', 'Sobota'];
  const result: { dateKey: string; label: string; entries: TodayEntry[] }[] = [];

  for (let d = 1; d <= days; d++) {
    const date = new Date(now);
    date.setDate(date.getDate() - d);
    const dateKey = date.toISOString().slice(0, 10);
    const dayName = d === 1 ? 'Wczoraj' : dayNames[date.getDay()] ?? '';
    const ddmm = `${String(date.getDate()).padStart(2, '0')}.${String(date.getMonth() + 1).padStart(2, '0')}`;
    const label = d === 1 ? `Wczoraj, ${ddmm}` : `${dayName}, ${ddmm}`;
    const entries = getTodaySchedule(medications, doseRecords, dateKey);
    if (entries.length > 0) {
      result.push({ dateKey, label, entries });
    }
  }

  return result;
}

function TodayTab({
  nextDue,
  countdownMs,
  todaySchedule,
  medications,
  doseRecords,
  onAdd,
  onTake,
  onSkip,
  onSetRecord,
  onSnooze,
}: {
  nextDue: ReturnType<typeof getNextDue>;
  countdownMs: number;
  todaySchedule: TodayEntry[];
  medications: Medication[];
  doseRecords: DoseRecord[];
  onAdd: () => void;
  onTake: (medicationId: string, scheduleItemId: string) => void;
  onSkip: (medicationId: string, scheduleItemId: string) => void;
  onSetRecord: (medicationId: string, scheduleItemId: string, dateKey: string, status: 'taken' | 'skipped' | 'none') => void;
  onSnooze: (entry: TodayEntry) => void;
}) {
  const t = useT();
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const [showHistory, setShowHistory] = useState(false);

  function handleTake(entry: TodayEntry) {
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.94, duration: 80, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 120, useNativeDriver: true }),
    ]).start();
    onTake(entry.medication.id, entry.item.id);
  }

  if (medications.length === 0) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 }}>
        <Text style={{ fontSize: 48, marginBottom: 16 }}>💊</Text>
        <Text style={{ fontSize: 17, fontFamily: 'Geist_500Medium', color: colors.ink.DEFAULT, textAlign: 'center', marginBottom: 8 }}>
          {t.medications.noMeds}
        </Text>
        <Text style={{ fontSize: 14, color: colors.ink.faint, textAlign: 'center', marginBottom: 28 }}>
          {t.medications.addMedsHint}
        </Text>
        <Pressable
          onPress={onAdd}
          style={{
            backgroundColor: colors.evergreen.DEFAULT,
            borderRadius: 14,
            paddingHorizontal: 24,
            paddingVertical: 13,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <Icon name="plus" size={18} color="#FFFFFF" />
          <Text style={{ fontSize: 15, fontFamily: 'Geist_500Medium', color: '#FFFFFF' }}>
            {t.medications.addFirst}
          </Text>
        </Pressable>
      </View>
    );
  }

  const typeConf = nextDue ? MED_TYPE_CONFIG[nextDue.medication.type] : null;

  return (
    <ScrollView contentContainerStyle={{ paddingHorizontal: 18, paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
      {/* Next dose card */}
      {nextDue && (
        <Animated.View
          style={{
            backgroundColor: colors.evergreen.DEFAULT,
            borderRadius: 20,
            padding: 22,
            marginBottom: 20,
            overflow: 'hidden',
            transform: [{ scale: scaleAnim }],
          }}
        >
          <View style={{ position: 'absolute', right: -30, top: -30, width: 120, height: 120, borderRadius: 60, backgroundColor: 'rgba(255,255,255,0.05)' }} />
          <View style={{ position: 'absolute', right: 30, bottom: -20, width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.04)' }} />

          <Text style={{ fontSize: 12, fontFamily: 'Geist_500Medium', color: 'rgba(255,255,255,0.6)', letterSpacing: 0.5, marginBottom: 10 }}>
            {t.medications.nextDoseIn}
          </Text>

          <Text style={{ fontSize: 42, fontFamily: 'Newsreader_400Regular', color: '#FFFFFF', letterSpacing: 1, marginBottom: 14 }}>
            {formatCountdown(countdownMs, t.health.nowLabel)}
          </Text>

          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
            <View style={{
              backgroundColor: typeConf?.bgColor ?? 'rgba(255,255,255,0.15)',
              borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, marginRight: 8,
            }}>
              <Text style={{ fontSize: 12 }}>{typeConf?.emoji}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 16, fontFamily: 'Geist_500Medium', color: '#FFFFFF' }}>
                {nextDue.medication.name}
              </Text>
              <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', marginTop: 2 }}>
                {nextDue.item.dosage} · {fmtTime(nextDue.item.hour, nextDue.item.minute)}
              </Text>
            </View>
          </View>

          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Pressable
              onPress={() => {
                const entry = todaySchedule.find(
                  (e) => e.medication.id === nextDue.medication.id && e.item.id === nextDue.item.id,
                );
                if (entry) handleTake(entry);
                else onTake(nextDue.medication.id, nextDue.item.id);
              }}
              style={{
                flex: 1, backgroundColor: '#FFFFFF', borderRadius: 12,
                paddingVertical: 13, alignItems: 'center', flexDirection: 'row',
                justifyContent: 'center', gap: 8,
              }}
            >
              <Icon name="check" size={18} color={colors.evergreen.DEFAULT} strokeWidth={2} />
              <Text style={{ fontSize: 15, fontFamily: 'Geist_500Medium', color: colors.evergreen.DEFAULT }}>
                {t.medications.taken}
              </Text>
            </Pressable>

            <Pressable
              onPress={() => {
                const entry = todaySchedule.find(
                  (e) => e.medication.id === nextDue.medication.id && e.item.id === nextDue.item.id,
                );
                if (entry) onSnooze(entry);
              }}
              style={{
                flex: 1, backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 12,
                paddingVertical: 13, alignItems: 'center', flexDirection: 'row',
                justifyContent: 'center', gap: 8,
              }}
            >
              <Icon name="clock" size={18} color="rgba(255,255,255,0.85)" />
              <Text style={{ fontSize: 15, fontFamily: 'Geist_500Medium', color: 'rgba(255,255,255,0.85)' }}>
                {t.medications.in15min}
              </Text>
            </Pressable>
          </View>
        </Animated.View>
      )}

      {/* Today's schedule */}
      {todaySchedule.length > 0 && (
        <>
          <Text style={{ fontSize: 11, fontFamily: 'Geist_500Medium', color: colors.ink.faint, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 10 }}>
            {t.medications.tabToday}
          </Text>
          <View style={{ gap: 8 }}>
            {todaySchedule.map((entry) => (
              <TodayEntryRow
                key={`${entry.medication.id}-${entry.item.id}`}
                entry={entry}
                onTake={() => onTake(entry.medication.id, entry.item.id)}
                onSkip={() => onSkip(entry.medication.id, entry.item.id)}
              />
            ))}
          </View>
        </>
      )}

      {/* History toggle */}
      <Pressable
        onPress={() => setShowHistory((v) => !v)}
        style={{
          marginTop: 24, flexDirection: 'row', alignItems: 'center', gap: 8,
          paddingVertical: 12, paddingHorizontal: 14,
          backgroundColor: colors.surface.DEFAULT,
          borderRadius: 12, borderWidth: 0.5, borderColor: colors.line.DEFAULT,
          justifyContent: 'center',
        }}
      >
        <Icon name="clock" size={16} color={colors.ink.soft} />
        <Text style={{ fontSize: 14, fontFamily: 'Geist_500Medium', color: colors.ink.soft }}>
          {showHistory ? t.medications.hideHistory : t.medications.showHistory}
        </Text>
        <View style={{ transform: [{ rotate: showHistory ? '90deg' : '-90deg' }] }}>
          <Icon name="chevron" size={14} color={colors.ink.faint} />
        </View>
      </Pressable>

      {/* History section */}
      {showHistory && (
        <HistorySection
          medications={medications}
          doseRecords={doseRecords}
          onSetRecord={onSetRecord}
          t={t}
        />
      )}
    </ScrollView>
  );
}

function HistorySection({
  medications,
  doseRecords,
  onSetRecord,
  t,
}: {
  medications: Medication[];
  doseRecords: DoseRecord[];
  onSetRecord: (medicationId: string, scheduleItemId: string, dateKey: string, status: 'taken' | 'skipped' | 'none') => void;
  t: ReturnType<typeof useT>;
}) {
  const days = buildHistoryDays(medications, doseRecords, 30);

  if (days.length === 0) {
    return (
      <Text style={{ fontSize: 14, color: colors.ink.faint, textAlign: 'center', marginTop: 16, marginBottom: 8 }}>
        {t.medications.historyEmpty}
      </Text>
    );
  }

  return (
    <View style={{ marginTop: 20, gap: 20 }}>
      {days.map(({ dateKey, label, entries }) => (
        <View key={dateKey}>
          <Text style={{
            fontSize: 11, fontFamily: 'Geist_500Medium', color: colors.ink.faint,
            letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 8,
          }}>
            {label}
          </Text>
          <View style={{ gap: 6 }}>
            {entries.map((entry) => (
              <HistoryEntryRow
                key={`${entry.medication.id}-${entry.item.id}-${dateKey}`}
                entry={entry}
                dateKey={dateKey}
                onSetRecord={onSetRecord}
              />
            ))}
          </View>
        </View>
      ))}
    </View>
  );
}

function HistoryEntryRow({
  entry,
  dateKey,
  onSetRecord,
}: {
  entry: TodayEntry;
  dateKey: string;
  onSetRecord: (medicationId: string, scheduleItemId: string, dateKey: string, status: 'taken' | 'skipped' | 'none') => void;
}) {
  const typeConf = MED_TYPE_CONFIG[entry.medication.type];

  function toggleTaken() {
    if (entry.taken) {
      onSetRecord(entry.medication.id, entry.item.id, dateKey, 'none');
    } else {
      onSetRecord(entry.medication.id, entry.item.id, dateKey, 'taken');
    }
  }

  function toggleSkipped() {
    if (entry.skipped) {
      onSetRecord(entry.medication.id, entry.item.id, dateKey, 'none');
    } else {
      onSetRecord(entry.medication.id, entry.item.id, dateKey, 'skipped');
    }
  }

  return (
    <View style={{
      backgroundColor: colors.surface.DEFAULT,
      borderRadius: 12, borderWidth: 0.5,
      borderColor: entry.taken
        ? colors.success + '44'
        : entry.skipped
        ? colors.line.DEFAULT
        : colors.line.DEFAULT,
      padding: 12, flexDirection: 'row', alignItems: 'center', gap: 10,
    }}>
      <Text style={{ fontSize: 12, fontFamily: 'Geist_500Medium', color: colors.ink.faint, width: 40 }}>
        {fmtTime(entry.item.hour, entry.item.minute)}
      </Text>

      <View style={{
        width: 28, height: 28, borderRadius: 7,
        backgroundColor: typeConf.bgColor,
        alignItems: 'center', justifyContent: 'center',
      }}>
        <Text style={{ fontSize: 13 }}>{typeConf.emoji}</Text>
      </View>

      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 13, fontFamily: 'Geist_500Medium', color: colors.ink.DEFAULT }}>
          {entry.medication.name}
        </Text>
        <Text style={{ fontSize: 11, color: colors.ink.faint, marginTop: 1 }}>
          {entry.item.dosage}
        </Text>
      </View>

      <View style={{ flexDirection: 'row', gap: 6 }}>
        {/* Pominięto */}
        <Pressable
          onPress={toggleSkipped}
          style={{
            width: 30, height: 30, borderRadius: 8,
            borderWidth: 1,
            borderColor: entry.skipped ? colors.ink.faint : colors.line.DEFAULT,
            backgroundColor: entry.skipped ? colors.ink.faint + '22' : 'transparent',
            alignItems: 'center', justifyContent: 'center',
          }}
        >
          <Icon name="minus" size={14} color={entry.skipped ? colors.ink.DEFAULT : colors.ink.faint} />
        </Pressable>
        {/* Zażyte */}
        <Pressable
          onPress={toggleTaken}
          style={{
            width: 30, height: 30, borderRadius: 8,
            borderWidth: 1,
            borderColor: entry.taken ? colors.success : colors.line.DEFAULT,
            backgroundColor: entry.taken ? colors.success + '22' : 'transparent',
            alignItems: 'center', justifyContent: 'center',
          }}
        >
          <Icon name="check" size={14} color={entry.taken ? colors.success : colors.ink.faint} strokeWidth={2} />
        </Pressable>
      </View>
    </View>
  );
}

function TodayEntryRow({
  entry,
  onTake,
  onSkip,
}: {
  entry: TodayEntry;
  onTake: () => void;
  onSkip: () => void;
}) {
  const typeConf = MED_TYPE_CONFIG[entry.medication.type];
  const now = new Date();
  const isNext =
    !entry.taken &&
    !entry.skipped &&
    entry.scheduledAt > now;

  return (
    <View
      style={{
        backgroundColor: colors.surface.DEFAULT,
        borderRadius: 14,
        borderWidth: 0.5,
        borderColor: entry.taken
          ? colors.success + '44'
          : entry.overdue
          ? colors.danger + '33'
          : colors.line.DEFAULT,
        padding: 14,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
      }}
    >
      <Text style={{ fontSize: 13, fontFamily: 'Geist_500Medium', color: colors.ink.faint, width: 44 }}>
        {fmtTime(entry.item.hour, entry.item.minute)}
      </Text>

      <View style={{
        width: 32, height: 32, borderRadius: 8,
        backgroundColor: typeConf.bgColor,
        alignItems: 'center', justifyContent: 'center',
      }}>
        <Text style={{ fontSize: 15 }}>{typeConf.emoji}</Text>
      </View>

      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 14, fontFamily: 'Geist_500Medium', color: colors.ink.DEFAULT }}>
          {entry.medication.name}
        </Text>
        <Text style={{ fontSize: 12, color: colors.ink.faint, marginTop: 1 }}>
          {entry.item.dosage}
        </Text>
      </View>

      {entry.taken ? (
        <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: colors.success + '22', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="check" size={16} color={colors.success} strokeWidth={2} />
        </View>
      ) : entry.skipped ? (
        <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: colors.ink.faint + '22', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="minus" size={16} color={colors.ink.faint} />
        </View>
      ) : (
        <View style={{ flexDirection: 'row', gap: 6 }}>
          <Pressable
            onPress={onSkip}
            style={{
              width: 32, height: 32, borderRadius: 10,
              borderWidth: 0.5, borderColor: colors.line.DEFAULT,
              alignItems: 'center', justifyContent: 'center',
            }}
          >
            <Icon name="minus" size={16} color={colors.ink.faint} />
          </Pressable>
          <Pressable
            onPress={onTake}
            style={{
              width: 32, height: 32, borderRadius: 10,
              backgroundColor: colors.evergreen.DEFAULT,
              alignItems: 'center', justifyContent: 'center',
            }}
          >
            <Icon name="check" size={16} color="#FFFFFF" strokeWidth={2} />
          </Pressable>
        </View>
      )}
    </View>
  );
}

// ─── MEDICATIONS TAB ──────────────────────────────────────────────────────────

function MedicationsTab({
  medications,
  onAdd,
  onEdit,
  onDelete,
}: {
  medications: Medication[];
  onAdd: () => void;
  onEdit: (med: Medication) => void;
  onDelete: (id: string) => void;
}) {
  const t = useT();

  if (medications.length === 0) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 }}>
        <Text style={{ fontSize: 48, marginBottom: 16 }}>🗂️</Text>
        <Text style={{ fontSize: 17, fontFamily: 'Geist_500Medium', color: colors.ink.DEFAULT, textAlign: 'center', marginBottom: 8 }}>
          {t.medications.noMedsOnList}
        </Text>
        <Text style={{ fontSize: 14, color: colors.ink.faint, textAlign: 'center', marginBottom: 28 }}>
          {t.medications.addMedLong}
        </Text>
        <Pressable
          onPress={onAdd}
          style={{
            backgroundColor: colors.evergreen.DEFAULT,
            borderRadius: 14, paddingHorizontal: 24, paddingVertical: 13,
            flexDirection: 'row', alignItems: 'center', gap: 8,
          }}
        >
          <Icon name="plus" size={18} color="#FFFFFF" />
          <Text style={{ fontSize: 15, fontFamily: 'Geist_500Medium', color: '#FFFFFF' }}>{t.medications.addMed}</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={{ paddingHorizontal: 18, paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
      <View style={{ gap: 10 }}>
        {medications.map((med) => (
          <MedicationCard key={med.id} medication={med} onEdit={() => onEdit(med)} onDelete={() => onDelete(med.id)} />
        ))}
      </View>

      <Pressable
        onPress={onAdd}
        style={{
          marginTop: 16, borderRadius: 14, borderWidth: 1.5,
          borderColor: colors.evergreen.DEFAULT, borderStyle: 'dashed',
          paddingVertical: 14, alignItems: 'center', flexDirection: 'row',
          justifyContent: 'center', gap: 8,
        }}
      >
        <Icon name="plus" size={18} color={colors.evergreen.DEFAULT} />
        <Text style={{ fontSize: 15, fontFamily: 'Geist_500Medium', color: colors.evergreen.DEFAULT }}>
          {t.medications.addMed}
        </Text>
      </Pressable>
    </ScrollView>
  );
}

function MedicationCard({
  medication,
  onEdit,
  onDelete,
}: {
  medication: Medication;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const typeConf = MED_TYPE_CONFIG[medication.type];

  return (
    <View
      style={{
        backgroundColor: colors.surface.DEFAULT,
        borderRadius: 16, borderWidth: 0.5, borderColor: colors.line.DEFAULT,
        padding: 16,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
        <View style={{
          width: 44, height: 44, borderRadius: 12,
          backgroundColor: typeConf.bgColor,
          alignItems: 'center', justifyContent: 'center',
          marginRight: 12,
        }}>
          <Text style={{ fontSize: 22 }}>{typeConf.emoji}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 15, fontFamily: 'Geist_500Medium', color: colors.ink.DEFAULT }}>
            {medication.name}
          </Text>
          <Text style={{ fontSize: 12, color: colors.ink.faint, marginTop: 2 }}>
            {typeConf.label}
          </Text>
          {medication.dosageNote ? (
            <Text style={{ fontSize: 12, color: colors.evergreen.DEFAULT, marginTop: 3 }}>
              {medication.dosageNote}
            </Text>
          ) : null}
        </View>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Pressable
            onPress={onEdit}
            style={{
              width: 34, height: 34, borderRadius: 10,
              borderWidth: 0.5, borderColor: colors.line.DEFAULT,
              alignItems: 'center', justifyContent: 'center',
            }}
          >
            <Icon name="pencil" size={15} color={colors.ink.soft} />
          </Pressable>
          <Pressable
            onPress={onDelete}
            style={{
              width: 34, height: 34, borderRadius: 10,
              borderWidth: 0.5, borderColor: colors.line.DEFAULT,
              alignItems: 'center', justifyContent: 'center',
            }}
          >
            <Icon name="trash" size={16} color={colors.danger} />
          </Pressable>
        </View>
      </View>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
        {medication.schedule.map((item) => (
          <View
            key={item.id}
            style={{
              backgroundColor: colors.cream.DEFAULT,
              borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5,
              flexDirection: 'row', alignItems: 'center', gap: 5,
            }}
          >
            <Icon name="clock" size={12} color={colors.ink.faint} />
            <Text style={{ fontSize: 12, color: colors.ink.soft }}>
              {fmtTime(item.hour, item.minute)} · {item.dosage}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

// ─── STATS TAB ────────────────────────────────────────────────────────────────

function StatsTab({
  medications,
  doseRecords,
}: {
  medications: Medication[];
  doseRecords: ReturnType<typeof useMedicationsStore.getState>['doseRecords'];
}) {
  const t = useT();
  const todayPct = getAdherence(medications, doseRecords, 1);
  const weekPct = getAdherence(medications, doseRecords, 7);
  const monthPct = getAdherence(medications, doseRecords, 30);
  const streak = getStreakDays(medications, doseRecords);
  const chartData = getChartData(medications, doseRecords);

  if (medications.length === 0) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 }}>
        <Text style={{ fontSize: 48, marginBottom: 16 }}>📊</Text>
        <Text style={{ fontSize: 17, fontFamily: 'Geist_500Medium', color: colors.ink.DEFAULT, textAlign: 'center' }}>
          {t.common.noData}
        </Text>
        <Text style={{ fontSize: 14, color: colors.ink.faint, textAlign: 'center', marginTop: 8 }}>
          {t.medications.statsEmpty}
        </Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={{ paddingHorizontal: 18, paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
      {/* Streak banner */}
      {streak > 0 && (
        <View style={{
          backgroundColor: colors.terracotta.soft,
          borderRadius: 16, padding: 16, marginBottom: 20,
          flexDirection: 'row', alignItems: 'center', gap: 12,
        }}>
          <Text style={{ fontSize: 30 }}>🔥</Text>
          <View>
            <Text style={{ fontSize: 22, fontFamily: 'Newsreader_400Regular', color: colors.ink.DEFAULT }}>
              {t.medications.streak(streak)}
            </Text>
            <Text style={{ fontSize: 13, color: colors.ink.soft, marginTop: 2 }}>
              {t.medications.streakBannerMsg}
            </Text>
          </View>
        </View>
      )}

      {/* Adherence cards */}
      <Text style={{ fontSize: 11, fontFamily: 'Geist_500Medium', color: colors.ink.faint, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 10 }}>
        {t.medications.adherence}
      </Text>
      <View style={{ flexDirection: 'row', gap: 10, marginBottom: 24 }}>
        <StatCard label={t.medications.tabToday} value={todayPct} />
        <StatCard label={t.common.week} value={weekPct} />
        <StatCard label={t.medications.statLabelMonth} value={monthPct} />
      </View>

      {/* Chart */}
      <Text style={{ fontSize: 11, fontFamily: 'Geist_500Medium', color: colors.ink.faint, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 12 }}>
        {t.medications.last7days}
      </Text>
      <View style={{
        backgroundColor: colors.surface.DEFAULT, borderRadius: 16,
        borderWidth: 0.5, borderColor: colors.line.DEFAULT,
        padding: 16, marginBottom: 24,
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: 80, gap: 6 }}>
          {chartData.map((d, i) => (
            <View key={i} style={{ flex: 1, alignItems: 'center' }}>
              <View style={{
                width: '100%',
                height: Math.max(4, (d.value / 100) * 64),
                backgroundColor: d.value >= 90 ? colors.success : d.value >= 60 ? colors.warning : colors.danger,
                borderRadius: 4,
              }} />
            </View>
          ))}
        </View>
        <View style={{ flexDirection: 'row', marginTop: 6, gap: 6 }}>
          {chartData.map((d, i) => (
            <View key={i} style={{ flex: 1, alignItems: 'center' }}>
              <Text style={{ fontSize: 10, color: colors.ink.faint }}>{d.label}</Text>
            </View>
          ))}
        </View>
      </View>

    </ScrollView>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  const color =
    value >= 90 ? colors.success : value >= 60 ? colors.warning : colors.danger;

  return (
    <View style={{
      flex: 1,
      backgroundColor: colors.surface.DEFAULT,
      borderRadius: 14, borderWidth: 0.5, borderColor: colors.line.DEFAULT,
      padding: 14, alignItems: 'center',
    }}>
      <Text style={{ fontSize: 26, fontFamily: 'Newsreader_400Regular', color }}>{value}%</Text>
      <Text style={{ fontSize: 12, color: colors.ink.faint, marginTop: 3 }}>{label}</Text>
    </View>
  );
}

// ─── NOTIF PREFS MODAL ───────────────────────────────────────────────────────

function NotifPrefsModal({
  visible,
  prefs,
  onClose,
  onChange,
}: {
  visible: boolean;
  prefs: NotifPrefs;
  onClose: () => void;
  onChange: (prefs: NotifPrefs) => void;
}) {
  const t = useT();

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: colors.cream.DEFAULT }}>
        {/* Header */}
        <View style={{
          flexDirection: 'row', alignItems: 'center',
          paddingHorizontal: 18, paddingVertical: 14,
          borderBottomWidth: 0.5, borderBottomColor: colors.line.DEFAULT,
        }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 16, fontFamily: 'Geist_500Medium', color: colors.ink.DEFAULT }}>
              {t.medications.reminderSettings}
            </Text>
          </View>
          <Pressable onPress={onClose}>
            <Text style={{ fontSize: 15, fontFamily: 'Geist_500Medium', color: colors.evergreen.DEFAULT }}>
              {t.common.done}
            </Text>
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={{ paddingHorizontal: 18, paddingTop: 24, paddingBottom: 60 }}>
          {/* Info banner */}
          <View style={{
            backgroundColor: colors.sage.soft,
            borderRadius: 14, padding: 14, marginBottom: 24,
            flexDirection: 'row', alignItems: 'flex-start', gap: 10,
          }}>
            <Text style={{ fontSize: 20, marginTop: 1 }}>🔔</Text>
            <Text style={{ flex: 1, fontSize: 13, color: colors.ink.soft, lineHeight: 19 }}>
              {t.medications.reminderBanner}
            </Text>
          </View>

          {/* Toggles */}
          <Text style={[labelStyle, { marginBottom: 12 }]}>{t.medications.notificationsLabel}</Text>

          <View style={{
            backgroundColor: colors.surface.DEFAULT,
            borderRadius: 16, borderWidth: 0.5, borderColor: colors.line.DEFAULT,
            overflow: 'hidden',
          }}>
            {/* Sound row */}
            <View style={{
              flexDirection: 'row', alignItems: 'center',
              paddingHorizontal: 16, paddingVertical: 16,
              borderBottomWidth: 0.5, borderBottomColor: colors.line.DEFAULT,
            }}>
              <View style={{
                width: 38, height: 38, borderRadius: 10,
                backgroundColor: prefs.sound ? colors.sage.soft : colors.cream.DEFAULT,
                alignItems: 'center', justifyContent: 'center',
                marginRight: 12,
              }}>
                <Text style={{ fontSize: 18 }}>{prefs.sound ? '🔔' : '🔕'}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 15, fontFamily: 'Geist_500Medium', color: colors.ink.DEFAULT }}>
                  {t.medications.sound}
                </Text>
                <Text style={{ fontSize: 12, color: colors.ink.faint, marginTop: 2 }}>
                  {t.medications.soundDesc}
                </Text>
              </View>
              <Switch
                value={prefs.sound}
                onValueChange={(v) => onChange({ ...prefs, sound: v })}
                trackColor={{ false: colors.line.DEFAULT, true: colors.evergreen.DEFAULT }}
                thumbColor="#FFFFFF"
              />
            </View>

            {/* Vibration row */}
            <View style={{
              flexDirection: 'row', alignItems: 'center',
              paddingHorizontal: 16, paddingVertical: 16,
            }}>
              <View style={{
                width: 38, height: 38, borderRadius: 10,
                backgroundColor: prefs.vibration ? colors.sage.soft : colors.cream.DEFAULT,
                alignItems: 'center', justifyContent: 'center',
                marginRight: 12,
              }}>
                <Text style={{ fontSize: 18 }}>{prefs.vibration ? '📳' : '📴'}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 15, fontFamily: 'Geist_500Medium', color: colors.ink.DEFAULT }}>
                  {t.medications.vibration}
                </Text>
                <Text style={{ fontSize: 12, color: colors.ink.faint, marginTop: 2 }}>
                  {t.medications.vibrationDesc}
                </Text>
              </View>
              <Switch
                value={prefs.vibration}
                onValueChange={(v) => onChange({ ...prefs, vibration: v })}
                trackColor={{ false: colors.line.DEFAULT, true: colors.evergreen.DEFAULT }}
                thumbColor="#FFFFFF"
              />
            </View>
          </View>

          {/* Current mode summary */}
          <View style={{
            marginTop: 20, backgroundColor: colors.surface.DEFAULT,
            borderRadius: 14, borderWidth: 0.5, borderColor: colors.line.DEFAULT,
            padding: 14,
          }}>
            <Text style={{ fontSize: 12, fontFamily: 'Geist_500Medium', color: colors.ink.faint, marginBottom: 8 }}>
              {t.medications.currentMode}
            </Text>
            <Text style={{ fontSize: 14, color: colors.ink.DEFAULT }}>
              {prefs.sound && prefs.vibration
                ? t.medications.modeAllOn
                : prefs.sound
                ? t.medications.modeSoundOnly
                : prefs.vibration
                ? t.medications.modeVibrOnly
                : t.medications.modeSilent}
            </Text>
          </View>

          {Platform.OS === 'android' && (
            <Text style={{ fontSize: 12, color: colors.ink.faint, textAlign: 'center', marginTop: 20, lineHeight: 18 }}>
              {t.medications.androidRebuildNote}
            </Text>
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

// ─── ADD / EDIT MEDICATION MODAL ──────────────────────────────────────────────

const MED_TYPES: MedType[] = ['supplement', 'prescription', 'pregnancy_vitamin', 'insulin', 'child_med'];

function MedFormModal({
  visible,
  initialData,
  onClose,
  onSave,
}: {
  visible: boolean;
  initialData?: Medication;
  onClose: () => void;
  onSave: (data: Omit<Medication, 'id' | 'createdAt' | 'notificationIds'>) => void;
}) {
  const t = useT();
  const isEditing = !!initialData;

  const [name, setName] = useState('');
  const [type, setType] = useState<MedType>('supplement');
  const [dosageNote, setDosageNote] = useState('');
  const [entries, setEntries] = useState<ScheduleFormEntry[]>([{ time: '08:00', dosage: t.medications.dosagePlaceholder }]);
  const dosageRefs = useRef<Record<number, TextInput | null>>({});

  useEffect(() => {
    if (visible && initialData) {
      setName(initialData.name);
      setType(initialData.type);
      setDosageNote(initialData.dosageNote ?? '');
      setEntries(
        initialData.schedule.map((item) => ({
          time: fmtTime(item.hour, item.minute),
          dosage: item.dosage,
        })),
      );
    } else if (visible && !initialData) {
      setName('');
      setType('supplement');
      setDosageNote('');
      setEntries([{ time: '08:00', dosage: t.medications.dosagePlaceholder }]);
    }
  }, [visible, initialData]);

  function reset() {
    setName('');
    setType('supplement');
    setDosageNote('');
    setEntries([{ time: '08:00', dosage: t.medications.dosagePlaceholder }]);
  }

  function handleClose() {
    reset();
    onClose();
  }

  function addEntry() {
    setEntries((e) => [...e, { time: '', dosage: '' }]);
  }

  function updateEntry(i: number, field: keyof ScheduleFormEntry, value: string) {
    setEntries((e) => e.map((item, idx) => (idx === i ? { ...item, [field]: value } : item)));
  }

  function removeEntry(i: number) {
    setEntries((e) => e.filter((_, idx) => idx !== i));
  }

  function handleTimeChange(i: number, raw: string, prevTime: string) {
    const prevDigits = prevTime.replace(/\D/g, '');
    const rawDigits = raw.replace(/\D/g, '').slice(0, 4);

    let formatted: string;
    if (rawDigits.length <= 2) {
      formatted = rawDigits;
      if (rawDigits.length === 2 && prevDigits.length <= 1) {
        const h = parseInt(rawDigits, 10);
        if (h >= 0 && h <= 23) {
          formatted = rawDigits + ':';
        }
      }
    } else {
      formatted = `${rawDigits.slice(0, 2)}:${rawDigits.slice(2, 4)}`;
      if (rawDigits.length === 4 && prevDigits.length < 4) {
        dosageRefs.current[i]?.focus();
      }
    }

    updateEntry(i, 'time', formatted);
  }

  function handleSave() {
    if (!name.trim()) {
      Alert.alert(t.medications.fillNameTitle, t.medications.fillNameMsg);
      return;
    }
    if (entries.length === 0) {
      Alert.alert(t.medications.addTime, t.medications.addTimeMsg);
      return;
    }

    const schedule: Medication['schedule'] = [];
    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];
      if (!entry) continue;
      const parsed = parseTime(entry.time);
      if (!parsed) {
        Alert.alert(t.medications.invalidTimeTitle, t.medications.invalidTimeMsg(i + 1));
        return;
      }
      if (!entry.dosage.trim()) {
        Alert.alert(t.medications.fillDoseTitle, t.medications.fillDoseMsg(i + 1));
        return;
      }
      schedule.push({
        id: `${Date.now()}-${i}`,
        hour: parsed.hour,
        minute: parsed.minute,
        dosage: entry.dosage.trim(),
      });
    }

    onSave({ name: name.trim(), type, schedule, dosageNote: dosageNote.trim() || undefined });
    reset();
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={handleClose}>
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: colors.cream.DEFAULT }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <SafeAreaView edges={['top']} style={{ flex: 1 }}>
          {/* Modal header */}
          <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, paddingVertical: 14 }}>
            <Pressable onPress={handleClose}>
              <Text style={{ fontSize: 15, color: colors.ink.faint }}>{t.medications.cancel}</Text>
            </Pressable>
            <Text style={{ flex: 1, textAlign: 'center', fontSize: 16, fontFamily: 'Geist_500Medium', color: colors.ink.DEFAULT }}>
              {isEditing ? t.medications.edit : t.medications.newMed}
            </Text>
            <Pressable onPress={handleSave}>
              <Text style={{ fontSize: 15, fontFamily: 'Geist_500Medium', color: colors.evergreen.DEFAULT }}>
                {t.medications.save}
              </Text>
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={{ paddingHorizontal: 18, paddingBottom: 60 }} showsVerticalScrollIndicator={false}>
            {/* Name */}
            <Text style={labelStyle}>{t.medications.medName}</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder={t.medications.medNamePlaceholder}
              placeholderTextColor={colors.ink.faint}
              style={inputStyle}
              autoFocus
            />

            {/* Dosage note */}
            <Text style={[labelStyle, { marginTop: 18 }]}>{t.medications.dosageNoteLabel}</Text>
            <TextInput
              value={dosageNote}
              onChangeText={setDosageNote}
              placeholder={t.medications.dosageNotePlaceholder}
              placeholderTextColor={colors.ink.faint}
              style={[inputStyle, { minHeight: 52 }]}
              multiline
              returnKeyType="done"
              blurOnSubmit
            />

            {/* Type */}
            <Text style={[labelStyle, { marginTop: 20 }]}>{t.medications.type}</Text>
            <View style={{ gap: 8 }}>
              {MED_TYPES.map((medType) => {
                const cfg = MED_TYPE_CONFIG[medType];
                return (
                  <Pressable
                    key={medType}
                    onPress={() => setType(medType)}
                    style={{
                      flexDirection: 'row', alignItems: 'center', gap: 12,
                      backgroundColor: type === medType ? colors.evergreen.DEFAULT : colors.surface.DEFAULT,
                      borderRadius: 12, borderWidth: 0.5,
                      borderColor: type === medType ? colors.evergreen.DEFAULT : colors.line.DEFAULT,
                      padding: 12,
                    }}
                  >
                    <View style={{
                      width: 36, height: 36, borderRadius: 10,
                      backgroundColor: type === medType ? 'rgba(255,255,255,0.18)' : cfg.bgColor,
                      alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Text style={{ fontSize: 18 }}>{cfg.emoji}</Text>
                    </View>
                    <Text style={{
                      fontSize: 14, fontFamily: 'Geist_500Medium',
                      color: type === medType ? '#FFFFFF' : colors.ink.DEFAULT,
                    }}>
                      {cfg.label}
                    </Text>
                    {type === medType && (
                      <View style={{ marginLeft: 'auto' }}>
                        <Icon name="check" size={16} color="#FFFFFF" strokeWidth={2} />
                      </View>
                    )}
                  </Pressable>
                );
              })}
            </View>

            {/* Schedule */}
            <Text style={[labelStyle, { marginTop: 24 }]}>{t.medications.doseSchedule}</Text>
            <View style={{ gap: 8 }}>
              {entries.map((entry, i) => (
                <View
                  key={i}
                  style={{
                    backgroundColor: colors.surface.DEFAULT,
                    borderRadius: 12, borderWidth: 0.5, borderColor: colors.line.DEFAULT,
                    padding: 12, flexDirection: 'row', alignItems: 'center', gap: 10,
                  }}
                >
                  <View style={{ alignItems: 'center', justifyContent: 'center', marginRight: 2 }}>
                    <Icon name="clock" size={16} color={colors.ink.faint} />
                  </View>
                  <TextInput
                    value={entry.time}
                    onChangeText={(v) => handleTimeChange(i, v, entry.time)}
                    placeholder="08:00"
                    placeholderTextColor={colors.ink.faint}
                    keyboardType="numeric"
                    maxLength={5}
                    style={{
                      width: 58, fontSize: 15, fontFamily: 'Geist_500Medium',
                      color: colors.ink.DEFAULT,
                    }}
                  />
                  <View style={{ width: 1, height: 20, backgroundColor: colors.line.DEFAULT }} />
                  <TextInput
                    ref={(r) => { dosageRefs.current[i] = r; }}
                    value={entry.dosage}
                    onChangeText={(v) => updateEntry(i, 'dosage', v)}
                    placeholder={t.medications.dosagePlaceholder}
                    placeholderTextColor={colors.ink.faint}
                    style={{ flex: 1, fontSize: 14, color: colors.ink.DEFAULT }}
                    returnKeyType="done"
                  />
                  {entries.length > 1 && (
                    <Pressable onPress={() => removeEntry(i)} hitSlop={8}>
                      <Icon name="cross" size={16} color={colors.ink.faint} />
                    </Pressable>
                  )}
                </View>
              ))}
            </View>

            <Pressable
              onPress={addEntry}
              style={{
                marginTop: 8, flexDirection: 'row', alignItems: 'center', gap: 8,
                paddingVertical: 12, paddingHorizontal: 14,
                backgroundColor: colors.surface.DEFAULT,
                borderRadius: 12, borderWidth: 0.5,
                borderColor: colors.line.DEFAULT, borderStyle: 'dashed',
                justifyContent: 'center',
              }}
            >
              <Icon name="plus" size={16} color={colors.evergreen.DEFAULT} />
              <Text style={{ fontSize: 14, fontFamily: 'Geist_500Medium', color: colors.evergreen.DEFAULT }}>
                {t.medications.addTime}
              </Text>
            </Pressable>
          </ScrollView>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── SHARED STYLES ────────────────────────────────────────────────────────────

const labelStyle = {
  fontSize: 11,
  fontFamily: 'Geist_500Medium' as const,
  color: colors.ink.faint,
  letterSpacing: 0.5,
  textTransform: 'uppercase' as const,
  marginBottom: 8,
};

const inputStyle = {
  backgroundColor: colors.surface.DEFAULT,
  borderRadius: 12,
  borderWidth: 0.5,
  borderColor: colors.line.DEFAULT,
  paddingHorizontal: 14,
  paddingVertical: 13,
  fontSize: 15,
  color: colors.ink.DEFAULT,
};
