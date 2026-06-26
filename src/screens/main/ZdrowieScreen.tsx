import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';

import { Icon, type IconName } from '@/components/ui/Icon';
import { MainScreenShell } from '@/components/layout/MainScreenShell';
import { useTrackersStore } from '@/stores/trackers';
import { useNotesStore } from '@/stores/notes';
import { useProfileStore } from '@/stores/profile';
import { useMedicationsStore, getNextDue } from '@/stores/medications';
import { colors } from '@/theme/tokens';
import { differenceInDays } from 'date-fns';
import { useT } from '@/i18n';

interface ToolItem {
  id: string;
  icon: IconName;
  title: string;
  note: () => string;
  bg: string;
  fg: string;
  route: string;
}

const pad = (n: number) => String(n).padStart(2, '0');

function fmtCountdown(
  ms: number,
  t: Pick<ReturnType<typeof useT>['health'], 'nowLabel' | 'countdownHoursMin' | 'countdownMin'>,
): string {
  if (ms <= 0) return t.nowLabel;
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  if (h > 0) return t.countdownHoursMin(h, pad(m));
  return t.countdownMin(m);
}

export default function ZdrowieScreen() {
  const router = useRouter();
  const trackers = useTrackersStore();
  const notes = useNotesStore();
  const profile = useProfileStore();
  const { medications } = useMedicationsStore();
  const [tick, setTick] = useState(0);
  const t = useT();

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 60_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => { trackers.initVaccinations(); }, []);

  const todayIso = new Date().toISOString().slice(0, 10);
  const activeNotes = notes.notes.filter((n) => !n.done).length;
  const todayKicks = trackers.kickSessions
    .filter((s) => s.date === todayIso)
    .reduce((sum, s) => sum + s.kicks.length, 0);
  const todayFeedings = trackers.feedingSessions.filter(
    (f) => new Date(f.startedAt).toISOString().slice(0, 10) === todayIso
  ).length;
  const doneVax = trackers.vaccinations.filter((v) => v.done).length;
  const totalVax = trackers.vaccinations.length;
  const bumpCount = trackers.bumpEntries.length;
  const testCount = trackers.testResults.length;
  const albumCount = trackers.albumPhotos.length;

  const currentWeek = (() => {
    const ref = profile.childDueDate;
    if (!ref) return null;
    try {
      const daysLeft = differenceInDays(new Date(ref), new Date());
      const w = 40 - Math.round(daysLeft / 7);
      return Math.max(1, Math.min(42, w));
    } catch { return null; }
  })();

  const n = t.health.notes;
  const pregnancy: ToolItem[] = [
    {
      id: 'tygodnie', icon: 'baby', title: t.health.tools.pregnancyWeek,
      note: () => currentWeek ? n.pregnancyWeekNote(currentWeek) : n.browse,
      bg: '#DEE8DD', fg: '#41614C', route: '/tygodnie',
    },
    {
      id: 'kalkulator', icon: 'calendar', title: t.health.tools.dueDate,
      note: () => n.dueMethod,
      bg: '#F6E1D2', fg: '#A65A3C', route: '/kalkulator',
    },
    {
      id: 'kopniecia', icon: 'foot', title: t.health.tools.kicks,
      note: () => trackers.activeKickSessionId ? n.activeSession : todayKicks > 0 ? n.kicksToday(todayKicks) : n.startSession,
      bg: '#F2E8CC', fg: '#8A6E2E', route: '/tracker/kopniecia',
    },
    {
      id: 'skurcze', icon: 'stopwatch', title: t.health.tools.contractions,
      note: () => trackers.activeContractionSessionId ? n.contractionActive : n.ready,
      bg: '#F3DDDD', fg: '#A14C4E', route: '/tracker/skurcze',
    },
    {
      id: 'wyniki', icon: 'flask', title: t.health.tools.testResults,
      note: () => testCount > 0 ? n.resultsCount(testCount) : n.addResults,
      bg: '#DCE5EA', fg: '#436673', route: '/tracker/wyniki',
    },
    {
      id: 'badania', icon: 'clipboard', title: t.health.tools.tests,
      note: () => n.checklistLabel,
      bg: '#E8E1ED', fg: '#6C5A80', route: '/tracker/badania',
    },
    {
      id: 'album', icon: 'camera', title: t.health.tools.bellyAlbum,
      note: () => albumCount > 0 ? n.photosCount(albumCount) : n.addPhotos,
      bg: '#EDE6D7', fg: '#7E6B4F', route: '/tracker/album',
    },
    {
      id: 'brzuszek', icon: 'journal', title: t.health.tools.pregnancyDiary,
      note: () => bumpCount > 0 ? n.entriesCount(bumpCount) : n.startWriting,
      bg: '#D8E7E1', fg: '#3D6B5D', route: '/tracker/brzuszek',
    },
  ];

  const postpartum: ToolItem[] = [
    {
      id: 'karmienie', icon: 'bottle', title: t.health.tools.feeding,
      note: () => trackers.activeFeedingSessionId ? n.feedingActive : todayFeedings > 0 ? n.feedingsToday(todayFeedings) : n.start,
      bg: '#F4E0D3', fg: '#A65A3C', route: '/tracker/karmienie',
    },
    {
      id: 'szczepienia', icon: 'syringe', title: t.health.tools.vaccinations,
      note: () => totalVax > 0 ? n.vaccinationsDone(doneVax, totalVax) : n.load,
      bg: '#DDE9E2', fg: '#3E6A5E', route: '/tracker/szczepienia',
    },
    {
      id: 'notatki', icon: 'note', title: t.health.tools.notes,
      note: () => activeNotes > 0 ? n.activeNotes(activeNotes) : n.addNote,
      bg: '#F1EAD0', fg: '#8A6E2E', route: '/(tabs)/notatki',
    },
  ];

  return (
    <MainScreenShell>
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
        {/* Nagłówek */}
        <View style={{ paddingHorizontal: 22, paddingTop: 14, paddingBottom: 20 }}>
          <Text style={{ fontFamily: 'Newsreader_400Regular', fontSize: 28, color: colors.ink.DEFAULT, lineHeight: 34 }}>
            {t.health.title}
          </Text>
          <Text style={{ fontSize: 13, color: colors.ink.soft, marginTop: 3 }}>
            {t.health.subtitle}
          </Text>
        </View>

        {/* Kafelek Smart Asystent Leków */}
        <MedAssistantTile
          medications={medications}
          tick={tick}
          t={t.health}
          onPress={() => router.push('/tracker/leki' as any)}
        />

        {/* Sekcja 1: W ciąży */}
        <Section label={t.health.duringPregnancy} items={pregnancy} onPress={(r) => router.push(r as any)} />

        {/* Sekcja 2: Po porodzie */}
        <Section label={t.health.afterBirth} items={postpartum} onPress={(r) => router.push(r as any)} />
      </ScrollView>
    </MainScreenShell>
  );
}

function MedAssistantTile({
  medications,
  tick,
  t,
  onPress,
}: {
  medications: ReturnType<typeof useMedicationsStore.getState>['medications'];
  tick: number;
  t: ReturnType<typeof useT>['health'];
  onPress: () => void;
}) {
  const nextDue = getNextDue(medications);
  const countdownMs = nextDue ? nextDue.at.getTime() - Date.now() : 0;

  return (
    <Pressable
      onPress={onPress}
      style={{
        marginHorizontal: 22,
        marginBottom: 24,
        backgroundColor: colors.evergreen.DEFAULT,
        borderRadius: 20,
        padding: 20,
        overflow: 'hidden',
        minHeight: 124,
      }}
    >
      {/* Nagłówek kafelka */}
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14, gap: 10 }}>
        <View style={{
          width: 34, height: 34, borderRadius: 10,
          backgroundColor: 'rgba(255,255,255,0.15)',
          alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon name="pill" size={18} color="#FFFFFF" />
        </View>
        <Text style={{ fontSize: 11, fontFamily: 'Geist_500Medium', color: 'rgba(255,255,255,0.65)', letterSpacing: 0.6, textTransform: 'uppercase' }}>
          {t.medAssistant}
        </Text>
      </View>

      {/* Stan */}
      {medications.length === 0 ? (
        <View>
          <Text style={{ fontSize: 17, fontFamily: 'Newsreader_400Regular', color: '#FFFFFF', marginBottom: 4 }}>
            {t.addMedications}
          </Text>
          <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>
            {t.remindersStats}
          </Text>
        </View>
      ) : nextDue ? (
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 22, fontFamily: 'Newsreader_400Regular', color: '#FFFFFF', lineHeight: 26 }}>
              {nextDue.medication.name}
            </Text>
            <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', marginTop: 3 }}>
              {nextDue.item.dosage} · {fmtCountdown(countdownMs, t)}
            </Text>
          </View>
          <View style={{
            backgroundColor: 'rgba(255,255,255,0.12)',
            borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6,
          }}>
            <Text style={{ fontSize: 13, fontFamily: 'Geist_500Medium', color: 'rgba(255,255,255,0.9)' }}>
              {String(Math.floor(countdownMs / 3600000)).padStart(2, '0')}:{String(Math.floor((countdownMs % 3600000) / 60000)).padStart(2, '0')}
            </Text>
          </View>
        </View>
      ) : (
        <Text style={{ fontSize: 16, color: 'rgba(255,255,255,0.7)' }}>
          {t.allDosesTaken}
        </Text>
      )}
    </Pressable>
  );
}

function Section({ label, items, onPress }: { label: string; items: ToolItem[]; onPress: (r: string) => void }) {
  const pairs: ToolItem[][] = [];
  for (let i = 0; i < items.length; i += 2) {
    pairs.push(items.slice(i, i + 2));
  }

  return (
    <View style={{ paddingHorizontal: 22, marginBottom: 28 }}>
      <Text style={{ fontSize: 11, fontFamily: 'Geist_500Medium', color: colors.ink.faint, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 12 }}>
        {label}
      </Text>
      <View style={{ gap: 10 }}>
        {pairs.map((pair, i) => (
          <View key={i} style={{ flexDirection: 'row', gap: 10 }}>
            {pair.map((item) => (
              <ToolCard key={item.id} item={item} onPress={() => onPress(item.route)} />
            ))}
            {pair.length === 1 && <View style={{ flex: 1 }} />}
          </View>
        ))}
      </View>
    </View>
  );
}

function ToolCard({ item, onPress }: { item: ToolItem; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        flex: 1,
        backgroundColor: item.bg,
        borderRadius: 16, padding: 16,
        minHeight: 110,
      }}
    >
      <Icon name={item.icon} size={22} color={item.fg} strokeWidth={1.7} />
      <Text style={{ fontSize: 15, fontFamily: 'Geist_500Medium', color: colors.ink.DEFAULT, lineHeight: 20, marginTop: 14, marginBottom: 3 }}>
        {item.title}
      </Text>
      <Text style={{ fontSize: 12.5, color: item.fg }}>
        {item.note()}
      </Text>
    </Pressable>
  );
}
