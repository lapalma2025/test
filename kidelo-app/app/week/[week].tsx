/**
 * app/week/[week].tsx — szczegóły ciąży tydzień po tygodniu.
 * Dane z assets/ciaza-tydzien-po-tygodniu.json (tygodnie 1-42).
 */

import React from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { Icon } from '@/components/ui';
import { colors } from '@/theme/tokens';

// @ts-ignore
import weekData from '../../assets/ciaza-tydzien-po-tygodniu.json';

// ============ EMOJI MAPA ============

const FRUIT_EMOJI: Record<string, string> = {
  'mak': '🌱', 'sezam': '🌿', 'soczewica': '🫘', 'borówka': '🫐',
  'malina': '🍓', 'fasolka': '🫘', 'winogrono': '🍇', 'wiśnia': '🍒',
  'truskawka': '🍓', 'kumkwat': '🍊', 'figa': '🫐', 'limonka': '🍋',
  'cytryna': '🍋', 'groch': '🟢', 'jabłko': '🍎', 'awokado': '🥑',
  'rzepa': '🫚', 'gruszka': '🍐', 'papryka': '🫑', 'mango': '🥭',
  'pomidor': '🍅', 'banan': '🍌', 'marchewka': '🥕', 'papaja': '🌴',
  'kabaczek': '🥒', 'grejpfrut': '🍊', 'kukurydza': '🌽', 'kalarepa': '🥦',
  'kalafior': '🥦', 'sałata': '🥬', 'bakłażan': '🍆', 'dynia': '🎃',
  'kokos': '🥥', 'kapusta': '🥬', 'ananas': '🍍', 'melon': '🍈',
  'botwina': '🌿', 'por': '🌿', 'arbuz': '🍉',
};

function fruitEmoji(porownanie: string): string {
  const lower = porownanie.toLowerCase();
  for (const [key, emoji] of Object.entries(FRUIT_EMOJI)) {
    if (lower.includes(key)) return emoji;
  }
  return '👶';
}

// ============ KOLORY TRYMESTRU ============

const TRIMESTER_STYLE_MAP: Record<number, { bg: string; text: string; border: string; label: string }> = {
  1: { bg: 'bg-sage-soft', text: 'text-evergreen', border: 'border-sage/40', label: 'I TRYMESTR' },
  2: { bg: 'bg-blush-soft', text: 'text-terracotta-dark', border: 'border-terracotta/20', label: 'II TRYMESTR' },
  3: { bg: 'bg-mustard/20', text: 'text-ink', border: 'border-mustard/30', label: 'III TRYMESTR' },
};
const TRI_DEFAULT = { bg: 'bg-sage-soft', text: 'text-evergreen', border: 'border-sage/40', label: 'I TRYMESTR' };
function getTriStyle(t: number) { return TRIMESTER_STYLE_MAP[t] ?? TRI_DEFAULT; }

// ============ EKRAN ============

export default function WeekScreen() {
  const router = useRouter();
  const { week: weekParam } = useLocalSearchParams<{ week: string }>();
  const weekNum = Math.max(1, Math.min(42, parseInt(weekParam ?? '1', 10)));
  const week = (weekData as any).tygodnie.find((t: any) => t.tydzien === weekNum);

  const canPrev = weekNum > 1;
  const canNext = weekNum < 42;

  const goWeek = (n: number) => router.replace(`/week/${n}` as any);

  if (!week) {
    return (
      <SafeAreaView className="flex-1 bg-cream items-center justify-center">
        <Text className="text-ink-soft">Brak danych dla tygodnia {weekNum}.</Text>
      </SafeAreaView>
    );
  }

  const tri = getTriStyle(week.trymestr);
  const emoji = fruitEmoji(week.rozmiar_dziecka.porownanie);

  return (
    <SafeAreaView className="flex-1 bg-cream" edges={['top', 'bottom']}>
      {/* Nagłówek */}
      <View className="flex-row items-center px-4 py-3 border-b border-line">
        <Pressable onPress={() => router.back()} className="w-10 h-10 items-center justify-center">
          <Icon name="back" size={20} color={colors.ink.DEFAULT} />
        </Pressable>
        <Text className="flex-1 text-center text-ink font-sans-medium text-[15px]">
          Tydzień {weekNum}
        </Text>
        {/* Nawigacja prev/next */}
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

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>

        {/* HERO — baby size */}
        <View className={`mx-5 mt-5 rounded-hero p-5 border ${tri.bg} ${tri.border}`}>
          <View className="flex-row items-start justify-between">
            <View className="flex-1">
              <View className="flex-row items-center gap-2 mb-2">
                <View className={`px-2 py-0.5 rounded-full bg-white/60`}>
                  <Text className={`text-[11px] font-sans-medium ${tri.text}`}>{tri.label}</Text>
                </View>
                <Text className="text-ink-faint text-[11px]">miesiąc {week.miesiac_ciazy}</Text>
              </View>
              <Text className="font-serif text-[28px] text-ink leading-none">
                Tydzień {week.tydzien}
              </Text>
              <Text className={`font-sans-medium text-[15px] mt-1 ${tri.text}`}>
                {week.etap_nazwa}
              </Text>
            </View>

            {/* Emoji rozmiar */}
            <View className="items-center ml-3">
              <Text className="text-[48px]">{emoji}</Text>
              <Text className="text-ink-faint text-[10px] text-center mt-1" numberOfLines={2}>
                {week.rozmiar_dziecka.porownanie}
              </Text>
            </View>
          </View>

          {/* Rozmiar */}
          {(week.rozmiar_dziecka.dlugosc !== '—' || week.rozmiar_dziecka.waga !== '—') && (
            <View className="flex-row gap-4 mt-4 pt-4 border-t border-black/10">
              {week.rozmiar_dziecka.dlugosc !== '—' && (
                <View>
                  <Text className="text-ink-faint text-[10px] uppercase tracking-wide">Długość</Text>
                  <Text className="text-ink font-sans-medium text-[14px] mt-0.5">
                    {week.rozmiar_dziecka.dlugosc}
                  </Text>
                </View>
              )}
              {week.rozmiar_dziecka.waga !== '—' && (
                <View>
                  <Text className="text-ink-faint text-[10px] uppercase tracking-wide">Masa</Text>
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

        {/* Badania — wyróżnione */}
        {week.badania_i_wizyty?.length > 0 && (
          <View className="mx-5 mt-5 bg-evergreen/8 border border-evergreen/20 rounded-card p-4">
            <View className="flex-row items-center gap-2 mb-3">
              <Icon name="stethoscope" size={16} color={colors.evergreen.DEFAULT} />
              <Text className="text-evergreen font-sans-medium text-[13px] uppercase tracking-wide">
                Badania i wizyty
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

        {/* Objawy alarmowe / Na co uważać */}
        {week.na_co_zwrocic_uwage?.length > 0 && (
          <View className="mx-5 mt-4 bg-terracotta-soft border border-terracotta/20 rounded-card p-4">
            <View className="flex-row items-center gap-2 mb-3">
              <Icon name="info" size={16} color={colors.terracotta.DEFAULT} />
              <Text className="text-terracotta-dark font-sans-medium text-[13px] uppercase tracking-wide">
                Na co zwrócić uwagę
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
        <Section icon="heart" title="Rozwój dziecka">
          <Text className="text-ink text-[14px] leading-relaxed">{week.rozwoj_dziecka}</Text>
        </Section>

        {/* Ciało mamy */}
        <Section icon="activity" title="Ciało mamy">
          <Text className="text-ink text-[14px] leading-relaxed">{week.cialo_kobiety}</Text>
        </Section>

        {/* Typowe objawy */}
        {week.typowe_objawy?.length > 0 && (
          <View className="px-5 mt-5">
            <SectionTitle icon="list" title="Typowe objawy" />
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
            <SectionTitle icon="check" title="Co zrobić" />
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
            <SectionTitle icon="sparkle" title="Wskazówki" />
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

        {/* Nawigacja między tygodniami — dolna */}
        <View className="flex-row items-center gap-3 px-5 mt-8">
          <Pressable
            onPress={() => canPrev && goWeek(weekNum - 1)}
            className={`flex-1 flex-row items-center justify-center gap-2 py-3.5 rounded-card border ${
              canPrev ? 'bg-surface border-line active:opacity-70' : 'opacity-30 bg-surface border-line'
            }`}
            disabled={!canPrev}
          >
            <Icon name="back" size={16} color={colors.ink.DEFAULT} />
            <Text className="text-ink font-sans-medium text-[14px]">
              Tydzień {weekNum - 1}
            </Text>
          </Pressable>
          <Pressable
            onPress={() => canNext && goWeek(weekNum + 1)}
            className={`flex-1 flex-row items-center justify-center gap-2 py-3.5 rounded-card ${
              canNext ? 'bg-evergreen active:opacity-80' : 'opacity-30 bg-evergreen'
            }`}
            disabled={!canNext}
          >
            <Text className="text-cream font-sans-medium text-[14px]">
              Tydzień {weekNum + 1}
            </Text>
            <Icon name="arrow" size={16} color={colors.cream.DEFAULT} />
          </Pressable>
        </View>

      </ScrollView>
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
