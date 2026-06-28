/**
 * app/week/[week].tsx — szczegóły ciąży tydzień po tygodniu.
 */

import React, { useRef, useEffect, useCallback, useState } from 'react';
import { View, Text, ScrollView, Pressable, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';

import { Icon } from '@/components/ui';
import { colors } from '@/theme/tokens';
import { useT } from '@/i18n';

// @ts-ignore
import weekData from '../../assets/ciaza-tydzien-po-tygodniu.json';

// ============ EMOJI MAPA ============

const FRUIT_EMOJI: Record<string, string> = {
  'brak': '🌱', 'mak': '🌱', 'sezam': '🌿', 'soczewica': '🫘', 'borówka': '🫐',
  'malina': '🍓', 'winogrono': '🍇', 'wiśnia': '🍒',
  'truskawka': '🍓', 'figa': '🫐', 'limonka': '🍋',
  'brzoskwinia': '🍑', 'cytryna': '🍋', 'jabłko': '🍎', 'awokado': '🥑',
  'gruszka': '🍐', 'papryka': '🫑', 'mango': '🥭',
  'banan': '🍌', 'marchewka': '🥕', 'papaja': '🌴',
  'grejpfrut': '🍊', 'kukurydz': '🌽', 'kalarepa': '🥦',
  'kalafior': '🥦', 'sałat': '🥬', 'bakłażan': '🍆', 'dynia': '🎃',
  'kokos': '🥥', 'kapust': '🥬', 'ananas': '🍍', 'melon': '🍈',
  'burak': '🥬', 'por': '🌿', 'arbuz': '🍉',
};

function fruitEmoji(porownanie: string): string {
  const lower = porownanie.toLowerCase();
  for (const [key, emoji] of Object.entries(FRUIT_EMOJI)) {
    if (lower.includes(key)) return emoji;
  }
  return '👶';
}

// ============ KOLORY TRYMESTRU ============

const TRIMESTER_STYLE_MAP: Record<number, { bg: string; text: string; border: string; labelKey: 'trimester1' | 'trimester2' | 'trimester3' }> = {
  1: { bg: 'bg-sage-soft',   text: 'text-evergreen',       border: 'border-sage/40',       labelKey: 'trimester1' },
  2: { bg: 'bg-blush-soft',  text: 'text-terracotta-dark', border: 'border-terracotta/20', labelKey: 'trimester2' },
  3: { bg: 'bg-mustard/20',  text: 'text-ink',             border: 'border-mustard/30',    labelKey: 'trimester3' },
};
const TRI_DEFAULT = { bg: 'bg-sage-soft', text: 'text-evergreen', border: 'border-sage/40', labelKey: 'trimester1' as const };
function getTriStyle(n: number) { return TRIMESTER_STYLE_MAP[n] ?? TRI_DEFAULT; }

const ALL_WEEKS = Array.from({ length: 42 }, (_, i) => i + 1);
const CHIP_W = 36;
const CHIP_GAP = 6;
const CHIP_STEP = CHIP_W + CHIP_GAP;

// ============ EKRAN ============

export default function WeekScreen() {
  const router = useRouter();
  const t = useT();
  const { width: screenWidth } = useWindowDimensions();
  const { week: weekParam } = useLocalSearchParams<{ week: string }>();

  // Stan lokalny — bez router.replace przy swipe (eliminuje flash i stale closure)
  const [weekNum, setWeekNum] = useState(() =>
    Math.max(1, Math.min(42, parseInt(weekParam ?? '1', 10)))
  );

  const week = (weekData as any).tygodnie.find((w: any) => w.tydzien === weekNum);
  const chipsRef = useRef<ScrollView>(null);

  const canPrev = weekNum > 1;
  const canNext = weekNum < 42;

  const goWeek = useCallback((n: number) => {
    setWeekNum(Math.max(1, Math.min(42, n)));
  }, []);

  // Scroll chipów do aktywnego tygodnia
  useEffect(() => {
    const offset = (weekNum - 1) * CHIP_STEP - screenWidth / 2 + CHIP_W / 2 + 20;
    chipsRef.current?.scrollTo({ x: Math.max(0, offset), animated: true });
  }, [weekNum, screenWidth]);

  // Animacja swipe — Reanimated shared value
  const translateX = useSharedValue(0);

  // SharedValue zsynchronizowany ze stanem — potrzebny w workletach (UI thread)
  const weekNumSV = useSharedValue(weekNum);
  useEffect(() => {
    weekNumSV.value = weekNum;
  }, [weekNum]);

  // Gest poziomy — RNGH na native thread
  // activeOffsetX: aktywuj tylko po 20px w poziomie
  // failOffsetY: rezygnuj jeśli pierwsze 15px jest pionowe (scroll wygrywa)
  const panGesture = Gesture.Pan()
    .activeOffsetX([-20, 20])
    .failOffsetY([-15, 15])
    .onUpdate((e) => {
      // Subtelny parallax podczas przeciągania (0.2 tłumienie)
      translateX.value = e.translationX * 0.2;
    })
    .onEnd((e) => {
      const curr = weekNumSV.value;
      if (e.translationX > 50 && curr > 1) {
        runOnJS(goWeek)(curr - 1);
      } else if (e.translationX < -50 && curr < 42) {
        runOnJS(goWeek)(curr + 1);
      }
      // Zawsze wróć do 0
      translateX.value = withSpring(0, { damping: 20, stiffness: 400 });
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  if (!week) {
    return (
      <SafeAreaView className="flex-1 bg-cream items-center justify-center">
        <Text className="text-ink-soft">{t.week.noData(weekNum)}</Text>
      </SafeAreaView>
    );
  }

  const tri = getTriStyle(week.trymestr);
  const emoji = fruitEmoji(week.rozmiar_dziecka.porownanie);

  return (
    <SafeAreaView className="flex-1 bg-cream" edges={['top', 'bottom']}>

      {/* Nagłówek — poza GestureDetector, przyciski zawsze reagują */}
      <View className="flex-row items-center px-4 py-3 border-b border-line">
        <Pressable onPress={() => router.back()} className="w-10 h-10 items-center justify-center">
          <Icon name="back" size={20} color={colors.ink.DEFAULT} />
        </Pressable>
        <Text className="flex-1 text-center text-ink font-sans-medium text-[15px]">
          {t.week.title(weekNum)}
        </Text>
        <View className="flex-row gap-1">
          <Pressable
            onPress={() => canPrev && goWeek(weekNum - 1)}
            className="w-9 h-9 items-center justify-center rounded-full bg-surface border border-line active:opacity-60"
            style={{ opacity: canPrev ? 1 : 0.3 }}
          >
            <Icon name="back" size={15} color={colors.ink.DEFAULT} />
          </Pressable>
          <Pressable
            onPress={() => canNext && goWeek(weekNum + 1)}
            className="w-9 h-9 items-center justify-center rounded-full bg-surface border border-line active:opacity-60"
            style={{ opacity: canNext ? 1 : 0.3 }}
          >
            <Icon name="arrow" size={15} color={colors.ink.DEFAULT} />
          </Pressable>
        </View>
      </View>

      {/* Chipsy tygodni 1–42 — poza GestureDetector */}
      <View style={{ borderBottomWidth: 0.5, borderBottomColor: colors.line.DEFAULT }}>
        <ScrollView
          ref={chipsRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 10, gap: CHIP_GAP, flexDirection: 'row' }}
        >
          {ALL_WEEKS.map((w) => {
            const isActive = w === weekNum;
            return (
              <Pressable
                key={w}
                onPress={() => goWeek(w)}
                style={{
                  width: CHIP_W, height: CHIP_W, borderRadius: 10,
                  backgroundColor: isActive ? colors.evergreen.DEFAULT : colors.surface.DEFAULT,
                  borderWidth: 1,
                  borderColor: isActive ? colors.evergreen.DEFAULT : colors.line.DEFAULT,
                  alignItems: 'center', justifyContent: 'center',
                }}
              >
                <Text style={{
                  fontSize: 12,
                  fontFamily: isActive ? 'Geist_500Medium' : 'Geist_400Regular',
                  color: isActive ? '#fff' : colors.ink.soft,
                }}>
                  {w}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* Obszar treści z obsługą swipe */}
      <GestureDetector gesture={panGesture}>
        <Animated.View style={[{ flex: 1 }, animatedStyle]}>
          <ScrollView
            contentContainerStyle={{ paddingBottom: 40 }}
            showsVerticalScrollIndicator={false}
          >
            {/* HERO */}
            <View className={`mx-5 mt-5 rounded-hero p-5 border ${tri.bg} ${tri.border}`}>
              <View className="flex-row items-start justify-between">
                <View className="flex-1">
                  <View className="flex-row items-center gap-2 mb-2">
                    <View className="px-2 py-0.5 rounded-full bg-white/60">
                      <Text className={`text-[11px] font-sans-medium ${tri.text}`}>{t.week[tri.labelKey]}</Text>
                    </View>
                    <Text className="text-ink-faint text-[11px]">{t.week.month} {week.miesiac_ciazy}</Text>
                  </View>
                  <Text className="font-serif text-[28px] text-ink leading-none">
                    {t.week.title(week.tydzien)}
                  </Text>
                  <Text className={`font-sans-medium text-[15px] mt-1 ${tri.text}`}>
                    {week.etap_nazwa}
                  </Text>
                </View>
                <View className="items-center ml-3">
                  <Text className="text-[48px]">{emoji}</Text>
                  <Text className="text-ink-faint text-[10px] text-center mt-1" numberOfLines={2}>
                    {week.rozmiar_dziecka.porownanie}
                  </Text>
                </View>
              </View>

              {(week.rozmiar_dziecka.dlugosc !== '—' || week.rozmiar_dziecka.waga !== '—') && (
                <View className="flex-row gap-4 mt-4 pt-4 border-t border-black/10">
                  {week.rozmiar_dziecka.dlugosc !== '—' && (
                    <View>
                      <Text className="text-ink-faint text-[10px] uppercase tracking-wide">{t.week.length}</Text>
                      <Text className="text-ink font-sans-medium text-[14px] mt-0.5">
                        {week.rozmiar_dziecka.dlugosc}
                      </Text>
                    </View>
                  )}
                  {week.rozmiar_dziecka.waga !== '—' && (
                    <View>
                      <Text className="text-ink-faint text-[10px] uppercase tracking-wide">{t.week.weight}</Text>
                      <Text className="text-ink font-sans-medium text-[14px] mt-0.5">
                        {week.rozmiar_dziecka.waga}
                      </Text>
                    </View>
                  )}
                </View>
              )}
            </View>

            {/* Podsumowanie */}
            <View className="px-5 mt-4">
              <Text className="text-ink text-[15px] leading-relaxed">{week.podsumowanie}</Text>
            </View>

            {/* Badania */}
            {week.badania_i_wizyty?.length > 0 && (
              <View className="mx-5 mt-5 bg-evergreen/8 border border-evergreen/20 rounded-card p-4">
                <View className="flex-row items-center gap-2 mb-3">
                  <Icon name="stethoscope" size={16} color={colors.evergreen.DEFAULT} />
                  <Text className="text-evergreen font-sans-medium text-[13px] uppercase tracking-wide">
                    {t.week.testsAndAppointments}
                  </Text>
                </View>
                {week.badania_i_wizyty.map((item: string, i: number) => (
                  <View key={i} className={`flex-row gap-2 items-start ${i > 0 ? 'mt-2' : ''}`}>
                    <View className="w-1.5 h-1.5 rounded-full bg-evergreen mt-1.5 shrink-0" />
                    <Text className="text-ink text-[13px] leading-snug flex-1">{item}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Na co zwrócić uwagę */}
            {week.na_co_zwrocic_uwage?.length > 0 && (
              <View className="mx-5 mt-4 bg-terracotta-soft border border-terracotta/20 rounded-card p-4">
                <View className="flex-row items-center gap-2 mb-3">
                  <Icon name="info" size={16} color={colors.terracotta.DEFAULT} />
                  <Text className="text-terracotta-dark font-sans-medium text-[13px] uppercase tracking-wide">
                    {t.week.watchFor}
                  </Text>
                </View>
                {week.na_co_zwrocic_uwage.map((item: string, i: number) => (
                  <View key={i} className={`flex-row gap-2 items-start ${i > 0 ? 'mt-2' : ''}`}>
                    <View className="w-1.5 h-1.5 rounded-full bg-terracotta mt-1.5 shrink-0" />
                    <Text className="text-ink-soft text-[13px] leading-snug flex-1">{item}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Rozwój dziecka */}
            <Section icon="heart" title={t.week.babyDevelopment}>
              <Text className="text-ink text-[14px] leading-relaxed">{week.rozwoj_dziecka}</Text>
            </Section>

            {/* Ciało mamy */}
            <Section icon="activity" title={t.week.momsBody}>
              <Text className="text-ink text-[14px] leading-relaxed">{week.cialo_kobiety}</Text>
            </Section>

            {/* Typowe objawy */}
            {week.typowe_objawy?.length > 0 && (
              <View className="px-5 mt-5">
                <SectionTitle icon="list" title={t.week.typicalSymptoms} />
                <View className="flex-row flex-wrap gap-2 mt-3">
                  {week.typowe_objawy.map((obj: string, i: number) => (
                    <View key={i} className="bg-surface border border-line rounded-full px-3 py-1.5">
                      <Text className="text-ink text-[13px]">{obj}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Co zrobić */}
            {week.co_zrobic?.length > 0 && (
              <View className="px-5 mt-5">
                <SectionTitle icon="check" title={t.week.whatToDo} />
                <View className="mt-3 gap-2.5">
                  {week.co_zrobic.map((item: string, i: number) => (
                    <View key={i} className="flex-row gap-3 items-start">
                      <View className="w-6 h-6 rounded-full bg-sage-soft items-center justify-center mt-0.5 shrink-0">
                        <Text className="text-evergreen text-[11px] font-sans-medium">{i + 1}</Text>
                      </View>
                      <Text className="text-ink text-[14px] leading-snug flex-1">{item}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Wskazówki */}
            {week.wskazowki?.length > 0 && (
              <View className="px-5 mt-5">
                <SectionTitle icon="sparkle" title={t.week.tips} />
                <View className="mt-3 gap-2">
                  {week.wskazowki.map((item: string, i: number) => (
                    <View key={i} className="bg-blush-soft border border-line rounded-card p-3.5 flex-row gap-3 items-start">
                      <Text className="text-[16px]">💡</Text>
                      <Text className="text-ink text-[13px] leading-snug flex-1">{item}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Nawigacja dolna */}
            <View className="flex-row items-center gap-3 px-5 mt-8">
              <Pressable
                onPress={() => canPrev && goWeek(weekNum - 1)}
                disabled={!canPrev}
                className={`flex-1 flex-row items-center justify-center gap-2 py-3.5 rounded-card border ${
                  canPrev ? 'bg-surface border-line active:opacity-70' : 'opacity-30 bg-surface border-line'
                }`}
              >
                <Icon name="back" size={16} color={colors.ink.DEFAULT} />
                <Text className="text-ink font-sans-medium text-[14px]">
                  {t.week.prevWeek(weekNum - 1)}
                </Text>
              </Pressable>
              <Pressable
                onPress={() => canNext && goWeek(weekNum + 1)}
                disabled={!canNext}
                className={`flex-1 flex-row items-center justify-center gap-2 py-3.5 rounded-card ${
                  canNext ? 'bg-evergreen active:opacity-80' : 'opacity-30 bg-evergreen'
                }`}
              >
                <Text className="text-cream font-sans-medium text-[14px]">
                  {t.week.nextWeek(weekNum + 1)}
                </Text>
                <Icon name="arrow" size={16} color={colors.cream.DEFAULT} />
              </Pressable>
            </View>
          </ScrollView>
        </Animated.View>
      </GestureDetector>

    </SafeAreaView>
  );
}

// ============ HELPERS ============

function SectionTitle({ icon, title }: { icon: any; title: string }) {
  return (
    <View className="flex-row items-center gap-2">
      <Icon name={icon} size={15} color={colors.ink.soft} />
      <Text className="text-ink font-sans-medium text-[14px]">{title}</Text>
    </View>
  );
}

function Section({ icon, title, children }: { icon: any; title: string; children: React.ReactNode }) {
  return (
    <View className="px-5 mt-5">
      <SectionTitle icon={icon} title={title} />
      <View className="mt-2">{children}</View>
    </View>
  );
}
