/**
 * PieniadzeScreen.tsx — lista świadczeń z eligibility-engine.
 *
 * Pokazuje wszystkie świadczenia z personalizowanym statusem, kwotą i deadlinem.
 * Klik w świadczenie → szczegóły z opisem, krokami i deep linkiem do mZUS/banku.
 */

import React, { useMemo } from 'react';
import { View, Text, ScrollView, Pressable, Linking } from 'react-native';
import { useRouter } from 'expo-router';

import { Card, Pill, Icon, Button, type PillTone } from '@/components/ui';
import { MainScreenShell } from '@/components/layout/MainScreenShell';
import { useProfileStore } from '@/stores/profile';
import {
  checkEligibility,
  calculateTotalYearOneProjection,
  type BenefitResult,
  type EligibilityStatus,
} from '@/engine/eligibility-engine';
import benefitsData from '@/data/benefits.json';
import { colors } from '@/theme/tokens';

const STATUS_LABELS: Record<EligibilityStatus, { label: string; tone: PillTone }> = {
  eligible: { label: 'należy Ci się', tone: 'sage' },
  action: { label: 'do złożenia', tone: 'clay' },
  active: { label: 'w toku', tone: 'evergreen' },
  future: { label: 'wkrótce', tone: 'mustard' },
  na: { label: 'nie dotyczy', tone: 'neutral' },
};

export default function PieniadzeScreen() {
  const router = useRouter();
  const profile = useProfileStore();

  const { results, total } = useMemo(() => {
    const userProfile = profile.toUserProfile();
    // @ts-ignore JSON shape
    const results = checkEligibility(userProfile, benefitsData, new Date());
    return { results, total: calculateTotalYearOneProjection(results) };
  }, [profile.childBirthDate, profile.childDueDate, profile.employment, profile.firstChild, profile.hasDisability]);

  // Sortowanie: najpierw eligible/action (z deadlinem), potem active, potem future, na na końcu
  const sorted = useMemo(() => {
    const order: Record<EligibilityStatus, number> = {
      action: 0, eligible: 1, active: 2, future: 3, na: 4,
    };
    return [...results].sort((a, b) => order[a.eligibility] - order[b.eligibility]);
  }, [results]);

  return (
    <MainScreenShell>
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
        <View className="px-5 pt-3 pb-5">
          <Text className="font-serif text-[28px] text-ink leading-tight">Pieniądze</Text>
        </View>

        {/* Hero — łączna projekcja */}
        <View className="px-5 mb-6">
          <View className="bg-evergreen rounded-hero p-5">
            <Text className="text-sage-soft uppercase tracking-wider text-[11px] font-sans-medium">
              {profile.childName ? `należy Ci się w 1. roku ${profile.childName}` : 'należy Ci się'}
            </Text>
            <Text className="font-serif text-[40px] text-cream leading-none mt-2">
              {formatPLN(total)}
            </Text>
            <Text className="text-sage-soft text-[13px] mt-2 leading-snug">
              {basisText(profile)}
            </Text>
            <View className="flex-row gap-2 mt-5">
              <Pressable
                onPress={() => Linking.openURL('https://www.zus.pl/portal/logowanie.npi')}
                className="bg-cream rounded-card px-4 py-2.5 flex-row items-center gap-1.5 active:opacity-80"
              >
                <Icon name="phone" size={14} color={colors.ink.DEFAULT} />
                <Text className="text-ink text-[13px] font-sans-medium">Złóż przez mZUS</Text>
              </Pressable>
              <Pressable
                onPress={() => router.push('/timeline' as any)}
                className="border border-cream/30 rounded-card px-4 py-2.5 flex-row items-center gap-1.5 active:opacity-80"
              >
                <Icon name="layers" size={14} color={colors.cream.DEFAULT} />
                <Text className="text-cream text-[13px] font-sans-medium">Oś czasu</Text>
              </Pressable>
            </View>
          </View>
        </View>

        {/* Lista świadczeń */}
        <View className="px-5">
          <Text className="text-ink text-[15px] font-sans-medium mb-3">Twoje świadczenia</Text>
          <View className="gap-2">
            {sorted.map((result) => (
              <BenefitRow
                key={result.benefitId}
                result={result}
                onPress={() => router.push(`/benefit/${result.benefitId}` as any)}
              />
            ))}
          </View>
        </View>
      </ScrollView>
    </MainScreenShell>
  );
}

// ============ BENEFIT ROW ============

function BenefitRow({ result, onPress }: { result: BenefitResult; onPress: () => void }) {
  const status = STATUS_LABELS[result.eligibility];
  return (
    <Pressable
      onPress={onPress}
      className="bg-surface border border-line rounded-card p-4 active:opacity-80"
    >
      <View className="flex-row justify-between items-start mb-2">
        <Text className="text-ink font-sans-medium text-[15px] flex-1">{result.benefit.name}</Text>
        <Pill tone={status.tone}>{status.label}</Pill>
      </View>
      <View className="flex-row items-baseline gap-1 mb-2">
        <Text className="font-serif text-[22px] text-ink leading-none">{result.amountDisplay}</Text>
      </View>
      {result.reasoning && (
        <Text className="text-ink-soft text-[12px] leading-snug" numberOfLines={2}>
          {result.reasoning}
        </Text>
      )}
      {result.deadlineAt && (
        <View className="flex-row items-center gap-1 mt-2">
          <Icon name="clock" size={12} color={colors.terracotta.DEFAULT} />
          <Text className="text-terracotta-dark text-[11px] font-sans-medium">
            {result.deadlineDescription || `do ${result.deadlineAt.toLocaleDateString('pl-PL')}`}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

function formatPLN(amount: number): string {
  return new Intl.NumberFormat('pl-PL', {
    style: 'currency',
    currency: 'PLN',
    maximumFractionDigits: 0,
  }).format(amount);
}

function basisText(profile: ReturnType<typeof useProfileStore.getState>): string {
  const parts: string[] = [];
  if (profile.employment) {
    const labels: Record<string, string> = {
      uop: 'umowa o pracę',
      b2b_chorobowe: 'B2B z chorobowym',
      b2b_no_chorobowe: 'B2B bez chorobowego',
      zlecenie_chorobowe: 'zlecenie z chorobowym',
      zlecenie_no_chorobowe: 'zlecenie bez chorobowego',
      student: 'student',
      none: 'bez pracy',
      unemployed: 'bezrobotny/a',
    };
    parts.push(labels[profile.employment] ?? profile.employment);
  }
  parts.push(profile.firstChild ? 'pierwsze dziecko' : 'kolejne dziecko');
  if (profile.voivodeship) parts.push(`woj. ${profile.voivodeship}`);
  return parts.length ? `na podstawie: ${parts.join(' · ')}` : '';
}
