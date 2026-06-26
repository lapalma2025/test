/**
 * app/benefit/[id].tsx — szczegóły konkretnego świadczenia.
 *
 * Pokazuje: opis, kwotę, kryteria, krok po kroku, częste błędy, podstawę prawną.
 * CTA: deep link do mZUS / bankowości / Emp@tii / urzędu gminy.
 */

import React from 'react';
import { View, Text, ScrollView, Pressable, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { Button, Pill, Icon, type PillTone } from '@/components/ui';
import { useProfileStore } from '@/stores/profile';
import { checkEligibility, type EligibilityStatus } from '@/engine/eligibility-engine';
import benefitsData from '@/data/benefits.json';
import { colors } from '@/theme/tokens';

const STATUS_LABELS: Record<EligibilityStatus, { label: string; tone: PillTone }> = {
  eligible: { label: 'należy Ci się', tone: 'sage' },
  action: { label: 'do złożenia', tone: 'clay' },
  active: { label: 'w toku', tone: 'evergreen' },
  future: { label: 'wkrótce', tone: 'mustard' },
  na: { label: 'nie dotyczy', tone: 'neutral' },
};

// Deep linki — Android intents fallbackują do Play Store przez Linking.openURL
const DEEP_LINKS: Record<string, { primary: string; primaryLabel: string; fallback?: string }> = {
  '800plus': {
    primary: 'market://details?id=pl.zus.eskladka',
    primaryLabel: 'Otwórz mZUS',
    fallback: 'https://www.zus.pl/portal/logowanie.npi',
  },
  'macierzynski': {
    primary: 'https://www.zus.pl/portal/logowanie.npi',
    primaryLabel: 'Otwórz PUE ZUS',
  },
  'aktywni-rodzice-w-pracy': {
    primary: 'market://details?id=pl.zus.eskladka',
    primaryLabel: 'Otwórz mZUS',
    fallback: 'https://www.zus.pl/portal/logowanie.npi',
  },
  'aktywnie-w-zlobku': {
    primary: 'market://details?id=pl.zus.eskladka',
    primaryLabel: 'Otwórz mZUS',
    fallback: 'https://www.zus.pl/portal/logowanie.npi',
  },
  'rko': {
    primary: 'market://details?id=pl.zus.eskladka',
    primaryLabel: 'Otwórz mZUS',
  },
  'becikowe': {
    primary: 'https://wnioski.mpips.gov.pl/',
    primaryLabel: 'Otwórz Emp@tię',
  },
  'kosiniakowe': {
    primary: 'https://wnioski.mpips.gov.pl/',
    primaryLabel: 'Otwórz Emp@tię',
  },
};

export default function BenefitDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const profile = useProfileStore();

  // @ts-ignore JSON shape
  const benefit = benefitsData.benefits.find((b: any) => b.id === id);
  // @ts-ignore
  const results = checkEligibility(profile.toUserProfile(), benefitsData, new Date());
  const result = results.find((r) => r.benefitId === id);

  if (!benefit || !result) {
    return (
      <SafeAreaView className="flex-1 bg-cream items-center justify-center">
        <Text className="text-ink-soft">Nie znaleziono świadczenia.</Text>
      </SafeAreaView>
    );
  }

  const status = STATUS_LABELS[result.eligibility];
  const deepLink = DEEP_LINKS[id ?? ''];
  const summary = (benefit as { summary?: string }).summary;

  const handlePrimaryAction = async () => {
    if (!deepLink) return;
    try {
      const canOpen = await Linking.canOpenURL(deepLink.primary);
      if (canOpen) {
        await Linking.openURL(deepLink.primary);
      } else if (deepLink.fallback) {
        await Linking.openURL(deepLink.fallback);
      }
    } catch (e) {
      if (deepLink.fallback) await Linking.openURL(deepLink.fallback);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-cream" edges={['top', 'bottom']}>
      {/* Topbar */}
      <View className="flex-row items-center px-4 py-3">
        <Pressable
          onPress={() => router.back()}
          className="w-10 h-10 items-center justify-center rounded-full"
        >
          <Icon name="back" size={20} color={colors.ink.DEFAULT} />
        </Pressable>
        <Text className="flex-1 text-center text-ink font-sans-medium text-[15px]">Świadczenie</Text>
        <View className="w-10" />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 24 }} className="flex-1">
        <View className="px-5">
          <Pill tone={status.tone}>{status.label}</Pill>
          <Text className="font-serif text-[28px] text-ink leading-tight mt-3">
            {benefit.name}
          </Text>
          {summary && (
            <Text className="text-ink-soft text-[14px] leading-snug mt-2">{summary}</Text>
          )}

          {/* Kwota */}
          <View className="bg-evergreen rounded-hero p-5 mt-5">
            <Text className="font-serif text-[40px] text-cream leading-none">
              {result.amountDisplay}
            </Text>
            <Text className="text-sage-soft text-[13px] mt-1">{benefit.unit_display}</Text>
          </View>

          {/* Info grid */}
          <View className="flex-row gap-2 mt-4">
            <InfoCell icon="pin" k="Gdzie złożyć" v={benefit.channel_display ?? benefit.channel} />
            <InfoCell icon="clock" k="Termin" v={result.deadlineDescription || benefit.deadline_rule?.description || '—'} />
          </View>

          {/* Reasoning */}
          {result.reasoning && (
            <View className="bg-terracotta-soft/50 border border-terracotta-soft rounded-card p-3 mt-4 flex-row gap-2.5 items-start">
              <Icon name="info" size={16} color={colors.terracotta.dark} />
              <Text className="text-terracotta-dark text-[13px] flex-1 leading-snug">
                {result.reasoning}
              </Text>
            </View>
          )}

          {/* Kryteria */}
          {benefit.criteria && benefit.criteria.length > 0 && (
            <Section title="Kto może dostać">
              {benefit.criteria.map((c: string, i: number) => (
                <BulletPoint key={i}>{c}</BulletPoint>
              ))}
            </Section>
          )}

          {/* Wymagane dokumenty */}
          {benefit.required_documents && benefit.required_documents.length > 0 && (
            <Section title="Co przygotować">
              {benefit.required_documents.map((d: string, i: number) => (
                <View key={i} className="flex-row gap-2 items-start py-1.5">
                  <Icon name="file" size={14} color={colors.terracotta.DEFAULT} />
                  <Text className="text-ink text-[14px] flex-1 leading-snug">{d}</Text>
                </View>
              ))}
            </Section>
          )}

          {/* Kroki */}
          {benefit.steps && benefit.steps.length > 0 && (
            <Section title="Jak złożyć krok po kroku">
              {benefit.steps.map((s: string, i: number) => (
                <View key={i} className="flex-row gap-3 items-start py-1.5">
                  <View className="w-6 h-6 bg-sage-soft rounded-full items-center justify-center">
                    <Text className="text-evergreen font-mono text-[12px]">{i + 1}</Text>
                  </View>
                  <Text className="text-ink text-[14px] flex-1 leading-snug">{s}</Text>
                </View>
              ))}
            </Section>
          )}

          {/* Częste błędy */}
          {benefit.common_mistakes && benefit.common_mistakes.length > 0 && (
            <Section title="Częste błędy">
              {benefit.common_mistakes.map((m: string, i: number) => (
                <View key={i} className="flex-row gap-2 items-start py-1.5">
                  <Text className="text-danger text-[14px]">✕</Text>
                  <Text className="text-ink text-[14px] flex-1 leading-snug">{m}</Text>
                </View>
              ))}
            </Section>
          )}

          {/* Podstawa prawna */}
          {benefit.legal_basis && (
            <Section title="Podstawa prawna">
              <Text className="text-ink-soft text-[12px] leading-snug">
                {benefit.legal_basis.act}
                {benefit.legal_basis.journal && `\n${benefit.legal_basis.journal}`}
                {benefit.legal_basis.article && ` · ${benefit.legal_basis.article}`}
              </Text>
              {benefit.legal_basis.url && (
                <Pressable onPress={() => Linking.openURL(benefit.legal_basis.url)} className="mt-2">
                  <Text className="text-sage text-[13px] font-sans-medium">Otwórz w ISAP →</Text>
                </Pressable>
              )}
            </Section>
          )}
        </View>
      </ScrollView>

      {/* Footer CTA */}
      <View className="px-5 py-4 border-t border-line">
        {result.eligibility === 'na' ? (
          <Button variant="light" full>Nie dotyczy Twojej sytuacji</Button>
        ) : deepLink ? (
          <Button variant="primary" full icon="phone" iconRight="arrow" onPress={handlePrimaryAction}>
            {deepLink.primaryLabel}
          </Button>
        ) : (
          <Button variant="primary" full>Dowiedz się więcej</Button>
        )}
      </View>
    </SafeAreaView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View className="mt-6">
      <Text className="text-ink text-[14px] font-sans-medium uppercase tracking-wide text-ink-soft mb-2">
        {title}
      </Text>
      <View>{children}</View>
    </View>
  );
}

function BulletPoint({ children }: { children: string }) {
  return (
    <View className="flex-row gap-2 items-start py-1.5">
      <Text className="text-sage text-[14px]">•</Text>
      <Text className="text-ink text-[14px] flex-1 leading-snug">{children}</Text>
    </View>
  );
}

function InfoCell({ icon, k, v }: { icon: any; k: string; v: string }) {
  return (
    <View className="flex-1 bg-surface border border-line rounded-card p-3 gap-1">
      <View className="flex-row items-center gap-1.5">
        <Icon name={icon} size={13} color={colors.ink.faint} />
        <Text className="text-ink-faint text-[11px] uppercase tracking-wide">{k}</Text>
      </View>
      <Text className="text-ink text-[13px] font-sans-medium leading-snug" numberOfLines={3}>
        {v}
      </Text>
    </View>
  );
}
