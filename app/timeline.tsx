/**
 * app/timeline.tsx — oś czasu ciąży, pełny opis każdego tygodnia (42 tygodnie).
 */

import React, { useRef, useEffect, useMemo } from 'react';
import { View, Text, ScrollView, Pressable, findNodeHandle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { differenceInDays } from 'date-fns';

import { Icon } from '@/components/ui';
import { useProfileStore } from '@/stores/profile';
import { colors } from '@/theme/tokens';

// @ts-ignore
import weekDataRaw from '../assets/ciaza-tydzien-po-tygodniu.json';

type WeekEntry = {
  tydzien: number;
  trymestr: number;
  miesiac_ciazy: number;
  etap_nazwa: string;
  podsumowanie: string;
  rozwoj_dziecka: string;
  rozmiar_dziecka: { dlugosc: string; waga: string; porownanie: string };
  cialo_kobiety: string;
  typowe_objawy: string[];
  co_zrobic: string[];
  badania_i_wizyty: string[];
  na_co_zwrocic_uwage: string[];
  wskazowki: string[];
};

const ALL_WEEKS: WeekEntry[] = weekDataRaw.tygodnie;

const TRI_THEME = {
  1: {
    bg: colors.sage.soft,
    dot: colors.sage.DEFAULT,
    text: colors.evergreen.DEFAULT,
    label: 'I Trymestr',
  },
  2: {
    bg: colors.blush.soft,
    dot: colors.blush.DEFAULT,
    text: colors.terracotta.dark,
    label: 'II Trymestr',
  },
  3: {
    bg: colors.mustard.soft,
    dot: colors.mustard.DEFAULT,
    text: '#7A5200',
    label: 'III Trymestr',
  },
} as const;

const FRUIT_KEYS: [string, string][] = [
  ['brak', '🌱'], ['mak', '🌱'], ['sezam', '🌿'], ['soczewica', '🫘'], ['borówka', '🫐'],
  ['malina', '🍓'], ['winogrono', '🍇'], ['wiśnia', '🍒'],
  ['truskawka', '🍓'], ['figa', '🫐'], ['limonka', '🍋'],
  ['brzoskwinia', '🍑'], ['cytryna', '🍋'], ['jabłko', '🍎'], ['awokado', '🥑'],
  ['gruszka', '🍐'], ['papryka', '🫑'], ['mango', '🥭'],
  ['banan', '🍌'], ['marchewka', '🥕'], ['papaja', '🌴'],
  ['grejpfrut', '🍊'], ['kukurydz', '🌽'], ['kalarepa', '🥦'],
  ['kalafior', '🥦'], ['sałat', '🥬'], ['bakłażan', '🍆'], ['dynia', '🎃'],
  ['kokos', '🥥'], ['kapust', '🥬'], ['ananas', '🍍'], ['melon', '🍈'],
  ['burak', '🥬'], ['por', '🌿'], ['arbuz', '🍉'],
];

function fruitEmoji(porownanie: string): string {
  const lower = porownanie.toLowerCase();
  for (const [k, e] of FRUIT_KEYS) {
    if (lower.includes(k)) return e;
  }
  return '👶';
}

function calcCurrentWeek(dueDateStr: string | null | undefined): number | null {
  if (!dueDateStr) return null;
  try {
    const daysLeft = differenceInDays(new Date(dueDateStr), new Date());
    const week = 40 - Math.round(daysLeft / 7);
    if (week < 1 || week > 42) return null;
    return week;
  } catch {
    return null;
  }
}

// ============ MAIN SCREEN ============

export default function TimelineScreen() {
  const router = useRouter();
  const profile = useProfileStore();
  const scrollRef = useRef<ScrollView>(null);
  const currentWeekRef = useRef<View>(null);

  const currentWeek = useMemo(
    () => calcCurrentWeek(profile.childDueDate),
    [profile.childDueDate],
  );

  useEffect(() => {
    if (!currentWeek) return;
    const timer = setTimeout(() => {
      const node = findNodeHandle(scrollRef.current);
      if (!node || !currentWeekRef.current) return;
      currentWeekRef.current.measureLayout(
        node as any,
        (_x, y) => {
          scrollRef.current?.scrollTo({ y: Math.max(0, y - 80), animated: false });
        },
        () => {},
      );
    }, 350);
    return () => clearTimeout(timer);
  }, [currentWeek]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.cream.DEFAULT }} edges={['top', 'bottom']}>

      {/* Nagłówek */}
      <View style={{
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: 16, paddingVertical: 12,
        borderBottomWidth: 0.5, borderBottomColor: colors.line.DEFAULT,
      }}>
        <Pressable
          onPress={() => router.back()}
          style={{ width: 40, height: 40, alignItems: 'center', justifyContent: 'center' }}
        >
          <Icon name="back" size={20} color={colors.ink.DEFAULT} />
        </Pressable>
        <Text style={{
          flex: 1, textAlign: 'center',
          fontFamily: 'Geist_500Medium', fontSize: 15, color: colors.ink.DEFAULT,
        }}>
          Oś czasu ciąży
        </Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Pasek postępu */}
      <View style={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 10 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <Text style={{ fontFamily: 'Newsreader_400Regular', fontSize: 20, color: colors.ink.DEFAULT }}>
            {currentWeek ? `Tydzień ${currentWeek} z 42` : '42 tygodnie ciąży'}
          </Text>
          {currentWeek && (
            <View style={{
              backgroundColor: colors.evergreen.DEFAULT,
              borderRadius: 99, paddingHorizontal: 8, paddingVertical: 2,
            }}>
              <Text style={{ color: colors.cream.DEFAULT, fontFamily: 'Geist_500Medium', fontSize: 10 }}>
                teraz
              </Text>
            </View>
          )}
        </View>
        <View style={{ flexDirection: 'row', gap: 2 }}>
          {Array.from({ length: 42 }, (_, i) => {
            const w = i + 1;
            const tri = (ALL_WEEKS[i]?.trymestr ?? 1) as 1 | 2 | 3;
            const isCurrent = w === currentWeek;
            const isPast = currentWeek != null && w < currentWeek;
            return (
              <View
                key={w}
                style={{
                  flex: 1, height: 4, borderRadius: 2,
                  backgroundColor: isCurrent
                    ? colors.evergreen.DEFAULT
                    : isPast
                    ? TRI_THEME[tri].dot + 'BB'
                    : colors.line.DEFAULT,
                }}
              />
            );
          })}
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
          <Text style={{ fontSize: 9, color: colors.ink.faint }}>T1 · 1–13</Text>
          <Text style={{ fontSize: 9, color: colors.ink.faint }}>T2 · 14–27</Text>
          <Text style={{ fontSize: 9, color: colors.ink.faint }}>T3 · 28–42</Text>
        </View>
      </View>

      {/* Lista tygodni */}
      <ScrollView
        ref={scrollRef}
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 60 }}
        showsVerticalScrollIndicator={false}
      >
        {([1, 2, 3] as const).map((tri) => {
          const theme = TRI_THEME[tri];
          const weeks = ALL_WEEKS.filter((w) => w.trymestr === tri);
          return (
            <View key={tri}>
              {/* Nagłówek trymestru */}
              <View style={{
                flexDirection: 'row', alignItems: 'center',
                paddingHorizontal: 20, paddingTop: 20, paddingBottom: 12, gap: 10,
              }}>
                <View style={{ flex: 1, height: 0.5, backgroundColor: colors.line.DEFAULT }} />
                <View style={{ backgroundColor: theme.bg, borderRadius: 99, paddingHorizontal: 12, paddingVertical: 5 }}>
                  <Text style={{ fontSize: 11, fontFamily: 'Geist_500Medium', color: theme.text }}>
                    {theme.label}
                  </Text>
                </View>
                <View style={{ flex: 1, height: 0.5, backgroundColor: colors.line.DEFAULT }} />
              </View>

              {/* Karty tygodni */}
              <View style={{ paddingHorizontal: 16, gap: 12 }}>
                {weeks.map((w) => {
                  const isCurrent = w.tydzien === currentWeek;
                  return (
                    <View
                      key={w.tydzien}
                      ref={isCurrent ? currentWeekRef : undefined}
                    >
                      <WeekCard
                        w={w}
                        isCurrent={isCurrent}
                        theme={theme}
                        onPress={() => router.push(`/week/${w.tydzien}` as any)}
                      />
                    </View>
                  );
                })}
              </View>
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

// ============ KARTA TYGODNIA ============

type TriTheme = { bg: string; dot: string; text: string; label: string };

function WeekCard({
  w,
  isCurrent,
  theme,
  onPress,
}: {
  w: WeekEntry;
  isCurrent: boolean;
  theme: TriTheme;
  onPress: () => void;
}) {
  const emoji = fruitEmoji(w.rozmiar_dziecka.porownanie);
  const hasSize = w.rozmiar_dziecka.dlugosc !== '—';
  const hasWaga = w.rozmiar_dziecka.waga !== '—';
  const hasBadania = w.badania_i_wizyty.length > 0;
  const hasCoZrobic = w.co_zrobic.length > 0;
  const hasObjawy = w.typowe_objawy.length > 0;
  const hasUwagi = w.na_co_zwrocic_uwage.length > 0;
  const hasWskazowki = w.wskazowki.length > 0;

  return (
    <View style={{
      borderRadius: 16,
      borderWidth: isCurrent ? 1.5 : 1,
      borderColor: isCurrent ? colors.evergreen.DEFAULT : colors.line.DEFAULT,
      overflow: 'hidden',
      backgroundColor: colors.surface.DEFAULT,
    }}>

      {/* Nagłówek karty */}
      <View style={{ backgroundColor: isCurrent ? `${colors.evergreen.DEFAULT}12` : theme.bg, padding: 14 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          {/* Okrąg z numerem tygodnia */}
          <View style={{
            width: 44, height: 44, borderRadius: 22,
            alignItems: 'center', justifyContent: 'center',
            backgroundColor: isCurrent ? colors.evergreen.DEFAULT : `${theme.dot}33`,
          }}>
            <Text style={{
              fontFamily: 'Geist_500Medium', fontSize: 14,
              color: isCurrent ? colors.cream.DEFAULT : theme.text,
            }}>
              {w.tydzien}
            </Text>
          </View>

          {/* Tytuł */}
          <View style={{ flex: 1 }}>
            <Text style={{
              fontSize: 10, fontFamily: 'Geist_500Medium',
              color: isCurrent ? colors.evergreen.DEFAULT : theme.text,
              textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2,
            }}>
              Miesiąc {w.miesiac_ciazy} · {theme.label}
            </Text>
            <Text style={{
              fontFamily: 'Newsreader_400Regular', fontSize: 18,
              color: isCurrent ? colors.evergreen.DEFAULT : colors.ink.DEFAULT,
              lineHeight: 22,
            }}>
              {w.etap_nazwa}
            </Text>
          </View>

          {/* Odznaka "teraz" + link do szczegółów */}
          <View style={{ alignItems: 'flex-end', gap: 6 }}>
            {isCurrent && (
              <View style={{
                backgroundColor: colors.evergreen.DEFAULT,
                borderRadius: 99, paddingHorizontal: 8, paddingVertical: 3,
              }}>
                <Text style={{ fontSize: 10, fontFamily: 'Geist_500Medium', color: colors.cream.DEFAULT }}>
                  teraz
                </Text>
              </View>
            )}
            <Pressable
              onPress={onPress}
              style={{ padding: 4 }}
            >
              <Icon name="chevron" size={16} color={isCurrent ? colors.evergreen.DEFAULT : colors.ink.faint} />
            </Pressable>
          </View>
        </View>
      </View>

      {/* Treść */}
      <View style={{ padding: 16, gap: 14 }}>

        {/* Podsumowanie */}
        <Text style={{ fontSize: 14, lineHeight: 21, color: colors.ink.DEFAULT }}>
          {w.podsumowanie}
        </Text>

        {/* Rozmiar dziecka */}
        <View style={{
          flexDirection: 'row', alignItems: 'center', gap: 12,
          backgroundColor: `${theme.bg}80`, borderRadius: 12, padding: 12,
        }}>
          <Text style={{ fontSize: 28 }}>{emoji}</Text>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 13, fontFamily: 'Geist_500Medium', color: colors.ink.DEFAULT }}>
              {w.rozmiar_dziecka.porownanie}
            </Text>
            {(hasSize || hasWaga) && (
              <Text style={{ fontSize: 11, color: colors.ink.soft, marginTop: 2 }}>
                {[
                  hasSize && w.rozmiar_dziecka.dlugosc,
                  hasWaga && w.rozmiar_dziecka.waga,
                ].filter(Boolean).join(' · ')}
              </Text>
            )}
          </View>
        </View>

        {/* Rozwój dziecka */}
        {w.rozwoj_dziecka ? (
          <ContentSection label="Rozwój dziecka" color={colors.evergreen.DEFAULT}>
            <Text style={{ fontSize: 13, lineHeight: 20, color: colors.ink.soft }}>
              {w.rozwoj_dziecka}
            </Text>
          </ContentSection>
        ) : null}

        {/* Ciało kobiety */}
        {w.cialo_kobiety ? (
          <ContentSection label="Twoje ciało" color={colors.blush.DEFAULT}>
            <Text style={{ fontSize: 13, lineHeight: 20, color: colors.ink.soft }}>
              {w.cialo_kobiety}
            </Text>
          </ContentSection>
        ) : null}

        {/* Badania i wizyty */}
        {hasBadania && (
          <ContentSection label="Badania i wizyty" color={colors.terracotta.DEFAULT}>
            {w.badania_i_wizyty.map((item, i) => (
              <BulletItem key={i} text={item} color={colors.terracotta.DEFAULT} />
            ))}
          </ContentSection>
        )}

        {/* Co zrobić */}
        {hasCoZrobic && (
          <ContentSection label="Co zrobić" color={colors.sage.DEFAULT}>
            {w.co_zrobic.map((item, i) => (
              <BulletItem key={i} text={item} color={colors.sage.DEFAULT} />
            ))}
          </ContentSection>
        )}

        {/* Typowe objawy */}
        {hasObjawy && (
          <ContentSection label="Typowe objawy" color={colors.ink.soft}>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
              {w.typowe_objawy.map((o, i) => (
                <View key={i} style={{
                  backgroundColor: colors.cream.DEFAULT,
                  borderWidth: 1, borderColor: colors.line.DEFAULT,
                  borderRadius: 99, paddingHorizontal: 8, paddingVertical: 3,
                }}>
                  <Text style={{ fontSize: 11, color: colors.ink.soft }}>{o}</Text>
                </View>
              ))}
            </View>
          </ContentSection>
        )}

        {/* Na co zwrócić uwagę */}
        {hasUwagi && (
          <ContentSection label="Na co zwrócić uwagę" color={colors.mustard.DEFAULT}>
            {w.na_co_zwrocic_uwage.map((item, i) => (
              <BulletItem key={i} text={item} color={colors.mustard.DEFAULT} />
            ))}
          </ContentSection>
        )}

        {/* Wskazówki */}
        {hasWskazowki && (
          <ContentSection label="Wskazówki" color={colors.info}>
            {w.wskazowki.map((item, i) => (
              <BulletItem key={i} text={item} color={colors.info} />
            ))}
          </ContentSection>
        )}

      </View>
    </View>
  );
}

// ============ POMOCNICZE ============

function ContentSection({
  label,
  color,
  children,
}: {
  label: string;
  color: string;
  children: React.ReactNode;
}) {
  return (
    <View style={{ gap: 6 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <View style={{ width: 3, height: 14, borderRadius: 2, backgroundColor: color }} />
        <Text style={{
          fontSize: 10, fontFamily: 'Geist_500Medium',
          color: colors.ink.soft, textTransform: 'uppercase', letterSpacing: 0.6,
        }}>
          {label}
        </Text>
      </View>
      <View style={{ gap: 4 }}>
        {children}
      </View>
    </View>
  );
}

function BulletItem({ text, color }: { text: string; color: string }) {
  return (
    <View style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-start' }}>
      <View style={{
        width: 5, height: 5, borderRadius: 3,
        backgroundColor: color, marginTop: 7, flexShrink: 0,
      }} />
      <Text style={{ fontSize: 13, lineHeight: 20, color: colors.ink.soft, flex: 1 }}>
        {text}
      </Text>
    </View>
  );
}
