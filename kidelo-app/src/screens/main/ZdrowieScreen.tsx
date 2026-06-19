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

interface ToolItem {
  id: string;
  icon: IconName;
  title: string;
  note: () => string;
  badgeBg: string;
  route: string;
}

const pad = (n: number) => String(n).padStart(2, '0');

function fmtCountdown(ms: number): string {
  if (ms <= 0) return 'teraz';
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  if (h > 0) return `za ${h} godz. ${pad(m)} min`;
  return `za ${m} min`;
}

export default function ZdrowieScreen() {
  const router = useRouter();
  const trackers = useTrackersStore();
  const notes = useNotesStore();
  const profile = useProfileStore();
  const { medications } = useMedicationsStore();
  const [tick, setTick] = useState(0);

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

  const pregnancy: ToolItem[] = [
    {
      id: 'tygodnie', icon: 'baby', title: 'Tydzień ciąży',
      note: () => currentWeek ? `Tydzień ${currentWeek}` : 'Przeglądaj',
      badgeBg: colors.sage.soft, route: '/tygodnie',
    },
    {
      id: 'kalkulator', icon: 'calendar', title: 'Kalkulator terminu',
      note: () => 'Metoda Naegelego',
      badgeBg: colors.terracotta.soft, route: '/kalkulator',
    },
    {
      id: 'kopniecia', icon: 'foot', title: 'Kopnięcia',
      note: () => trackers.activeKickSessionId ? 'Sesja aktywna' : todayKicks > 0 ? `${todayKicks} dziś` : 'Zacznij sesję',
      badgeBg: colors.sage.soft, route: '/tracker/kopniecia',
    },
    {
      id: 'skurcze', icon: 'stopwatch', title: 'Timer skurczów',
      note: () => trackers.activeContractionSessionId ? 'Trwa skurcz' : 'Gotowy',
      badgeBg: colors.terracotta.soft, route: '/tracker/skurcze',
    },
    {
      id: 'wyniki', icon: 'flask', title: 'Wyniki badań',
      note: () => testCount > 0 ? `${testCount} wyników` : 'Dodaj wyniki',
      badgeBg: colors.sage.soft, route: '/tracker/wyniki',
    },
    {
      id: 'badania', icon: 'stethoscope', title: 'Badania',
      note: () => 'Listy kontrolne ciąży',
      badgeBg: colors.terracotta.soft, route: '/tracker/badania',
    },
    {
      id: 'album', icon: 'camera', title: 'Album brzuszka',
      note: () => albumCount > 0 ? `${albumCount} zdjęć` : 'Dodaj zdjęcia',
      badgeBg: colors.sage.soft, route: '/tracker/album',
    },
    {
      id: 'brzuszek', icon: 'note', title: 'Pamiętnik ciąży',
      note: () => bumpCount > 0 ? `${bumpCount} wpisów` : 'Zacznij pisać',
      badgeBg: colors.terracotta.soft, route: '/tracker/brzuszek',
    },
  ];

  const postpartum: ToolItem[] = [
    {
      id: 'karmienie', icon: 'bottle', title: 'Karmienie',
      note: () => trackers.activeFeedingSessionId ? 'Trwa sesja' : todayFeedings > 0 ? `${todayFeedings} dziś` : 'Zacznij',
      badgeBg: colors.terracotta.soft, route: '/tracker/karmienie',
    },
    {
      id: 'szczepienia', icon: 'shield', title: 'Szczepienia',
      note: () => totalVax > 0 ? `${doneVax}/${totalVax} wykonanych` : 'Załaduj',
      badgeBg: colors.sage.soft, route: '/tracker/szczepienia',
    },
    {
      id: 'notatki', icon: 'pencil', title: 'Notatki',
      note: () => activeNotes > 0 ? `${activeNotes} aktywnych` : 'Dodaj notatkę',
      badgeBg: '#EFE9DC', route: '/(tabs)/notatki',
    },
  ];

  return (
    <MainScreenShell>
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
        {/* Nagłówek */}
        <View style={{ paddingHorizontal: 22, paddingTop: 14, paddingBottom: 20 }}>
          <Text style={{ fontFamily: 'Newsreader_400Regular', fontSize: 28, color: colors.ink.DEFAULT, lineHeight: 34 }}>
            Zdrowie
          </Text>
          <Text style={{ fontSize: 13, color: colors.ink.soft, marginTop: 3 }}>
            Twoje centrum zdrowia i samopoczucia
          </Text>
        </View>

        {/* Kafelek Smart Asystent Leków */}
        <MedAssistantTile
          medications={medications}
          tick={tick}
          onPress={() => router.push('/tracker/leki' as any)}
        />

        {/* Sekcja 1: W ciąży */}
        <Section label="W ciąży" items={pregnancy} onPress={(r) => router.push(r as any)} />

        {/* Sekcja 2: Po porodzie */}
        <Section label="Po porodzie" items={postpartum} onPress={(r) => router.push(r as any)} />
      </ScrollView>
    </MainScreenShell>
  );
}

function MedAssistantTile({
  medications,
  tick,
  onPress,
}: {
  medications: ReturnType<typeof useMedicationsStore.getState>['medications'];
  tick: number;
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
      {/* Dekoracyjne koła w tle */}
      <View style={{ position: 'absolute', right: -24, top: -24, width: 110, height: 110, borderRadius: 55, backgroundColor: 'rgba(255,255,255,0.06)' }} />
      <View style={{ position: 'absolute', right: 40, bottom: -16, width: 70, height: 70, borderRadius: 35, backgroundColor: 'rgba(255,255,255,0.04)' }} />

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
          Smart Asystent Leków
        </Text>
      </View>

      {/* Stan */}
      {medications.length === 0 ? (
        <View>
          <Text style={{ fontSize: 17, fontFamily: 'Newsreader_400Regular', color: '#FFFFFF', marginBottom: 4 }}>
            Dodaj swoje leki
          </Text>
          <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>
            Przypomnienia, statystyki i system nagród
          </Text>
        </View>
      ) : nextDue ? (
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 22, fontFamily: 'Newsreader_400Regular', color: '#FFFFFF', lineHeight: 26 }}>
              {nextDue.medication.name}
            </Text>
            <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', marginTop: 3 }}>
              {nextDue.item.dosage} · {fmtCountdown(countdownMs)}
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
          Wszystkie dawki przyjęte ✓
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
        backgroundColor: colors.surface.DEFAULT,
        borderWidth: 0.5, borderColor: colors.line.DEFAULT,
        borderRadius: 16, padding: 16,
        minHeight: 110,
      }}
    >
      {/* Icon badge */}
      <View style={{
        width: 46, height: 46, borderRadius: 14,
        backgroundColor: item.badgeBg,
        alignItems: 'center', justifyContent: 'center',
        marginBottom: 14,
      }}>
        <Icon name={item.icon} size={22} color={colors.evergreen.DEFAULT} />
      </View>

      <Text style={{ fontSize: 15, fontFamily: 'Geist_500Medium', color: colors.ink.DEFAULT, lineHeight: 20, marginBottom: 4 }}>
        {item.title}
      </Text>
      <Text style={{ fontSize: 12.5, color: colors.ink.faint }}>
        {item.note()}
      </Text>
    </Pressable>
  );
}
