/**
 * app/compare.tsx — porównanie 2-3 szkół lub szpitali w tabeli.
 */

import React from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { Icon, Button, Pill } from '@/components/ui';
import { useHospitals, useSchools } from '@/hooks/useHospitals';
import { colors } from '@/theme/tokens';

interface ComparisonRow {
  k: string;
  getValue: (item: any) => string;
  highlight?: 'best_high' | 'best_low' | 'none';
}

const SCHOOL_ROWS: ComparisonRow[] = [
  { k: 'Typ', getValue: (s) => s.type === 'online' ? 'Online' : s.type === 'hybrid' ? 'Hybryda' : 'Stacjonarna' },
  { k: 'Koszt', getValue: (s) => s.is_nfz_free ? (s.payment ?? 'Bezpłatna') : (s.payment ?? (s.price_pln ? `${s.price_pln} zł` : 'Płatna')), highlight: 'best_low' },
  { k: 'Ocena', getValue: (s) => s.rating ? `${s.rating.toFixed(1).replace('.', ',')} ★` : '—', highlight: 'best_high' },
  { k: 'Opinie', getValue: (s) => s.reviews_count > 0 ? `${s.reviews_count}` : '—', highlight: 'best_high' },
  { k: 'Harmonogram', getValue: (s) => s.schedule ?? '—' },
  { k: 'Język', getValue: (s) => s.lang?.join(', ').toUpperCase() ?? 'PL' },
  { k: 'Miasto', getValue: (s) => s.city ?? '—' },
];

const HOSPITAL_ROWS: ComparisonRow[] = [
  { k: 'Miasto', getValue: (h) => h.city },
  { k: 'Województwo', getValue: (h) => h.voivodeship },
  { k: 'Znieczulenie', getValue: (h) => h.has_anesthesia ? 'Tak' : '—' },
  { k: 'Ocena', getValue: (h) => h.rating ? `${h.rating.toFixed(1).replace('.', ',')} ★` : '—', highlight: 'best_high' },
  { k: 'Opinie', getValue: (h) => h.reviews_count > 0 ? `${h.reviews_count}` : '—', highlight: 'best_high' },
  { k: 'Telefon', getValue: (h) => h.phone ?? '—' },
];

export default function CompareScreen() {
  const router = useRouter();
  const { ids: idsParam, type } = useLocalSearchParams<{ ids: string; type: string }>();
  const ids = (idsParam ?? '').split(',').filter(Boolean);

  const isHospitals = type === 'hospitals';
  const hospitalsQuery = useHospitals();
  const schoolsQuery = useSchools();

  const items = isHospitals
    ? (hospitalsQuery.data ?? []).filter((h) => ids.includes(h.id))
    : (schoolsQuery.data ?? []).filter((s) => ids.includes(s.id));

  const rows = isHospitals ? HOSPITAL_ROWS : SCHOOL_ROWS;
  const isLoading = isHospitals ? hospitalsQuery.isLoading : schoolsQuery.isLoading;

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-cream items-center justify-center">
        <ActivityIndicator color={colors.evergreen.DEFAULT} />
      </SafeAreaView>
    );
  }

  if (items.length < 2) {
    return (
      <SafeAreaView className="flex-1 bg-cream items-center justify-center">
        <Text className="text-ink-soft">Wybierz co najmniej 2 do porównania.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-cream" edges={['top', 'bottom']}>
      <View className="flex-row items-center px-4 py-3">
        <Pressable onPress={() => router.back()} className="w-10 h-10 items-center justify-center">
          <Icon name="back" size={20} color={colors.ink.DEFAULT} />
        </Pressable>
        <Text className="flex-1 text-center text-ink font-sans-medium text-[15px]">Porównanie</Text>
        <View className="w-10" />
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 24 }}>
        {/* Header z nazwami */}
        <View className="flex-row px-3 mt-2">
          <View style={{ width: 100 }} />
          {items.map((it) => (
            <View key={it.id} className="flex-1 px-2">
              <Text className="text-ink font-sans-medium text-[13px] leading-tight" numberOfLines={3}>
                {it.name}
              </Text>
              {!isHospitals && (
                <View className="mt-1">
                  <Pill tone={(it as any).is_nfz_free ? 'sage' : 'mustard'}>
                    {(it as any).type === 'online' ? 'Online' : (it as any).type === 'hybrid' ? 'Hybryda' : 'Stacjonarna'}
                  </Pill>
                </View>
              )}
              <Pressable
                onPress={() => router.push(`/${isHospitals ? 'school' : 'school'}/${it.id}` as any)}
                className="mt-2 bg-evergreen/10 rounded-card px-2 py-1 items-center active:opacity-70"
              >
                <Text className="text-evergreen text-[11px] font-sans-medium">Wybierz</Text>
              </Pressable>
            </View>
          ))}
        </View>

        <View className="h-px bg-line mx-4 my-3" />

        {/* Wiersze cech */}
        {rows.map((row, i) => {
          const values = items.map((it) => row.getValue(it));
          const bestIdx = row.highlight && row.highlight !== 'none' ? getBestIndex(values, row.highlight) : -1;

          return (
            <View key={row.k} className={`flex-row px-3 py-2 ${i % 2 === 0 ? 'bg-surface/40' : ''}`}>
              <View style={{ width: 100 }}>
                <Text className="text-ink-faint text-[12px]">{row.k}</Text>
              </View>
              {values.map((v, idx) => (
                <View key={idx} className="flex-1 px-2">
                  <Text
                    className={`text-[13px] ${
                      idx === bestIdx ? 'text-evergreen font-sans-medium' : 'text-ink'
                    }`}
                  >
                    {v}
                  </Text>
                </View>
              ))}
            </View>
          );
        })}
      </ScrollView>

      <View className="px-5 py-4 border-t border-line">
        <Button
          variant="primary"
          full
          iconRight="arrow"
          onPress={() => router.push(`/school/${items[0]?.id}` as any)}
        >
          {`Otwórz: ${items[0]?.name.split(' ').slice(0, 3).join(' ') ?? 'placówkę'}`}
        </Button>
      </View>
    </SafeAreaView>
  );
}

function getBestIndex(values: string[], mode: 'best_high' | 'best_low'): number {
  const numbers = values.map((v) => {
    const m = v.match(/[\d,]+/);
    return m ? parseFloat(m[0].replace(',', '.')) : NaN;
  });

  const valid = numbers.map((n, i) => ({ n, i })).filter((x) => !isNaN(x.n));
  if (valid.length === 0) return -1;

  if (mode === 'best_high') {
    return valid.reduce((max, cur) => (cur.n > max.n ? cur : max)).i;
  }
  return valid.reduce((min, cur) => (cur.n < min.n ? cur : min)).i;
}
