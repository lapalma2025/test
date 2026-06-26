import React, { useState } from 'react';
import { View, Text, ScrollView, TextInput, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { Button, Progress, Icon, Field, type IconName } from '@/components/ui';
import { useProfileStore } from '@/stores/profile';
import { checkEligibility, calculateTotalYearOneProjection, type EmploymentType } from '@/engine/eligibility-engine';
import benefitsData from '@/data/benefits.json';
import { colors } from '@/theme/tokens';
import { useT } from '@/i18n';

const VOIVODESHIPS = [
  'dolnośląskie', 'kujawsko-pomorskie', 'lubelskie', 'lubuskie',
  'łódzkie', 'małopolskie', 'mazowieckie', 'opolskie',
  'podkarpackie', 'podlaskie', 'pomorskie', 'śląskie',
  'świętokrzyskie', 'warmińsko-mazurskie', 'wielkopolskie', 'zachodniopomorskie',
] as const;

const TOTAL_STEPS = 5;

// ============ OPTION CARD ============

interface OptionProps {
  title: string;
  note?: string;
  icon?: IconName;
  active: boolean;
  onPress: () => void;
}

function Option({ title, note, icon, active, onPress }: OptionProps) {
  return (
    <Pressable
      onPress={onPress}
      className={`flex-row items-center gap-3 p-4 rounded-card border ${
        active ? 'border-evergreen bg-sage-soft/40' : 'border-line bg-surface'
      } active:opacity-80`}
    >
      {icon && (
        <View
          className={`items-center justify-center rounded-card ${
            active ? 'bg-evergreen' : 'bg-cream'
          }`}
          style={{ width: 40, height: 40 }}
        >
          <Icon
            name={icon}
            size={20}
            color={active ? colors.cream.DEFAULT : colors.ink.DEFAULT}
          />
        </View>
      )}
      <View className="flex-1">
        <Text className="text-ink font-sans-medium text-[15px]">{title}</Text>
        {note && <Text className="text-ink-soft text-[13px] mt-0.5">{note}</Text>}
      </View>
      <View
        className={`items-center justify-center rounded-full border-2 ${
          active ? 'bg-evergreen border-evergreen' : 'bg-cream border-line-strong'
        }`}
        style={{ width: 22, height: 22 }}
      >
        {active && <Icon name="check" size={14} color={colors.cream.DEFAULT} strokeWidth={2.6} />}
      </View>
    </Pressable>
  );
}

// ============ MAIN SCREEN ============

export default function OnboardingScreen() {
  const router = useRouter();
  const profile = useProfileStore();
  const t = useT();
  const [step, setStep] = useState(0);

  const [stage, setStage] = useState<'preg' | 'born'>(profile.childBirthDate ? 'born' : 'preg');
  const [dateInput, setDateInput] = useState<string>(
    profile.childBirthDate ?? profile.childDueDate ?? ''
  );
  const [firstChild, setFirstChild] = useState<boolean>(profile.firstChild);
  const [employment, setEmployment] = useState<EmploymentType>(profile.employment);
  const [voivodeship, setVoivodeship] = useState<string>(profile.voivodeship);
  const [city, setCity] = useState<string>(profile.city);
  const [parentName, setParentName] = useState<string>(profile.parentName);
  const [childName, setChildName] = useState<string>(profile.childName);
  const [partnerIncluded, setPartnerIncluded] = useState<boolean>(profile.partnerIncluded);
  const [partnerName, setPartnerName] = useState<string>(profile.partnerName ?? '');

  const next = () => {
    if (step < TOTAL_STEPS) {
      commitStep();
      setStep(step + 1);
    } else {
      commitFinal();
      profile.completeOnboarding();
      router.replace('/(tabs)/trasa');
    }
  };

  const back = () => {
    if (step > 0) setStep(step - 1);
  };

  const commitStep = () => {
    profile.setMany({
      childBirthDate: stage === 'born' ? dateInput || null : null,
      childDueDate: stage === 'preg' ? dateInput || null : null,
      firstChild,
      employment,
      voivodeship,
      city,
      parentName,
      childName,
      partnerIncluded,
      partnerName: partnerIncluded ? partnerName : null,
    });
  };

  const commitFinal = () => { commitStep(); };

  const canProceed = (): boolean => {
    switch (step) {
      case 0: return dateInput.length > 0;
      case 1: return true;
      case 2: return true;
      case 3: return voivodeship.length > 0 && city.length > 0;
      case 4: return !partnerIncluded || partnerName.length > 0;
      default: return true;
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-cream" edges={['top', 'bottom']}>
      {/* Header with progress bar */}
      <View className="flex-row items-center gap-3 px-4 py-3">
        <Pressable
          onPress={back}
          className="w-10 h-10 items-center justify-center rounded-full"
          disabled={step === 0}
        >
          {step > 0 && <Icon name="back" size={20} color={colors.ink.DEFAULT} />}
        </Pressable>
        <View className="flex-1">
          <Progress value={step + 1} max={TOTAL_STEPS + 1} />
        </View>
        {step < TOTAL_STEPS ? (
          <Text className="font-mono text-[12px] text-ink-faint">
            {t.onboarding.step(step + 1, TOTAL_STEPS)}
          </Text>
        ) : (
          <Icon name="heart" size={18} color={colors.evergreen.DEFAULT} />
        )}
      </View>

      <ScrollView className="flex-1 px-5" contentContainerStyle={{ paddingBottom: 20 }}>
        {step === 0 && (
          <StepStage
            stage={stage}
            setStage={setStage}
            dateInput={dateInput}
            setDateInput={setDateInput}
            childName={childName}
            setChildName={setChildName}
          />
        )}
        {step === 1 && <StepParity firstChild={firstChild} setFirstChild={setFirstChild} />}
        {step === 2 && <StepEmployment employment={employment} setEmployment={setEmployment} />}
        {step === 3 && (
          <StepLocation
            voivodeship={voivodeship}
            setVoivodeship={setVoivodeship}
            city={city}
            setCity={setCity}
            parentName={parentName}
            setParentName={setParentName}
          />
        )}
        {step === 4 && (
          <StepPartner
            partnerIncluded={partnerIncluded}
            setPartnerIncluded={setPartnerIncluded}
            partnerName={partnerName}
            setPartnerName={setPartnerName}
          />
        )}
        {step === 5 && <StepSummary />}
      </ScrollView>

      <View className="px-5 py-4 border-t border-line">
        <Button
          variant="primary"
          full
          iconRight={step < TOTAL_STEPS ? 'arrow' : 'check'}
          disabled={!canProceed()}
          onPress={next}
        >
          {step < TOTAL_STEPS ? t.onboarding.next : t.onboarding.continueRoute}
        </Button>
      </View>
    </SafeAreaView>
  );
}

// ============ STEPS ============

interface StepStageProps {
  stage: 'preg' | 'born';
  setStage: (s: 'preg' | 'born') => void;
  dateInput: string;
  setDateInput: (v: string) => void;
  childName: string;
  setChildName: (v: string) => void;
}

function StepStage({ stage, setStage, dateInput, setDateInput, childName, setChildName }: StepStageProps) {
  const t = useT();
  return (
    <View className="gap-4 py-4">
      <Text className="font-serif text-[28px] text-ink leading-tight">
        {t.onboarding.stepStageTitle}
      </Text>
      <Text className="text-ink-soft text-[15px]">
        {t.onboarding.stepStageSubtitle}
      </Text>

      <View className="gap-2.5 mt-2">
        <Option
          icon="heart"
          title={t.onboarding.pregnant}
          note={t.onboarding.pregnantNote}
          active={stage === 'preg'}
          onPress={() => setStage('preg')}
        />
        <Option
          icon="baby"
          title={t.onboarding.babyBorn}
          note={t.onboarding.babyBornNote}
          active={stage === 'born'}
          onPress={() => setStage('born')}
        />
      </View>

      <Field label={stage === 'born' ? t.onboarding.birthDateLabel : t.onboarding.dueDateLabelInput}>
        <TextInput
          value={dateInput}
          onChangeText={setDateInput}
          placeholder="2026-05-26"
          className="bg-surface border border-line rounded-card px-4 py-3.5 text-[15px] text-ink"
          placeholderTextColor={colors.ink.faint}
        />
      </Field>

      {stage === 'born' && (
        <Field label={t.onboarding.childNameLabel}>
          <TextInput
            value={childName}
            onChangeText={setChildName}
            placeholder={t.onboarding.childNamePlaceholder}
            className="bg-surface border border-line rounded-card px-4 py-3.5 text-[15px] text-ink"
            placeholderTextColor={colors.ink.faint}
          />
        </Field>
      )}
    </View>
  );
}

function StepParity({ firstChild, setFirstChild }: { firstChild: boolean; setFirstChild: (v: boolean) => void }) {
  const t = useT();
  return (
    <View className="gap-4 py-4">
      <Text className="font-serif text-[28px] text-ink leading-tight">
        {t.onboarding.stepParityTitle}
      </Text>
      <Text className="text-ink-soft text-[15px]">
        {t.onboarding.stepParitySubtitle}
      </Text>
      <View className="gap-2.5 mt-2">
        <Option
          title={t.onboarding.firstChildYes}
          note={t.onboarding.firstChildYesNote}
          active={firstChild}
          onPress={() => setFirstChild(true)}
        />
        <Option
          title={t.onboarding.nextChild}
          note={t.onboarding.nextChildNote}
          active={!firstChild}
          onPress={() => setFirstChild(false)}
        />
      </View>
    </View>
  );
}

function StepEmployment({ employment, setEmployment }: { employment: EmploymentType; setEmployment: (e: EmploymentType) => void }) {
  const t = useT();
  const EMPLOYMENT_OPTIONS: Array<{ id: EmploymentType; title: string; note: string }> = [
    { id: 'uop', title: t.onboarding.empUop, note: t.onboarding.empUopNote },
    { id: 'b2b_chorobowe', title: t.onboarding.empB2bSick, note: t.onboarding.empB2bSickNote },
    { id: 'b2b_no_chorobowe', title: t.onboarding.empB2bNoSick, note: t.onboarding.empB2bNoSickNote },
    { id: 'zlecenie_chorobowe', title: t.onboarding.empZlecenieSick, note: t.onboarding.empZlecenieSickNote },
    { id: 'zlecenie_no_chorobowe', title: t.onboarding.empZlecenieNoSick, note: t.onboarding.empZlecenieNoSickNote },
    { id: 'student', title: t.onboarding.empStudent, note: t.onboarding.empStudentNote },
    { id: 'none', title: t.onboarding.empNone, note: t.onboarding.empNoneNote },
  ];

  return (
    <View className="gap-4 py-4">
      <Text className="font-serif text-[28px] text-ink leading-tight">
        {t.onboarding.stepEmploymentTitle}
      </Text>
      <Text className="text-ink-soft text-[15px]">
        {t.onboarding.stepEmploymentSubtitle}
      </Text>
      <View className="gap-2.5 mt-2">
        {EMPLOYMENT_OPTIONS.map((opt) => (
          <Option
            key={opt.id}
            title={opt.title}
            note={opt.note}
            active={employment === opt.id}
            onPress={() => setEmployment(opt.id)}
          />
        ))}
      </View>
    </View>
  );
}

function StepLocation({
  voivodeship, setVoivodeship, city, setCity, parentName, setParentName,
}: {
  voivodeship: string; setVoivodeship: (v: string) => void;
  city: string; setCity: (v: string) => void;
  parentName: string; setParentName: (v: string) => void;
}) {
  const t = useT();
  return (
    <View className="gap-4 py-4">
      <Text className="font-serif text-[28px] text-ink leading-tight">
        {t.onboarding.stepLocationTitle}
      </Text>
      <Text className="text-ink-soft text-[15px]">
        {t.onboarding.stepLocationSubtitle}
      </Text>

      <Field label={t.onboarding.parentNameLabel}>
        <TextInput
          value={parentName}
          onChangeText={setParentName}
          placeholder={t.onboarding.parentNamePlaceholder}
          className="bg-surface border border-line rounded-card px-4 py-3.5 text-[15px] text-ink"
          placeholderTextColor={colors.ink.faint}
        />
      </Field>

      <Field label={t.onboarding.voivodeshipLabel}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
          {VOIVODESHIPS.map((v) => (
            <Pressable
              key={v}
              onPress={() => setVoivodeship(v)}
              className={`px-3.5 py-2.5 rounded-full ${
                voivodeship === v ? 'bg-evergreen' : 'bg-surface border border-line'
              }`}
            >
              <Text className={`text-[13px] font-sans-medium ${voivodeship === v ? 'text-cream' : 'text-ink'}`}>
                {v}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </Field>

      <Field label={t.onboarding.cityLabel}>
        <TextInput
          value={city}
          onChangeText={setCity}
          placeholder={t.onboarding.cityPlaceholder}
          className="bg-surface border border-line rounded-card px-4 py-3.5 text-[15px] text-ink"
          placeholderTextColor={colors.ink.faint}
        />
      </Field>
    </View>
  );
}

function StepPartner({
  partnerIncluded, setPartnerIncluded, partnerName, setPartnerName,
}: {
  partnerIncluded: boolean; setPartnerIncluded: (v: boolean) => void;
  partnerName: string; setPartnerName: (v: string) => void;
}) {
  const t = useT();
  return (
    <View className="gap-4 py-4">
      <Text className="font-serif text-[28px] text-ink leading-tight">
        {t.onboarding.stepPartnerTitle}
      </Text>
      <Text className="text-ink-soft text-[15px]">
        {t.onboarding.stepPartnerSubtitle}
      </Text>
      <View className="gap-2.5 mt-2">
        <Option
          icon="user"
          title={t.onboarding.partnerYes}
          note={t.onboarding.partnerYesNote}
          active={partnerIncluded}
          onPress={() => setPartnerIncluded(true)}
        />
        <Option
          title={t.onboarding.partnerNo}
          note={t.onboarding.partnerNoNote}
          active={!partnerIncluded}
          onPress={() => setPartnerIncluded(false)}
        />
      </View>
      {partnerIncluded && (
        <Field label={t.onboarding.partnerNameLabel}>
          <TextInput
            value={partnerName}
            onChangeText={setPartnerName}
            placeholder={t.onboarding.partnerNamePlaceholder}
            className="bg-surface border border-line rounded-card px-4 py-3.5 text-[15px] text-ink"
            placeholderTextColor={colors.ink.faint}
          />
        </Field>
      )}
    </View>
  );
}

function StepSummary() {
  const profile = useProfileStore();
  const router = useRouter();
  const t = useT();
  const userProfile = profile.toUserProfile();
  // @ts-ignore - JSON import shape
  const results = checkEligibility(userProfile, benefitsData, new Date());
  const total = calculateTotalYearOneProjection(results);
  const employmentLabel = getEmploymentLabel(profile.employment, t);

  const topBenefits = results
    .filter(r => ['eligible', 'action', 'active', 'future'].includes(r.eligibility))
    .slice(0, 5);

  const totalStr = new Intl.NumberFormat('pl-PL', {
    style: 'currency', currency: 'PLN', maximumFractionDigits: 0,
  }).format(total);

  return (
    <View className="gap-4 py-4">
      {/* Hero — duża kwota */}
      <View className="bg-evergreen rounded-hero p-5">
        <Text className="text-sage-soft text-[11px] font-sans-medium uppercase tracking-wider">
          {t.onboarding.stepSummaryTitle(profile.parentName)}
        </Text>
        <Text className="font-serif text-[44px] text-cream leading-tight mt-1">
          {total > 0 ? totalStr : '—'}
        </Text>
        <Text className="text-sage-soft text-[12px] mt-2 leading-snug">
          {t.onboarding.stepSummarySubtitle}
        </Text>
      </View>

      {/* Lista świadczeń */}
      {topBenefits.length > 0 && (
        <View className="bg-surface border border-line rounded-card p-4 gap-2.5">
          <Text className="text-ink-soft text-[11px] font-sans-medium uppercase tracking-wide mb-1">
            Co Ci przysługuje
          </Text>
          {topBenefits.map(r => (
            <View key={r.benefitId} className="flex-row items-center gap-2.5">
              <View className="w-5 h-5 bg-sage-soft rounded-full items-center justify-center flex-shrink-0">
                <Icon name="check" size={11} color={colors.evergreen.DEFAULT} strokeWidth={2.5} />
              </View>
              <Text className="flex-1 text-ink text-[13px]" numberOfLines={1}>{r.benefit.name}</Text>
              <Text className="text-ink-soft text-[12px] font-mono">{r.amountDisplay}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Link do kalkulatora urlopowego */}
      <Pressable
        onPress={() => router.push('/kalkulator-finansowy' as any)}
        className="bg-sage-soft border border-evergreen/20 rounded-card px-4 py-3.5 flex-row items-center gap-2.5 active:opacity-75"
      >
        <Icon name="activity" size={18} color={colors.evergreen.DEFAULT} />
        <View className="flex-1">
          <Text className="text-evergreen font-sans-medium text-[14px]">Oblicz zasiłek urlopowy</Text>
          <Text className="text-ink-soft text-[12px] mt-0.5">kwota zależy od Twoich zarobków brutto</Text>
        </View>
        <Icon name="arrow" size={16} color={colors.evergreen.DEFAULT} />
      </Pressable>

      {/* Podsumowanie profilu */}
      <View className="bg-surface border border-line rounded-card p-4 gap-2.5">
        <SumRow
          k={t.onboarding.summaryStage}
          v={profile.childBirthDate ? t.onboarding.summaryStagePostBirth : t.onboarding.summaryStagePregnant}
        />
        <SumRow k={t.onboarding.summaryEmployment} v={employmentLabel} />
        <SumRow k={t.onboarding.summaryLocation} v={`${profile.city || '—'}, ${profile.voivodeship}`} />
      </View>
    </View>
  );
}

function SumRow({ k, v, highlight }: { k: string; v: string; highlight?: boolean }) {
  return (
    <View className="flex-row justify-between items-baseline">
      <Text className="text-ink-soft text-[13px]">{k}</Text>
      <Text className={`${highlight ? 'font-serif text-[22px] text-evergreen' : 'text-[15px] text-ink font-sans-medium'}`}>
        {v}
      </Text>
    </View>
  );
}

function getEmploymentLabel(e: EmploymentType, t: ReturnType<typeof useT>): string {
  const labels: Record<EmploymentType, string> = {
    uop: t.onboarding.empUop,
    b2b_chorobowe: t.onboarding.empB2bSick,
    b2b_no_chorobowe: t.onboarding.empB2bNoSick,
    zlecenie_chorobowe: t.onboarding.empZlecenieSick,
    zlecenie_no_chorobowe: t.onboarding.empZlecenieNoSick,
    student: t.onboarding.empStudent,
    none: t.onboarding.empNone,
    unemployed: t.onboarding.empNone,
  };
  return labels[e] ?? e;
}
