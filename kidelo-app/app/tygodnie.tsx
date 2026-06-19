import React, { useState, useRef, useEffect } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { differenceInDays } from 'date-fns';

import { Icon } from '@/components/ui';
import { useProfileStore } from '@/stores/profile';
import { colors } from '@/theme/tokens';

// @ts-ignore
import weekData from '../assets/ciaza-tydzien-po-tygodniu.json';

const FRUIT_EMOJI: Record<string, string> = {
  'mak': '🌱', 'sezam': '🌿', 'soczewica': '🫘', 'borówka': '🫐',
  'malina': '🍓', 'fasolka': '🫘', 'winogrono': '🍇', 'wiśnia': '🍒',
  'truskawka': '🍓', 'kumkwat': '🍊', 'figa': '🫒', 'limonka': '🍋',
  'cytryna': '🍋', 'groch': '🫛', 'jabłko': '🍎', 'awokado': '🥑',
  'rzepa': '🥔', 'gruszka': '🍐', 'papryka': '🫑', 'mango': '🥭',
  'pomidor': '🍅', 'banan': '🍌', 'marchewka': '🥕', 'papaja': '🥭',
  'kabaczek': '🥒', 'grejpfrut': '🍊', 'kukurydz': '🌽', 'kalarepa': '🥦',
  'kalafior': '🥦', 'sałat': '🥬', 'bakłażan': '🍆', 'dynia': '🎃',
  'kokos': '🥥', 'kapust': '🥬', 'ananas': '🍍', 'melon': '🍈',
  'botwina': '🥬', 'por': '🥬', 'arbuz': '🍉',
};

function fruitEmoji(porownanie: string): string {
  const lower = (porownanie ?? '').toLowerCase();
  for (const [key, emoji] of Object.entries(FRUIT_EMOJI)) {
    if (lower.includes(key)) return emoji;
  }
  return '👶';
}

interface WeekItem {
  tydzien: number;
  trymestr: number;
  etap_nazwa: string;
  podsumowanie: string;
  rozwoj_dziecka: string;
  cialo_kobiety: string;
  rozmiar_dziecka: { porownanie: string; dlugosc: string; waga: string };
  typowe_objawy?: string[];
  wskazowki?: string[];
}

const allWeeks: WeekItem[] = (weekData as any).tygodnie;

const BACK_BTN = {
  width: 40, height: 40, borderRadius: 12, borderWidth: 0.5,
  borderColor: colors.line.DEFAULT, backgroundColor: colors.surface.DEFAULT,
  alignItems: 'center' as const, justifyContent: 'center' as const,
};

export default function TygodnieScreen() {
  const router = useRouter();
  const profile = useProfileStore();
  const pickerRef = useRef<ScrollView>(null);

  const currentWeek = (() => {
    const ref = profile.childDueDate;
    if (!ref) return null;
    try {
      const daysLeft = differenceInDays(new Date(ref), new Date());
      const w = 40 - Math.round(daysLeft / 7);
      return Math.max(1, Math.min(42, w));
    } catch { return null; }
  })();

  const [selected, setSelected] = useState(currentWeek ?? 1);
  const weekInfo = allWeeks.find((w) => w.tydzien === selected);

  // Scroll picker to current week on mount
  useEffect(() => {
    const idx = selected - 1;
    const pillW = 54; // 44 + 10 gap
    const offset = Math.max(0, idx * pillW - 80);
    setTimeout(() => {
      pickerRef.current?.scrollTo({ x: offset, animated: false });
    }, 50);
  }, []);

  const emoji = weekInfo ? fruitEmoji(weekInfo.rozmiar_dziecka.porownanie) : '👶';

  return (
    <View style={{ flex: 1, backgroundColor: colors.cream.DEFAULT }}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        {/* TopBar */}
        <View style={{
          flexDirection: 'row', alignItems: 'center', gap: 8,
          paddingHorizontal: 18, paddingVertical: 14,
          backgroundColor: colors.cream.DEFAULT,
        }}>
          <Pressable onPress={() => router.back()} style={BACK_BTN}>
            <Icon name="back" size={20} color={colors.ink.DEFAULT} />
          </Pressable>
          <View style={{ flex: 1, alignItems: 'center' }}>
            <Text style={{ fontSize: 15, fontFamily: 'Geist_500Medium', color: colors.ink.DEFAULT }}>
              Ciąża tydzień po tygodniu
            </Text>
          </View>
          <View style={{ width: 40 }} />
        </View>

        {/* Horizontal week picker */}
        <ScrollView
          ref={pickerRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 18, paddingVertical: 12, gap: 8 }}
          style={{ flexGrow: 0 }}
        >
          {allWeeks.map((w) => {
            const isSelected = w.tydzien === selected;
            const isCurrent = w.tydzien === currentWeek;
            return (
              <Pressable
                key={w.tydzien}
                onPress={() => setSelected(w.tydzien)}
                style={{
                  width: 44, height: 44, borderRadius: 13,
                  alignItems: 'center', justifyContent: 'center',
                  backgroundColor: isSelected ? colors.evergreen.DEFAULT : colors.surface.DEFAULT,
                  borderWidth: isSelected ? 0 : isCurrent ? 1.5 : 0.5,
                  borderColor: isCurrent && !isSelected ? colors.evergreen.DEFAULT : colors.line.DEFAULT,
                }}
              >
                <Text style={{
                  fontSize: 14, fontFamily: 'Geist_500Medium',
                  color: isSelected ? colors.cream.DEFAULT : isCurrent ? colors.evergreen.DEFAULT : colors.ink.soft,
                }}>
                  {w.tydzien}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 22, paddingBottom: 48 }}
          showsVerticalScrollIndicator={false}
        >
          {weekInfo ? (
            <>
              {/* Hero card */}
              <View style={{
                backgroundColor: colors.sage.soft,
                borderRadius: 22, padding: 20,
                marginTop: 4, marginBottom: 16,
              }}>
                <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                  <View style={{ flex: 1, gap: 4 }}>
                    <Text style={{ fontSize: 11, fontFamily: 'Geist_500Medium', color: colors.evergreen.DEFAULT, letterSpacing: 0.4 }}>
                      TYDZIEŃ {weekInfo.tydzien} · {weekInfo.trymestr}. TRYMESTR
                    </Text>
                    <Text style={{ fontFamily: 'Newsreader_400Regular', fontSize: 22, color: colors.ink.DEFAULT, lineHeight: 28 }}>
                      {emoji}  {weekInfo.rozmiar_dziecka.porownanie}
                    </Text>
                    {(weekInfo.rozmiar_dziecka.dlugosc !== '—' || weekInfo.rozmiar_dziecka.waga !== '—') && (
                      <Text style={{ fontSize: 13, color: colors.ink.soft, marginTop: 2 }}>
                        {[
                          weekInfo.rozmiar_dziecka.dlugosc !== '—' ? weekInfo.rozmiar_dziecka.dlugosc : null,
                          weekInfo.rozmiar_dziecka.waga !== '—' ? weekInfo.rozmiar_dziecka.waga : null,
                        ].filter(Boolean).join(' · ')}
                      </Text>
                    )}
                  </View>
                  <Icon name="chevron" size={18} color={colors.evergreen.DEFAULT} />
                </View>

                {weekInfo.etap_nazwa ? (
                  <Text style={{
                    fontSize: 13, color: colors.ink.DEFAULT, lineHeight: 20,
                    marginTop: 14, paddingTop: 14,
                    borderTopWidth: 1, borderTopColor: 'rgba(61,81,71,0.12)',
                  }}>
                    {weekInfo.etap_nazwa}
                  </Text>
                ) : null}
              </View>

              {/* Co robi dziecko */}
              {weekInfo.rozwoj_dziecka ? (
                <WBlock title="Co robi dziecko" content={weekInfo.rozwoj_dziecka} />
              ) : null}

              {/* Co czujesz Ty */}
              {weekInfo.cialo_kobiety ? (
                <WBlock title="Co czujesz Ty" content={weekInfo.cialo_kobiety} />
              ) : null}

              {/* Objawy */}
              {weekInfo.typowe_objawy && weekInfo.typowe_objawy.length > 0 && (
                <View style={{
                  backgroundColor: colors.surface.DEFAULT,
                  borderWidth: 0.5, borderColor: colors.line.DEFAULT,
                  borderRadius: 16, padding: 18, marginBottom: 12,
                }}>
                  <Text style={{ fontSize: 13, fontFamily: 'Geist_500Medium', color: colors.ink.DEFAULT, marginBottom: 10 }}>
                    Typowe objawy
                  </Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7 }}>
                    {weekInfo.typowe_objawy.map((o, i) => (
                      <View key={i} style={{
                        backgroundColor: colors.sage.soft,
                        paddingHorizontal: 11, paddingVertical: 6, borderRadius: 99,
                      }}>
                        <Text style={{ fontSize: 12.5, color: colors.evergreen.DEFAULT }}>{o}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* Tip */}
              {weekInfo.wskazowki && weekInfo.wskazowki.length > 0 && (
                <View style={{
                  flexDirection: 'row', gap: 11, alignItems: 'flex-start',
                  backgroundColor: colors.terracotta.soft,
                  borderRadius: 16, padding: 16,
                }}>
                  <Icon name="sparkle" size={17} color={colors.terracotta.DEFAULT} />
                  <Text style={{ flex: 1, fontSize: 13.5, color: colors.ink.DEFAULT, lineHeight: 21 }}>
                    {weekInfo.wskazowki[0]}
                  </Text>
                </View>
              )}
            </>
          ) : (
            <View style={{ alignItems: 'center', paddingTop: 60 }}>
              <Text style={{ fontSize: 14, color: colors.ink.faint }}>Brak danych dla tygodnia {selected}</Text>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function WBlock({ title, content }: { title: string; content: string }) {
  return (
    <View style={{
      backgroundColor: colors.surface.DEFAULT,
      borderWidth: 0.5, borderColor: colors.line.DEFAULT,
      borderRadius: 16, padding: 18, marginBottom: 12,
    }}>
      <Text style={{ fontSize: 13, fontFamily: 'Geist_500Medium', color: colors.ink.DEFAULT, marginBottom: 10 }}>
        {title}
      </Text>
      <Text style={{ fontSize: 14, color: colors.ink.soft, lineHeight: 22 }}>
        {content}
      </Text>
    </View>
  );
}
