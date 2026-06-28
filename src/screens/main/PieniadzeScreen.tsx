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
import { useT } from '@/i18n';
import { useLanguageStore } from '@/stores/language';

export default function PieniadzeScreen() {
  const router = useRouter();
  const profile = useProfileStore();
  const t = useT();
  const lang = useLanguageStore((s) => s.lang);

  const STATUS_LABELS: Record<EligibilityStatus, { label: string; tone: PillTone }> = {
    eligible: { label: t.money.statusEligible, tone: 'sage' },
    action: { label: t.money.statusAction, tone: 'clay' },
    active: { label: t.money.statusActive, tone: 'evergreen' },
    future: { label: t.money.statusFuture, tone: 'mustard' },
    na: { label: t.money.statusNa, tone: 'neutral' },
  };

  const { results, total } = useMemo(() => {
    const userProfile = profile.toUserProfile();
    // @ts-ignore JSON shape
    const results = checkEligibility(userProfile, benefitsData, new Date());
    return { results, total: calculateTotalYearOneProjection(results) };
  }, [profile.childBirthDate, profile.childDueDate, profile.employment, profile.firstChild, profile.hasDisability]);

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
          <Text className="font-serif text-[28px] text-ink leading-tight">{t.money.title}</Text>
        </View>

        {/* Hero — total projection */}
        <View className="px-5 mb-6">
          <View className="bg-evergreen rounded-hero p-5">
            <Text className="text-sage-soft uppercase tracking-wider text-[11px] font-sans-medium">
              {t.money.entitledInYear1(profile.childName)}
            </Text>
            <Text className="font-serif text-[40px] text-cream leading-none mt-2">
              {formatPLN(total)}
            </Text>
            <Text className="text-sage-soft text-[13px] mt-2 leading-snug">
              {basisText(profile, t, lang)}
            </Text>
            <View className="flex-row gap-2 mt-5">
              <Pressable
                onPress={() => Linking.openURL('https://www.zus.pl/portal/logowanie.npi')}
                className="bg-cream rounded-card px-4 py-2.5 flex-row items-center gap-1.5 active:opacity-80"
              >
                <Icon name="phone" size={14} color={colors.ink.DEFAULT} />
                <Text className="text-ink text-[13px] font-sans-medium">{t.money.applyViaZus}</Text>
              </Pressable>
            </View>
          </View>
        </View>

        {/* Kalkulator urlopowy */}
        <View className="px-5 mb-4">
          <Pressable
            onPress={() => router.push('/kalkulator-finansowy' as any)}
            className="bg-surface border border-line rounded-card px-4 py-3.5 flex-row items-center gap-3 active:opacity-80"
          >
            <View className="w-10 h-10 bg-sage-soft rounded-full items-center justify-center">
              <Icon name="activity" size={20} color={colors.evergreen.DEFAULT} />
            </View>
            <View className="flex-1">
              <Text className="text-ink font-sans-medium text-[14px]">Kalkulator urlopowy</Text>
              <Text className="text-ink-soft text-[12px] mt-0.5">Wpisz zarobki → oblicz zasiłek z ZUS</Text>
            </View>
            <Icon name="chevron" size={16} color={colors.ink.faint} />
          </Pressable>
        </View>

        {/* Benefits list */}
        <View className="px-5">
          <Text className="text-ink text-[15px] font-sans-medium mb-3">{t.money.yourBenefits}</Text>
          <View className="gap-2">
            {sorted.map((result) => (
              <BenefitRow
                key={result.benefitId}
                result={result}
                statusLabel={STATUS_LABELS[result.eligibility]}
                deadlinePrefix={t.money.deadlinePrefix}
                lang={lang}
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

function BenefitRow({
  result,
  statusLabel,
  deadlinePrefix,
  lang,
  onPress,
}: {
  result: BenefitResult;
  statusLabel: { label: string; tone: PillTone };
  deadlinePrefix: (date: string) => string;
  lang: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="bg-surface border border-line rounded-card p-4 active:opacity-80"
    >
      <View className="flex-row justify-between items-start mb-2">
        <Text className="text-ink font-sans-medium text-[15px] flex-1">{result.benefit.name}</Text>
        <Pill tone={statusLabel.tone}>{statusLabel.label}</Pill>
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
            {result.deadlineDescription || deadlinePrefix(
              result.deadlineAt.toLocaleDateString(lang === 'en' ? 'en-GB' : 'pl-PL')
            )}
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

function basisText(
  profile: ReturnType<typeof useProfileStore.getState>,
  t: ReturnType<typeof useT>,
  lang: string,
): string {
  const parts: string[] = [];
  if (profile.employment) {
    const labels: Record<string, string> = {
      uop: t.money.empUop,
      b2b_chorobowe: t.money.empB2bSick,
      b2b_no_chorobowe: t.money.empB2bNoSick,
      zlecenie_chorobowe: t.money.empZlecenieSick,
      zlecenie_no_chorobowe: t.money.empZlecenieNoSick,
      student: t.money.empStudent,
      none: t.money.empNone,
      unemployed: t.money.empUnemployed,
    };
    parts.push(labels[profile.employment] ?? profile.employment);
  }
  parts.push(profile.firstChild ? t.money.firstChildBasis : t.money.nextChildBasis);
  if (profile.voivodeship) parts.push(`${t.money.provincePrefix} ${profile.voivodeship}`);
  return parts.length ? `${t.money.basisPrefix} ${parts.join(' · ')}` : '';
}
